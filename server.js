import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

process.env.TZ = 'America/Sao_Paulo';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const atualizarBanco = async () => {
  try {
    await pool.query("ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS hora_inicio TIMESTAMP");
    await pool.query("ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS status_fila VARCHAR(50) DEFAULT 'aguardando'");
    await pool.query("ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255)");
    await pool.query("ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(255)");
    await pool.query("ALTER TABLE servicos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'servico'");
    await pool.query("ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS hora_abertura VARCHAR(10)");
    await pool.query("ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS hora_fecho VARCHAR(10)");
    await pool.query("ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS ip_autorizado VARCHAR(50)");
    
    // 🚀 ATUALIZADO: Prepara a coluna para aceitar vários dias como texto (ex: "0,1")
    await pool.query("ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS dia_folga VARCHAR(50) DEFAULT ''");
    try { await pool.query("ALTER TABLE colaboradores ALTER COLUMN dia_folga TYPE VARCHAR(50) USING dia_folga::VARCHAR"); } catch(e){}
    
    console.log("✅ Banco de dados atualizado com suporte a Folgas Múltiplas!");
  } catch (e) {}
};
atualizarBanco();

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  
  // Login do Administrador Mestre
  if (email.toLowerCase() === 'admin@goldstar.com' && senha === 'g197355@') {
    return res.json({ sucesso: true, usuario: { id: 0, nome: 'Admin', perfil: 'admin', email: 'admin@goldstar.com' } });
  }
  
  try {
    // 🚀 BUSCA O UTILIZADOR INCLUINDO O DIA DE FOLGA
    const r = await pool.query('SELECT id, nome, perfil, email, senha, dia_folga FROM colaboradores WHERE LOWER(email) = LOWER($1) AND ativo = TRUE', [email]);
    
    if (r.rows.length > 0) {
      const user = r.rows[0];
      const senhaGravada = user.senha || '1234'; 
      
      if (senha === senhaGravada) {
        delete user.senha; 
        
        // 🚀 BLOQUEIOS EXCLUSIVOS DO CAIXA
        if (user.perfil === 'caixa') {
          
          // 1. VERIFICAÇÃO DO DIA DE FOLGA (AGORA SUPORTA VÁRIOS DIAS)
          const hoje = String(new Date().getDay());
          const folgas = String(user.dia_folga || '').split(','); // Transforma "0,1" numa lista
          if (folgas.includes(hoje)) {
            return res.status(403).json({ sucesso: false, erro: "Acesso bloqueado: Hoje é o seu dia de folga programada." });
          }

          // 2. VERIFICAÇÃO DE HORÁRIO E IP
          const configRes = await pool.query("SELECT hora_abertura, hora_fecho, ip_autorizado FROM configuracoes_empresa LIMIT 1");
          const regras = configRes.rows[0];

          if (regras) {
            // Regra do IP (Wi-Fi)
            if (regras.ip_autorizado && regras.ip_autorizado.trim() !== '') {
              const ipCliente = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';
              if (ipCliente.trim() !== regras.ip_autorizado.trim()) {
                return res.status(403).json({ sucesso: false, erro: "O Caixa só pode ser operado a partir do Wi-Fi do salão." });
              }
            }

            // Regra do Horário
            if (regras.hora_abertura && regras.hora_fecho) {
              const options = { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false };
              const horaAtual = new Intl.DateTimeFormat('pt-BR', options).format(new Date());

              if (horaAtual < regras.hora_abertura || horaAtual > regras.hora_fecho) {
                return res.status(403).json({ sucesso: false, erro: `Fora do horário de expediente (${regras.hora_abertura} às ${regras.hora_fecho}).` });
              }
            }
          }
        }

        // Passou em todas as barreiras, faz login com sucesso!
        return res.json({ sucesso: true, usuario: user });
      }
    }
    res.status(401).json({ sucesso: false, erro: 'E-mail ou senha incorretos' });
    
  } catch (erro) { 
    res.status(500).json({ sucesso: false, erro: 'Erro no servidor' }); 
  }
});

app.get('/api/resumo', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    
    const totais = await pool.query(`
      SELECT 
        COALESCE(SUM(a.valor_total), 0) as faturamento_bruto, 
        COALESCE(SUM(a.valor_comissao), 0) as total_comissoes, 
        COUNT(CASE WHEN s.tipo = 'servico' OR s.tipo IS NULL THEN a.id END) as total_atendimentos,
        COUNT(CASE WHEN s.tipo = 'produto' THEN a.id END) as total_produtos
      FROM atendimentos a 
      JOIN servicos s ON a.servico_id = s.id 
      WHERE a.status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2
    `, [mes, ano]);
    
    const despesasTotais = await pool.query(`SELECT COALESCE(SUM(valor), 0) as total_despesas FROM despesas WHERE pago = TRUE AND EXTRACT(MONTH FROM data_vencimento) = $1 AND EXTRACT(YEAR FROM data_vencimento) = $2`, [mes, ano]);
    
 const historico = await pool.query(`SELECT a.id, TO_CHAR(a.data_hora, 'DD/MM') as data, a.cliente_nome, s.nome as servico, s.tipo as servico_tipo, a.valor_total, c.nome as profissional, a.valor_comissao, a.status FROM atendimentos a JOIN servicos s ON a.servico_id = s.id JOIN colaboradores c ON a.colaborador_id = c.id WHERE a.status IN ('pago', 'pago_antecipado', 'cancelado') AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 ORDER BY a.data_hora DESC`, [mes, ano]);
    
    const comissoesQuery = await pool.query(`SELECT c.nome as profissional, c.perfil, COUNT(a.id) as qtd_servicos, COALESCE(SUM(a.valor_comissao), 0) as total_comissao FROM colaboradores c JOIN atendimentos a ON c.id = a.colaborador_id WHERE a.status IN ('pago', 'pago_antecipado') AND EXTRACT(MONTH FROM a.data_hora) = $1 AND EXTRACT(YEAR FROM a.data_hora) = $2 GROUP BY c.nome, c.perfil ORDER BY total_comissao DESC`, [mes, ano]);
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
  const r = await pool.query('SELECT id, nome, percentual_comissao, perfil, dia_folga FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.get('/api/colaboradores/todos', async (req, res) => {
  const r = await pool.query('SELECT id, nome, nome_completo, chave_pix, percentual_comissao, ativo, email, perfil, dia_folga FROM colaboradores ORDER BY nome ASC');
  res.json({ sucesso: true, dados: r.rows });
});

app.get('/api/exportar-equipe', async (req, res) => {
  try {
    const r = await pool.query('SELECT nome, nome_completo, email, senha, chave_pix, percentual_comissao, perfil FROM colaboradores WHERE ativo = TRUE ORDER BY nome ASC');
    res.json({ sucesso: true, dados: r.rows });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/colaboradores', async (req, res) => {
  try {
    const { apelido, nome_completo, pix, percentual_comissao } = req.body;
    const nomeLimpo = apelido.toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailProvisorio = nomeLimpo + Math.floor(Math.random() * 1000) + '@goldstar.com';
    const comissao = percentual_comissao ? Number(percentual_comissao) : 0;

    await pool.query(
      "INSERT INTO colaboradores (nome, nome_completo, chave_pix, email, percentual_comissao, perfil, ativo, senha) VALUES ($1, $2, $3, $4, $5, 'profissional', TRUE, '1234')", 
      [apelido, nome_completo, pix, emailProvisorio, comissao]
    );
    res.json({ sucesso: true });
  } catch (err) { res.status(500).json({ sucesso: false }); }
});

// ROTA CORRIGIDA (app.put)
app.put('/api/colaboradores/:id/acesso', async (req, res) => {
  try {
    const { email, perfil, senha, dia_folga } = req.body;
    const folga = dia_folga !== undefined ? dia_folga : ''; // Ajustado para string vazia se não houver folga
    
    if (senha && senha.trim() !== '') {
      await pool.query('UPDATE colaboradores SET email = $1, perfil = $2, senha = $3, dia_folga = $4 WHERE id = $5', [email, perfil, senha, folga, req.params.id]);
    } else {
      await pool.query('UPDATE colaboradores SET email = $1, perfil = $2, dia_folga = $3 WHERE id = $4', [email, perfil, folga, req.params.id]);
    }
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(500).json({ sucesso: false, erro: erro.message }); 
  }
});

app.put('/api/colaboradores/:id/comissao', async (req, res) => {
  try {
    const { percentual_comissao } = req.body;
    await pool.query('UPDATE colaboradores SET percentual_comissao = $1 WHERE id = $2', [percentual_comissao, req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/colaboradores/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comissoes_especificas WHERE colaborador_id = $1', [req.params.id]);
    await pool.query('DELETE FROM colaboradores WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { 
    res.json({ sucesso: false }); 
  }
});

app.get('/api/servicos', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, nome, preco, duracao, tipo FROM servicos WHERE ativo = TRUE ORDER BY nome ASC');
    res.json({ sucesso: true, dados: r.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/servicos', async (req, res) => {
  try {
    await pool.query('INSERT INTO servicos (nome, preco, duracao, tipo) VALUES ($1, $2, $3, $4)', [req.body.nome, req.body.preco, req.body.duracao || 0, req.body.tipo || 'servico']);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/servicos/:id', async (req, res) => {
  try {
    const { nome, preco, duracao } = req.body;
    await pool.query('UPDATE servicos SET nome = $1, preco = $2, duracao = $3 WHERE id = $4', [nome, preco, duracao, req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    await pool.query('UPDATE servicos SET ativo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false, erro: "Erro ao ocultar." }); }
});

app.get('/api/comissoes-especificas', async (req, res) => {
  const r = await pool.query(`SELECT ce.id, c.nome as prof, s.nome as serv, ce.percentual_comissao as percentual FROM comissoes_especificas ce JOIN colaboradores c ON ce.colaborador_id = c.id JOIN servicos s ON ce.servico_id = s.id`);
  res.json({ sucesso: true, dados: r.rows });
});

app.delete('/api/comissoes-especificas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comissoes_especificas WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/comissoes-especificas', async (req, res) => {
  await pool.query('INSERT INTO comissoes_especificas (colaborador_id, servico_id, percentual_comissao) VALUES ($1, $2, $3) ON CONFLICT (colaborador_id, servico_id) DO UPDATE SET percentual_comissao = $3', [req.body.colaborador_id, req.body.servico_id, req.body.percentual]);
  res.json({ sucesso: true });
});

app.post('/api/atendimentos', async (req, res) => {
  try {
    const { colaborador_id, servico_id, cliente_nome, valor_cobrado, status, data_manual } = req.body;
    
    const s = await pool.query('SELECT id, preco FROM servicos WHERE id::text = $1::text OR nome = $1::text LIMIT 1', [servico_id]);
    if (s.rows.length === 0) return res.status(400).json({ sucesso: false, erro: 'Serviço não encontrado' });
    
    const servico_real_id = s.rows[0].id; 
    const valor = (valor_cobrado !== undefined && valor_cobrado !== null && valor_cobrado !== '') ? Number(valor_cobrado) : Number(s.rows[0].preco);
    
    const esp = await pool.query('SELECT percentual_comissao FROM comissoes_especificas WHERE colaborador_id = $1 AND servico_id = $2', [colaborador_id, servico_real_id]);
    
    let percentual = 0;
    if (esp.rows.length > 0) {
      percentual = Number(esp.rows[0].percentual_comissao);
    } else {
      const padrao = await pool.query('SELECT percentual_comissao FROM colaboradores WHERE id = $1', [colaborador_id]);
      if (padrao.rows.length > 0) percentual = Number(padrao.rows[0].percentual_comissao);
    }
    
    const comissao = (valor * percentual) / 100;
    const statusFinal = status || 'pendente'; 
    const dataFinal = data_manual ? new Date(data_manual) : new Date();
    
    await pool.query('INSERT INTO atendimentos (colaborador_id, servico_id, cliente_nome, valor_total, valor_comissao, status, data_hora) VALUES ($1, $2, $3, $4, $5, $6, $7)', [colaborador_id, servico_real_id, cliente_nome, valor, comissao, statusFinal, dataFinal]);
    res.json({ sucesso: true });
  } catch (err) { res.status(500).json({sucesso: false}); }
});

app.get('/api/comandas', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.id, a.cliente_nome, s.nome as servico, s.duracao, s.tipo as servico_tipo, c.nome as profissional, 
             a.valor_total, a.valor_comissao, a.data_hora, a.status,
             a.hora_inicio, a.status_fila 
      FROM atendimentos a 
      JOIN servicos s ON a.servico_id = s.id 
      JOIN colaboradores c ON a.colaborador_id = c.id 
      WHERE a.status IN ('pendente', 'pago_antecipado') 
      ORDER BY a.data_hora ASC
    `);
    res.json({ sucesso: true, dados: r.rows });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/comandas/:id/iniciar', async (req, res) => {
  try {
    // 🚀 CORREÇÃO: Usar o "new Date()" do Node ignora o relógio de Londres (UTC) do Render e usa o fuso horário do Brasil!
    await pool.query("UPDATE atendimentos SET status_fila = 'em_atendimento', hora_inicio = $1 WHERE id = $2", [new Date(), req.params.id]);
    res.json({ sucesso: true });
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

app.put('/api/comandas/:id/cancelar', async (req, res) => {
  try {
    await pool.query("UPDATE atendimentos SET status = 'cancelado' WHERE id = $1", [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/comandas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM atendimentos WHERE id = $1', [req.params.id]);
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
    await pool.query('INSERT INTO despesas (descricao, valor, data_vencimento, fornecedor, pago, data_pagamento) VALUES ($1, $2, $3, $4, $5, $6)', [descricao, valor, data_vencimento, fornecedor, pago, dataPagto]);
    res.json({ sucesso: true });
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

app.delete('/api/despesas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM despesas WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.get('/api/vales', async (req, res) => {
  try {
    const r = await pool.query("SELECT id, profissional, descricao, valor, pago, chave_periodo, TO_CHAR(COALESCE(data_criacao, CURRENT_TIMESTAMP) AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') as data_formatada FROM vales ORDER BY id DESC");
    res.json({ sucesso: true, dados: r.rows });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.post('/api/vales', async (req, res) => {
  try {
    const { profissional, descricao, valor } = req.body;
    await pool.query('INSERT INTO vales (profissional, descricao, valor) VALUES ($1, $2, $3)', [profissional, descricao, valor]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.delete('/api/vales/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vales WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (e) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/atendimentos/:id/sinalizar-erro', async (req, res) => {
  try {
    await pool.query("UPDATE atendimentos SET cliente_nome = CONCAT(cliente_nome, ' ⚠️ ERRO-CANCELAR') WHERE id = $1 AND cliente_nome NOT LIKE '%⚠️ ERRO-CANCELAR%'", [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { res.status(500).json({ sucesso: false }); }
});

app.put('/api/colaboradores/:id/status', async (req, res) => {
  try {
    const { ativo } = req.body;
    await pool.query('UPDATE colaboradores SET ativo = $1 WHERE id = $2', [ativo, req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) { 
    res.status(500).json({ sucesso: false, erro: erro.message }); 
  }
});

app.put('/api/configuracoes', async (req, res) => {
  const { nome_fantasia, cor_primaria, logo_url, hora_abertura, hora_fecho, ip_autorizado } = req.body;
  try {
    await pool.query(
      `UPDATE configuracoes_empresa SET 
        nome_fantasia = $1, 
        cor_primaria = $2, 
        logo_url = $3, 
        hora_abertura = $4, 
        hora_fecho = $5, 
        ip_autorizado = $6`,
      [nome_fantasia, cor_primaria, logo_url, hora_abertura, hora_fecho, ip_autorizado]
    );
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});

app.get('/api/configuracoes', async (req, res) => {
  try {
    const r = await pool.query('SELECT nome_fantasia, cor_primaria, logo_url, hora_abertura, hora_fecho, ip_autorizado FROM configuracoes_empresa LIMIT 1');
    if (r.rows.length > 0) { 
      res.json({ sucesso: true, dados: r.rows[0] }); 
    } else { 
      res.json({ sucesso: true, dados: { nome_fantasia: 'Goldstar', cor_primaria: '#00C49A', logo_url: '', hora_abertura: '', hora_fecho: '', ip_autorizado: '' } }); 
    }
  } catch (erro) { 
    res.status(500).json({ sucesso: false }); 
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor na porta ${PORT}`));