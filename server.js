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

// --- ROTA DE VENDAS (Lista apenas ATIVOS) ---
app.get('/api/colaboradores', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// --- ROTA DE AJUSTES (Lista TODOS) ---
app.get('/api/colaboradores/todos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nome, percentual_comissao, ativo FROM colaboradores ORDER BY nome ASC');
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// --- ROTA DE STATUS (Bloquear/Desbloquear) ---
app.put('/api/colaboradores/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [ativo, id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

// --- DEMAIS ROTAS ---
app.get('/api/servicos', async (req, res) => {
  const r = await pool.query('SELECT * FROM servicos ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.get('/api/resumo', async (req, res) => {
  try {
    const hoje = new Date();
    const mes = req.query.mes || (hoje.getMonth() + 1);
    const ano = req.query.ano || hoje.getFullYear();
    
    const totais = await pool.query(`
      SELECT 
        COALESCE(SUM(valor_total), 0) as faturamento_bruto,
        COALESCE(SUM(valor_comissao), 0) as total_comissoes,
        COUNT(id) as total_atendimentos
      FROM atendimentos
      WHERE EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2
    `, [mes, ano]);
    
    res.json({ sucesso: true, valores: totais.rows[0] });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

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
  } catch (erro) { res.status(500).json({ sucesso: false, erro: erro.message }); }
});

// --- ESTE ERA O QUE FALTAVA ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Goldstar a rodar na porta ${PORT}`);
});