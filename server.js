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

app.get('/api/resumo', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const totais = await pool.query(`SELECT COALESCE(SUM(valor_total), 0) as faturamento_bruto, COALESCE(SUM(valor_comissao), 0) as total_comissoes, COUNT(id) as total_atendimentos FROM atendimentos WHERE status = 'pago' AND EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2`, [mes, ano]);
    const despesasTotais = await pool.query(`SELECT COALESCE(SUM(valor), 0) as total_despesas FROM despesas WHERE EXTRACT(MONTH FROM data_vencimento) = $1 AND EXTRACT(YEAR FROM data_vencimento) = $2`, [mes, ano]);
    const historico = await pool.query(`SELECT a.id, TO_CHAR(a.data_hora, 'DD/MM') as data, a.cliente_nome, s.nome as servico, a.valor_total, c.nome as profissional, a.valor_comissao FROM atendimentos a JOIN servicos s ON a.servico_id = s.id JOIN colaboradores c ON a.colaborador_id = c.id WHERE a.status = 'pago' AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 ORDER BY a.data_hora DESC LIMIT 100`, [mes, ano]);
    const comissoesQuery = await pool.query(`SELECT c.nome as profissional, COUNT(a.id) as qtd_servicos, COALESCE(SUM(a.valor_comissao), 0) as total_comissao FROM colaboradores c JOIN atendimentos a ON c.id = a.colaborador_id WHERE a.status = 'pago' AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 GROUP BY c.nome ORDER BY total_comissao DESC`, [mes, ano]);
    const topServicosQuery = await pool.query(`SELECT s.nome, COUNT(a.id) as qtd, COALESCE(SUM(a.valor_total), 0) as gerado FROM atendimentos a JOIN servicos s ON a.servico_id = s.id WHERE a.status = 'pago' AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 GROUP BY s.nome ORDER BY gerado DESC LIMIT 10`, [mes, ano]);
    const topClientesQuery = await pool.query(`SELECT cliente_nome as nome, COALESCE(SUM(valor_total), 0) as gasto FROM atendimentos WHERE status = 'pago' AND EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2 GROUP BY cliente_nome ORDER BY gasto DESC LIMIT 10`, [mes, ano]);
    
    res.json({ sucesso: true, valores: { ...totais.rows[0], total_despesas: despesasTotais.rows[0].total_despesas }, historico: historico.rows, comissoes: comissoesQuery.rows, topServicos: topServicosQuery.rows, topClientes: topClientesQuery.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/comissoes-periodo', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const resultado = await pool.query(`SELECT c.nome as profissional, COUNT(a.id) as qtd_servicos, COALESCE(SUM(a.valor_comissao), 0) as total_comissao FROM colaboradores c JOIN atendimentos a ON c.id = a.colaborador_id WHERE a.status = 'pago' AND a.data_hora::date BETWEEN $1 AND $2 GROUP BY c.nome ORDER BY total_comissao DESC`, [inicio, fim]);
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/colaboradores', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.get('/api/colaboradores/todos', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao, ativo FROM colaboradores ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.post('/api/colaboradores', async (req, res) => {
  const { nome, percentual_comissao } = req.body;
  const emailProvisorio = nome.toLowerCase().replace(/\s+/g, '') + '@goldstar.com';
  await pool.query("INSERT INTO colaboradores (nome, email, percentual_comissao, perfil, ativo) VALUES ($1, $2, $3, 'profissional', TRUE)", [nome, emailProvisorio, percentual_comissao]);
  res.json({ sucesso: true });
});

app.put('/api/colaboradores/:id/status', async (req, res) => {
  await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [req.body.ativo, req.params.id]);
  res.json({ sucesso: true });
});

app.get('/api/servicos', async (req, res) => {
  const r = await pool.query('SELECT id, nome, preco, duracao FROM servicos ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.post('/api/servicos', async (req, res) => {
  await pool.query('INSERT INTO servicos (nome, preco, duracao) VALUES ($1, $2, $3)', [req.body.nome, req.body.preco, req.body.duracao || 30]);
  res.json({ sucesso: true });
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servicos WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false, erro: "Possui histórico." }); }
});

app.get('/api/comissoes-especificas', async (req, res) => {
  const r = await pool.query(`SELECT ce.id, c.nome as prof, s.nome as serv, ce.percentual_comissao as percentual FROM comissoes_especificas ce JOIN colaboradores c ON ce.colaborador_id = c.id JOIN servicos s ON ce.servico_id = s.id`);
  res.json({ sucesso: true, dados: r.rows });
});

app.post('/api/comissoes-especificas', async (req, res) => {
  await pool.query('INSERT INTO comissoes_especificas (colaborador_id, servico_id, percentual_comissao) VALUES ($1, $2, $3) ON CONFLICT (colaborador_id, servico_id) DO UPDATE SET percentual_comissao = $3', [req.body.colaborador_id, req.body.servico_id, req.body.percentual]);
  res.json({ sucesso: true });
});

app.post('/api/atendimentos', async (req, res) => {
  try {
    const { colaborador_id, servico_id, cliente_nome, valor_cobrado, status } = req.body;
    const s = await pool.query('SELECT preco FROM servicos WHERE id = $1', [servico_id]);
    const valor = Number(valor_cobrado) || s.rows[0].preco;
    const esp = await pool.query('SELECT percentual_comissao FROM comissoes_especificas WHERE colaborador_id = $1 AND servico_id = $2', [colaborador_id, servico_id]);
    let percentual = esp.rows.length > 0 ? esp.rows[0].percentual_comissao : (await pool.query('SELECT percentual_comissao FROM colaboradores WHERE id = $1', [colaborador_id])).rows[0].percentual_comissao;
    const comissao = (valor * percentual) / 100;
    const statusFinal = status || 'pago'; 
    await pool.query('INSERT INTO atendimentos (colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao, status) VALUES ($1, $2, $3, $4, $5, $6)', [colaborador_id, servico_id, cliente_nome, valor, comissao, statusFinal]);
    res.json({ sucesso: true });
  } catch (err) { res.status(500).json({sucesso: false}) }
});

app.get('/api/comandas', async (req, res) => {
  try {
    // AQUI: Adicionado a.data_hora para o frontend saber quando a cliente chegou
    const r = await pool.query(`SELECT a.id, a.cliente_nome, s.nome as servico, s.duracao, c.nome as profissional, a.valor_total, a.valor_comissao, a.data_hora FROM atendimentos a JOIN servicos s ON a.servico_id = s.id JOIN colaboradores c ON a.colaborador_id = c.id WHERE a.status = 'pendente' ORDER BY a.data_hora ASC`);
    res.json({ sucesso: true, dados: r.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/comandas/pagar', async (req, res) => {
  try {
    const { ids } = req.body; 
    if (!ids || ids.length === 0) return res.json({ sucesso: true });
    await pool.query('UPDATE atendimentos SET status = $1 WHERE id = ANY($2)', ['pago', ids]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/pagamentos-comissoes', async (req, res) => {
  try {
    const r = await pool.query("SELECT profissional, chave_periodo, TO_CHAR(data_pagamento AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI') as data_pagto FROM pagamentos_comissoes");
    res.json({ sucesso: true, dados: r.rows });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/pagamentos-comissoes/toggle', async (req, res) => {
  try {
    const { profissional, chave_periodo } = req.body;
    const existe = await pool.query('SELECT id FROM pagamentos_comissoes WHERE chave_periodo = $1', [chave_periodo]);
    if (existe.rows.length > 0) {
      await pool.query('DELETE FROM pagamentos_comissoes WHERE chave_periodo = $1', [chave_periodo]);
    } else {
      await pool.query('INSERT INTO pagamentos_comissoes (profissional, chave_periodo) VALUES ($1, $2)', [profissional, chave_periodo]);
    }
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/despesas', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const r = await pool.query(`SELECT id, TO_CHAR(data_vencimento, 'YYYY-MM-DD') as data_vencimento, valor, descricao, fornecedor, pago, TO_CHAR(data_pagamento, 'DD/MM/YY') as data_pagamento FROM despesas WHERE EXTRACT(MONTH FROM data_vencimento) = $1 AND EXTRACT(YEAR FROM data_vencimento) = $2 ORDER BY data_vencimento ASC`, [mes, ano]);
    res.json({ sucesso: true, dados: r.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/despesas/:id/pagar', async (req, res) => {
  try {
    const { pago } = req.body;
    const dataPagto = pago ? new Date() : null;
    await pool.query('UPDATE despesas SET pago = $1, data_pagamento = $2 WHERE id = $3', [pago, dataPagto, req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor na porta ${PORT}`));