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
  ssl: { rejectUnauthorized: false }
});

// Rota para o Painel Principal
app.get('/api/resumo', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const totais = await pool.query(`
      SELECT 
        COALESCE(SUM(valor_total), 0) as faturamento_bruto,
        COALESCE(SUM(valor_comissao), 0) as total_comissoes,
        COUNT(id) as total_atendimentos
      FROM atendimentos
      WHERE EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2
    `, [mes, ano]);
    res.json({ sucesso: true, valores: totais.rows[0] });
  } catch (erro) { res.status(500).json({ sucesso: false, erro: erro.message }); }
});

// Rota para filtrar comissões por período (Aba 2)
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
    res.status(500).json({ sucesso: false, erro: "Erro ao calcular comissões" });
  }
});

// Rotas de Colaboradores e Serviços
app.get('/api/colaboradores', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.get('/api/colaboradores/todos', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao, ativo FROM colaboradores ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.put('/api/colaboradores/:id/status', async (req, res) => {
  await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [req.body.ativo, req.params.id]);
  res.json({ sucesso: true });
});

app.get('/api/servicos', async (req, res) => {
  const r = await pool.query('SELECT * FROM servicos ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

// Registro de Atendimentos com Lógica de Comissão
app.post('/api/atendimentos', async (req, res) => {
  try {
    const { colaborador_id, servico_id, cliente_nome, valor_cobrado } = req.body;
    const s = await pool.query('SELECT preco FROM servicos WHERE id = $1', [servico_id]);
    const valor = Number(valor_cobrado) || s.rows[0].preco;
    
    const esp = await pool.query('SELECT percentual_comissao FROM comissoes_especificas WHERE colaborador_id = $1 AND servico_id = $2', [colaborador_id, servico_id]);
    let percentual;
    if (esp.rows.length > 0) {
      percentual = esp.rows[0].percentual_comissao;
    } else {
      const c = await pool.query('SELECT percentual_comissao FROM colaboradores WHERE id = $1', [colaborador_id]);
      percentual = c.rows[0].percentual_comissao;
    }

    const comissao = (valor * percentual) / 100;
    await pool.query('INSERT INTO atendimentos (colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao) VALUES ($1, $2, $3, $4, $5)', [colaborador_id, servico_id, cliente_nome, valor, comissao]);
    res.json({ sucesso: true });
  } catch (err) { res.status(500).json({sucesso: false}) }
});

// --- AS ROTAS DE COMISSÕES ESPECIAIS (A causa do erro 404) ---
app.get('/api/comissoes-especificas', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ce.id, c.nome as prof, s.nome as serv, ce.percentual_comissao as percentual 
      FROM comissoes_especificas ce
      JOIN colaboradores c ON ce.colaborador_id = c.id
      JOIN servicos s ON ce.servico_id = s.id`);
    res.json({ sucesso: true, dados: r.rows });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/comissoes-especificas', async (req, res) => {
  try {
    const { colaborador_id, servico_id, percentual } = req.body;
    await pool.query(
      'INSERT INTO comissoes_especificas (colaborador_id, servico_id, percentual_comissao) VALUES ($1, $2, $3) ON CONFLICT (colaborador_id, servico_id) DO UPDATE SET percentual_comissao = $3',
      [colaborador_id, servico_id, percentual]
    );
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor na porta ${PORT}`));