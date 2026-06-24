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

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  if (email.toLowerCase() === 'admin@goldstar.com' && senha === 'g197355@') {
    return res.json({ sucesso: true, usuario: { id: 0, nome: 'Admin', perfil: 'admin', email: 'admin@goldstar.com' } });
  }
  try {
    const r = await pool.query('SELECT id, nome, perfil, email, senha FROM colaboradores WHERE LOWER(email) = LOWER($1) AND ativo = TRUE', [email]);
    if (r.rows.length > 0) {
      const user = r.rows[0];
      const senhaGravada = user.senha || '1234'; 
      if (senha === senhaGravada) {
        delete user.senha; 
        return res.json({ sucesso: true, usuario: user });
      }
    }
    res.status(401).json({ sucesso: false, erro: 'E-mail ou senha incorretos' });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/resumo', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    
    const totais = await pool.query(`SELECT COALESCE(SUM(valor_total), 0) as faturamento_bruto, COALESCE(SUM(valor_comissao), 0) as total_comissoes, COUNT(id) as total_atendimentos FROM atendimentos WHERE status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2`, [mes, ano]);
    
    const despesasTotais = await pool.query(`SELECT COALESCE(SUM(valor), 0) as total_despesas FROM despesas WHERE pago = TRUE AND EXTRACT(MONTH FROM data_vencimento) = $1 AND EXTRACT(YEAR FROM data_vencimento) = $2`, [mes, ano]);
    
    const historico = await pool.query(`SELECT a.id, TO_CHAR(a.data_hora, 'DD/MM') as data, a.cliente_nome, s.nome as servico, a.valor_total, c.nome as profissional, a.valor_comissao FROM atendimentos a JOIN servicos s ON a.servico_id = s.id JOIN colaboradores c ON a.colaborador_id = c.id WHERE a.status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 ORDER BY a.data_hora DESC LIMIT 100`, [mes, ano]);
    const comissoesQuery = await pool.query(`SELECT c.nome as profissional, COUNT(a.id) as qtd_servicos, COALESCE(SUM(a.valor_comissao), 0) as total_comissao FROM colaboradores c JOIN atendimentos a ON c.id = a.colaborador_id WHERE a.status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 GROUP BY c.nome ORDER BY total_comissao DESC`, [mes, ano]);
    const topServicosQuery = await pool.query(`SELECT s.nome, COUNT(a.id) as qtd, COALESCE(SUM(a.valor_total), 0) as gerado FROM atendimentos a JOIN servicos s ON a.servico_id = s.id WHERE a.status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 GROUP BY s.nome ORDER BY gerado DESC LIMIT 10`, [mes, ano]);
    const topClientesQuery = await pool.query(`SELECT cliente_nome as nome, COALESCE(SUM(valor_total), 0) as gasto FROM atendimentos WHERE status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM data_hora) = $1 AND EXTRACT(YEAR FROM data_hora) = $2 GROUP BY cliente_nome ORDER BY gasto DESC LIMIT 10`, [mes, ano]);
    
    res.json({ sucesso: true, valores: { ...totais.rows[0], total_despesas: despesasTotais.rows[0].total_despesas }, historico: historico.rows, comissoes: comissoesQuery.rows, topServicos: topServicosQuery.rows, topClientes: topClientesQuery.rows });
  } catch (erro) { 
    res.status(500).json({ sucesso: false }); 
  }
});

app.get('/api/comissoes-periodo', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const resultado = await pool.query(`SELECT c.nome as profissional, COUNT(a.id) as qtd_servicos, COALESCE(SUM(a.valor_comissao), 0) as total_comissao FROM colaboradores c JOIN atendimentos a ON c.id = a.colaborador_id WHERE a.status IN ('pago', 'pago_antecipado') AND a.data_hora::date BETWEEN $1 AND $2 GROUP BY c.nome ORDER BY total_comissao DESC`, [inicio, fim]);
    res.json({ sucesso: true, dados: resultado.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/colaboradores', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.get('/api/colaboradores/todos', async (req, res) => {
  const r = await pool.query('SELECT id, nome, percentual_comissao, ativo, email, perfil FROM colaboradores ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.post('/api/colaboradores', async (req, res) => {
  const { nome, percentual_comissao } = req.body;
  const emailProvisorio = nome.toLowerCase().replace(/\s+/g, '') + '@goldstar.com';
  await pool.query("INSERT INTO colaboradores (nome, email, percentual_comissao, perfil, ativo) VALUES ($1, $2, $3, 'profissional', TRUE)", [nome, emailProvisorio, percentual_comissao]);
  res.json({ sucesso: true });
});

app.put('/api/colaboradores/:id/acesso', async (req, res) => {
  try {
    const { email, perfil, senha } = req.body;
    if (senha && senha.trim() !== '') {
      await pool.query('UPDATE colaboradores SET email = $1, perfil = $2, senha = $3 WHERE id = $4', [email, perfil, senha, req.params.id]);
    } else {
      await pool.query('UPDATE colaboradores SET email = $1, perfil = $2 WHERE id = $3', [email, perfil, req.params.id]);
    }
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/colaboradores/:id/comissao', async (req, res) => {
  try {
    const { percentual_comissao } = req.body;
    await pool.query('UPDATE colaboradores SET percentual_comissao = $1 WHERE id = $2', [percentual_comissao, req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/colaboradores/:id/status', async (req, res) => {
  await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [req.body.ativo, req.params.id]);
  res.json({ sucesso: true });
});

app.get('/api/servicos', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, nome, preco, duracao FROM servicos WHERE ativo = TRUE ORDER BY nome ASC');
    res.json({ sucesso: true, dados: r.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/servicos', async (req, res) => {
  try {
    await pool.query('INSERT INTO servicos (nome, preco, duracao) VALUES ($1, $2, $3)', [req.body.nome, req.body.preco, req.body.duracao || 30]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    await pool.query('UPDATE servicos SET ativo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false, erro: "Erro ao ocultar o serviço." }); }
});

app.get('/api/comissoes-especificas', async (req, res) => {
  const r = await pool.query(`SELECT ce.id, c.nome as prof, s.nome as serv, ce.percentual_comissao as percentual FROM comissoes_especificas ce JOIN colaboradores c ON ce.colaborador_id = c.id JOIN servicos s ON ce.servico_id = s.id`);
  res.json({ sucesso: true, dados: r.rows });
});

app.delete('/api/comissoes-especificas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comissoes_especificas WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(500).json({ sucesso: false }); 
  }
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
    const r = await pool.query(`
      SELECT a.id, a.cliente_nome, s.nome as servico, s.duracao, c.nome as profissional, 
             a.valor_total, a.valor_comissao, a.data_hora, a.status 
      FROM atendimentos a 
      JOIN servicos s ON a.servico_id = s.id 
      JOIN colaboradores c ON a.colaborador_id = c.id 
      WHERE a.status IN ('pendente', 'pago_antecipado') 
      ORDER BY a.data_hora ASC
    `);
    res.json({ sucesso: true, dados: r.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/comandas/pagar', async (req, res) => {
  try {
    const { ids, statusNovo } = req.body; 
    if (!ids || ids.length === 0) return res.json({ sucesso: true });
    const st = statusNovo || 'pago';
    await pool.query('UPDATE atendimentos SET status = $1 WHERE id = ANY($2)', [st, ids]);
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
      await pool.query('UPDATE vales SET pago = FALSE, chave_periodo = NULL WHERE chave_periodo = $1', [chave_periodo]);
    } else {
      await pool.query('INSERT INTO pagamentos_comissoes (profissional, chave_periodo) VALUES ($1, $2)', [profissional, chave_periodo]);
      await pool.query('UPDATE vales SET pago = TRUE, chave_periodo = $1 WHERE profissional = $2 AND pago = FALSE', [chave_periodo, profissional]);
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

app.post('/api/despesas', async (req, res) => {
  try {
    const { descricao, valor, data_vencimento, fornecedor, pago } = req.body;
    const dataPagto = pago ? new Date() : null;
    await pool.query(
      'INSERT INTO despesas (descricao, valor, data_vencimento, fornecedor, pago, data_pagamento) VALUES ($1, $2, $3, $4, $5, $6)',
      [descricao, valor, data_vencimento, fornecedor, pago, dataPagto]
    );
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(500).json({ sucesso: false }); 
  }
});

app.put('/api/despesas/:id/pagar', async (req, res) => {
  try {
    const { pago } = req.body;
    const dataPagto = pago ? new Date() : null;
    await pool.query('UPDATE despesas SET pago = $1, data_pagamento = $2 WHERE id = $3', [pago, dataPagto, req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/despesas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM despesas WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(500).json({ sucesso: false }); 
  }
});

app.get('/api/vales', async (req, res) => {
  try {
    const r = await pool.query("SELECT id, profissional, descricao, valor, pago, chave_periodo, TO_CHAR(COALESCE(data_criacao, CURRENT_TIMESTAMP) AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') as data_formatada FROM vales ORDER BY id DESC");
    res.json({ sucesso: true, dados: r.rows });
  } catch (e) { 
    res.status(500).json({ sucesso: false }); 
  }
});

app.post('/api/vales', async (req, res) => {
  try {
    const { profissional, descricao, valor } = req.body;
    await pool.query('INSERT INTO vales (profissional, descricao, valor) VALUES ($1, $2, $3)', [profissional, descricao, valor]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

// 🚀 O ERRO ESTAVA AQUI: Mudamos "comandas" para "atendimentos"
app.delete('/api/comandas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM atendimentos WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(500).json({ sucesso: false }); 
  }
});

// Apagar um colaborador (Só funciona se ele não tiver gerado histórico)
app.delete('/api/colaboradores/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM colaboradores WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(400).json({ sucesso: false, mensagem: "Possui histórico" }); 
  }
});

app.delete('/api/vales/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vales WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

// 🚩 Rota para o Caixa sinalizar que lançou um atendimento errado
app.put('/api/atendimentos/:id/sinalizar-erro', async (req, res) => {
  try {
    // Adiciona a etiqueta de erro ao nome do cliente (apenas se ainda não a tiver)
    await pool.query(
      "UPDATE atendimentos SET cliente_nome = CONCAT(cliente_nome, ' ⚠️ ERRO-CANCELAR') WHERE id = $1 AND cliente_nome NOT LIKE '%⚠️ ERRO-CANCELAR%'", 
      [req.params.id]
    );
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ sucesso: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor na porta ${PORT}`));