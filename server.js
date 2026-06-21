import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na base de dados:', err);
});

// --- ROTA DE TESTE ---
app.get('/api/teste-conexao', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW() as hora_atual');
    res.json({ sucesso: true, mensagem: "Ligado ao Neon com sucesso!", dados: resultado.rows[0] });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Falha na ligação com a base de dados" });
  }
});

// --- ROTA PRINCIPAL: RESUMO DO SALÃO (COM FILTRO DE MÊS/ANO) ---
app.get('/api/resumo', async (req, res) => {
  try {
    const hoje = new Date();
    const mes = req.query.mes || (hoje.getMonth() + 1);
    const ano = req.query.ano || hoje.getFullYear();

    // 1. Faturamento Total Filtrado
    const totaisQuery = await pool.query(`
      SELECT 
        COALESCE(SUM(valor_total), 0) as faturamento_bruto,
        COALESCE(SUM(valor_comissao), 0) as total_comissoes,
        COUNT(id) as total_atendimentos
      FROM atendimentos
      WHERE EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2
    `, [mes, ano]);

    // 2. Histórico Filtrado
    const historicoQuery = await pool.query(`
      SELECT 
        a.id, TO_CHAR(a.data_hora, 'DD/MM') as data,
        a.cliente_nome, s.nome as servico, a.valor_total,
        c.nome as profissional, a.valor_comissao
      FROM atendimentos a
      JOIN servicos s ON a.servico_id = s.id
      JOIN colaboradores c ON a.colaborador_id = c.id
      WHERE EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2
      ORDER BY a.data_hora DESC LIMIT 100
    `, [mes, ano]);

    // 3. Comissões Filtradas (Mensal padrão)
    const comissoesQuery = await pool.query(`
      SELECT 
        c.nome as profissional,
        COUNT(a.id) as qtd_servicos,
        COALESCE(SUM(a.valor_comissao), 0) as total_comissao
      FROM colaboradores c
      JOIN atendimentos a ON c.id = a.colaborador_id
      WHERE EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2
      GROUP BY c.nome
      ORDER BY total_comissao DESC
    `, [mes, ano]);

    // 4. Top Serviços Filtrados
    const topServicosQuery = await pool.query(`
      SELECT 
        s.nome, COUNT(a.id) as qtd, COALESCE(SUM(a.valor_total), 0) as gerado
      FROM atendimentos a
      JOIN servicos s ON a.servico_id = s.id
      WHERE EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2
      GROUP BY s.nome
      ORDER BY gerado DESC LIMIT 3
    `, [mes, ano]);

    // 5. Top Clientes VIP Filtrados
    const topClientesQuery = await pool.query(`
      SELECT 
        cliente_nome as nome, COALESCE(SUM(valor_total), 0) as gasto
      FROM atendimentos
      WHERE EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2
      GROUP BY cliente_nome
      ORDER BY gasto DESC LIMIT 3
    `, [mes, ano]);

    res.json({
      sucesso: true,
      valores: totaisQuery.rows[0],
      historico: historicoQuery.rows,
      comissoes: comissoesQuery.rows,
      topServicos: topServicosQuery.rows,
      topClientes: topClientesQuery.rows
    });

  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Falha ao buscar os dados financeiros" });
  }
});

// --- NOVA ROTA: BUSCAR COMISSÕES POR PERÍODO CUSTOMIZADO (DATA INÍCIO E FIM) ---
app.get('/api/comissoes-periodo', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const resultado = await pool.query(`
      SELECT 
        c.nome as profissional,
        COUNT(a.id) as qtd_servicos,
        COALESCE(SUM(a.valor_comissao), 0) as total_comissao
      FROM colaboradores c
      JOIN atendimentos a ON c.id = a.colaborador_id
      WHERE a.data_hora::date BETWEEN $1 AND $2
      GROUP BY c.nome
      ORDER BY total_comissao DESC
    `, [inicio, fim]);
    
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) {
    console.error("❌ Erro ao buscar comissões por período:", erro);
    res.status(500).json({ sucesso: false, erro: "Erro ao calcular comissões do período" });
  }
});

// --- ROTA: Adicionar Novo Atendimento ---
app.post('/api/atendimentos', async (req, res) => {
  try {
    const { colaborador_id, servico_id, cliente_nome, valor_cobrado } = req.body;

    let valor_total = Number(valor_cobrado);
    if (!valor_total) {
      const servicoQuery = await pool.query('SELECT preco FROM servicos WHERE id = $1', [servico_id]);
      valor_total = servicoQuery.rows[0].preco;
    }

    const colabQuery = await pool.query('SELECT percentual_comissao FROM colaboradores WHERE id = $1', [colaborador_id]);
    const percentual = colabQuery.rows[0].percentual_comissao;

    const valor_comissao = (valor_total * percentual) / 100;

    await pool.query(
      `INSERT INTO atendimentos (colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao) 
       VALUES ($1, $2, $3, $4, $5)`,
      [colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao]
    );

    res.json({ sucesso: true, mensagem: "Atendimento guardado com sucesso!" });

  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Falha ao guardar na base de dados" });
  }
});

// --- ROTAS DE GESTÃO DE SERVIÇOS ---
app.get('/api/servicos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM servicos ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao buscar serviços" });
  }
});

app.post('/api/servicos', async (req, res) => {
  try {
    const { nome, preco } = req.body;
    await pool.query('INSERT INTO servicos (nome, preco) VALUES ($1, $2)', [nome, preco]);
    res.json({ sucesso: true, mensagem: "Serviço cadastrado com sucesso!" });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao cadastrar serviço" });
  }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM servicos WHERE id = $1', [id]);
    res.json({ sucesso: true, mensagem: "Serviço removido com sucesso!" });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Não é possível apagar um serviço com histórico associado." });
  }
});

// --- ROTAS DE GESTÃO DE COLABORADORES ---
app.get('/api/colaboradores', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao buscar colaboradores" });
  }
});

app.post('/api/colaboradores', async (req, res) => {
  try {
    const { nome, percentual_comissao } = req.body;
    const emailProvisorio = nome.toLowerCase().replace(/\s+/g, '') + '@goldstar.com';
    await pool.query(
      "INSERT INTO colaboradores (nome, email, percentual_comissao, perfil) VALUES ($1, $2, $3, 'profissional')",
      [nome, emailProvisorio, percentual_comissao]
    );
    res.json({ sucesso: true, mensagem: "Profissional cadastrado com sucesso!" });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao cadastrar profissional" });
  }
});

app.delete('/api/colaboradores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM colaboradores WHERE id = $1', [id]);
    res.json({ sucesso: true, mensagem: "Profissional removido com sucesso!" });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Não é possível apagar um profissional com histórico associado." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});