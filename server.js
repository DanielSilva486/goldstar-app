import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.DATABASE_URL) {
  console.error("🚨 ALERTA CRÍTICO: A DATABASE_URL não foi encontrada!");
} else {
  console.log("✅ DATABASE_URL identificada com sucesso!");
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na base de dados:', err);
});

// --- ROTA PRINCIPAL: RESUMO DO SALÃO ---
app.get('/api/resumo', async (req, res) => {
  try {
    const hoje = new Date();
    const mes = req.query.mes || (hoje.getMonth() + 1);
    const ano = req.query.ano || hoje.getFullYear();

    const totaisQuery = await pool.query(`
      SELECT 
        COALESCE(SUM(valor_total), 0) as faturamento_bruto,
        COALESCE(SUM(valor_comissao), 0) as total_comissoes,
        COUNT(id) as total_atendimentos
      FROM atendimentos
      WHERE EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2
    `, [mes, ano]);

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

    const topServicosQuery = await pool.query(`
      SELECT 
        s.nome, COUNT(a.id) as qtd, COALESCE(SUM(a.valor_total), 0) as gerado
      FROM atendimentos a
      JOIN servicos s ON a.servico_id = s.id
      WHERE EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2
      GROUP BY s.nome
      ORDER BY gerado DESC LIMIT 3
    `, [mes, ano]);

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
    console.error("❌ ERRO REAL AO BUSCAR RESUMO:", erro.message);
    res.status(500).json({ sucesso: false, erro: "Falha ao buscar os dados financeiros" });
  }
});

app.get('/api/comissoes-periodo', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const resultado = await pool.query(`
      SELECT c.nome as profissional, COUNT(a.id) as qtd_servicos, COALESCE(SUM(a.valor_comissao), 0) as total_comissao
      FROM colaboradores c JOIN atendimentos a ON c.id = a.colaborador_id
      WHERE a.data_hora::date BETWEEN $1 AND $2 GROUP BY c.nome ORDER BY total_comissao DESC
    `, [inicio, fim]);
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Erro ao calcular comissões do período" });
  }
});

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
      `INSERT INTO atendimentos (colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao) VALUES ($1, $2, $3, $4, $5)`,
      [colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao]
    );
    res.json({ sucesso: true, mensagem: "Atendimento guardado!" });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: "Falha ao guardar na base de dados" });
  }
});

app.get('/api/servicos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM servicos ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false, erro: "Erro" }); }
});

app.post('/api/servicos', async (req, res) => {
  try {
    const { nome, preco } = req.body;
    await pool.query('INSERT INTO servicos (nome, preco) VALUES ($1, $2)', [nome, preco]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM servicos WHERE id = $1', [id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false, erro: "Possui histórico." }); }
});

// --- EQUIPE: Rota para a TELA DE VENDAS (Só mostra Ativos) ---
app.get('/api/colaboradores', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// --- EQUIPE: Rota para a TELA DE CONFIGURAÇÕES (Mostra Todos) ---
app.get('/api/colaboradores/todos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nome, percentual_comissao, ativo FROM colaboradores ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/colaboradores', async (req, res) => {
  try {
    const { nome, percentual_comissao } = req.body;
    const emailProvisorio = nome.toLowerCase().replace(/\s+/g, '') + '@goldstar.com';
    await pool.query(
      "INSERT INTO colaboradores (nome, email, percentual_comissao, perfil, ativo) VALUES ($1, $2, $3, 'profissional', TRUE)",
      [nome, emailProvisorio, percentual_comissao]
    );
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// --- NOVO: Rota para Mudar o Status (Desativar/Reativar) ---
app.put('/api/colaboradores/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [ativo, id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});