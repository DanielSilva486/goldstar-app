import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Rota para o Painel Principal (Corrigindo o erro 404)
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

// Rota de Vendas (Lista apenas ATIVOS)
app.get('/api/colaboradores', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

// Rota de Ajustes (Lista TODOS)
app.get('/api/colaboradores/todos', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao, ativo FROM colaboradores ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

// Rota de Status
app.put('/api/colaboradores/:id/status', async (req, res) => {
  await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [req.body.ativo, req.params.id]);
  res.json({ sucesso: true });
});

app.get('/api/servicos', async (req, res) => {
  const r = await pool.query('SELECT * FROM servicos ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.post('/api/atendimentos', async (req, res) => {
  const { colaborador_id, servico_id, cliente_nome, valor_cobrado } = req.body;
  const s = await pool.query('SELECT preco FROM servicos WHERE id = $1', [servico_id]);
  const c = await pool.query('SELECT percentual_comissao FROM colaboradores WHERE id = $1', [colaborador_id]);
  const valor = Number(valor_cobrado) || s.rows[0].preco;
  const comissao = (valor * c.rows[0].percentual_comissao) / 100;
  await pool.query('INSERT INTO atendimentos (colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao) VALUES ($1, $2, $3, $4, $5)', [colaborador_id, servico_id, cliente_nome, valor, comissao]);
  res.json({ sucesso: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor na porta ${PORT}`));