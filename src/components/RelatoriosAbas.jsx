import React, { useState, useEffect } from 'react';
import ModalNovaDespesa from './ModalNovaDespesa';
import ModalNovoVale from './ModalNovoVale';
import LinhaDoTempo from './LinhaDoTempo';
import ModalNovoAtendimento from './ModalNovoAtendimento'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 🚀 SAAS: COMPONENTE DE ETIQUETA PARA FORMA DE PAGAMENTO
const BadgePagamento = ({ forma }) => {
  const formaLimpa = forma || 'Dinheiro';
  const cores = {
    'Pix': 'bg-purple-100 text-purple-700 border-purple-200',
    'Cartão': 'bg-blue-100 text-blue-700 border-blue-200',
    'Dinheiro': 'bg-green-100 text-green-700 border-green-200'
  };
  
  const icone = formaLimpa === 'Pix' ? '📱' : formaLimpa === 'Cartão' ? '💳' : '💲';
  
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border shadow-sm flex items-center justify-center gap-1 w-max mx-auto ${cores[formaLimpa] || cores['Dinheiro']}`}>
      <span>{icone}</span> {formaLimpa}
    </span>
  );
};

export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo, usuario }) {
  const isAdmin = usuario?.perfil === 'admin' || usuario?.perfil === 'dono';
  const isCaixa = usuario?.perfil === 'caixa' || usuario?.perfil === 'dono'; 
  const isProfissional = usuario?.perfil === 'profissional';
  const podeVerCaixa = isAdmin || isCaixa;

  const [abaAtiva, setAbaAtiva] = useState(podeVerCaixa ? 0 : 1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [pagamentosDb, setPagamentosDb] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [vales, setVales] = useState([]);
  
  const [mostrarNovaDespesa, setMostrarNovaDespesa] = useState(false);
  const [mostrarNovoVale, setMostrarNovoVale] = useState(false);
  
  const [clienteParaExtra, setClienteParaExtra] = useState(null); 
  const [confirmacao, setConfirmacao] = useState({ aberto: false, titulo: '', mensagem: '', onConfirm: null });

  const [filtroProfAba1, setFiltroProfAba1] = useState('');
  const [filtroDataAba1, setFiltroDataAba1] = useState('');

  const pedirConfirmacao = (titulo, mensagem, acao) => setConfirmacao({ aberto: true, titulo, mensagem, onConfirm: acao });

  const nomeLimpoUsuario = String(usuario?.nome || '').trim().toLowerCase();
  
  const historicoGeral = dados?.historico || [];
  const historicoBase = isProfissional ? historicoGeral.filter(h => String(h.profissional).trim().toLowerCase() === nomeLimpoUsuario) : historicoGeral;
  
  let historico = historicoBase;
  if (filtroProfAba1) historico = historico.filter(h => h.profissional === filtroProfAba1);
  if (filtroDataAba1) {
    const partesData = filtroDataAba1.split('-');
    if (partesData.length === 3) {
      const dataFormatada = `${partesData[2]}/${partesData[1]}`;
      historico = historico.filter(h => h.data && h.data.includes(dataFormatada));
    }
  }

  const profissionaisUnicos = [...new Set(historicoBase.map(item => item.profissional).filter(Boolean))];
  const totalFaturadoAba1 = historico.reduce((acc, item) => acc + (item.status === 'cancelado' || item.cliente_nome.includes('⚠️ ERRO') ? 0 : Number(item.valor_total)), 0);
  const totalComissaoAba1 = historico.reduce((acc, item) => acc + (item.status === 'cancelado' || item.cliente_nome.includes('⚠️ ERRO') ? 0 : Number(item.valor_comissao)), 0);

  const comissoesGerais = dados?.comissoes || [];
  const comissoesMensais = isProfissional ? comissoesGerais.filter(c => String(c.profissional).trim().toLowerCase() === nomeLimpoUsuario) : comissoesGerais;
  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = Number(valores.total_despesas || 0); 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;
  const comissoesDoDono = comissoesGerais.filter(c => c.perfil === 'dono');
  const comissaoDona = comissoesDoDono.reduce((acc, curr) => acc + Number(curr.total_comissao), 0);
  const lucroOperacional = lucroLiquido + comissaoDona;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarTempo = (minutosTotal) => {
    const horas = Math.floor(minutosTotal / 60);
    const min = minutosTotal % 60;
    return horas > 0 ? `${horas}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  const idSaaS = usuario?.empresa_id || 1;

  const carregarDadosExtras = async () => {
    try {
      const resPagamentos = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes?empresa_id=${idSaaS}`);
      const jsonPagamentos = await resPagamentos.json();
      if(jsonPagamentos.sucesso) setPagamentosDb(jsonPagamentos.dados);
      
      const resVales = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/vales?empresa_id=${idSaaS}`);
      const jsonVales = await resVales.json();
      if(jsonVales.sucesso) setVales(jsonVales.dados);
      
      if (isAdmin) {
        const resDespesas = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas?mes=${mes}&ano=${ano}&empresa_id=${idSaaS}`);
        const jsonDespesas = await resDespesas.json();
        if(jsonDespesas.sucesso) setDespesas(jsonDespesas.dados);
      }
      if (podeVerCaixa) {
        const resColab = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores?empresa_id=${idSaaS}`);
        const jsonColab = await resColab.json();
        if(jsonColab.sucesso) setColaboradores(jsonColab.dados);
      }
    } catch (e) {}
  };

  useEffect(() => { carregarDadosExtras(); }, [mes, ano, isAdmin, idSaaS]);

  const dadosGraficoBrutos = {};
  historicoGeral.forEach(item => {
    if (item.status === 'cancelado' || item.cliente_nome.includes('⚠️ ERRO')) return;
    const data = item.data; 
    if (!dadosGraficoBrutos[data]) {
      dadosGraficoBrutos[data] = { nome: data, Serviços: 0, Produtos: 0 };
    }
    if (item.servico_tipo === 'produto') {
      dadosGraficoBrutos[data].Produtos += Number(item.valor_total);
    } else {
      dadosGraficoBrutos[data].Serviços += Number(item.valor_total);
    }
  });

  const dadosGrafico = Object.values(dadosGraficoBrutos).sort((a, b) => {
    const [diaA, mesA] = a.nome.split('/');
    const [diaB, mesB] = b.nome.split('/');
    return new Date(ano, mesA - 1, diaA) - new Date(ano, mesB - 1, diaB);
  });


  const filtrarComissoesPeriodo = async () => {
    if (!dataInicio || !dataFim) return;
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-periodo?inicio=${dataInicio}&fim=${dataFim}&empresa_id=${idSaaS}`);
      const json = await res.json();
      if (json.sucesso) {
         const filtrado = isProfissional ? json.dados.filter(c => String(c.profissional).trim().toLowerCase() === nomeLimpoUsuario) : json.dados;
         setComissoesFiltradas(filtrado);
      }
    } catch (e) {}
  };
  
  const limparFiltroPeriodo = () => { setDataInicio(''); setDataFim(''); setComissoesFiltradas(null); };

  const alternarStatusPagamento = async (profissional, chaveUnica) => {
    if (!isAdmin) return;
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profissional, chave_periodo: chaveUnica, empresa_id: idSaaS }) });
      carregarDadosExtras(); 
    } catch (e) {}
  };

  const marcarDespesaPaga = async (id, statusAtual) => {
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas/${id}/pagar`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pago: !statusAtual }) });
      carregarDadosExtras(); recarregarTudo(); 
    } catch (e) {}
  };

  const apagarDespesa = (id) => pedirConfirmacao("Apagar Despesa", "Tem a certeza que deseja apagar esta despesa? O valor será recalculado imediatamente.", async () => {
    await fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas/${id}`, { method: 'DELETE' });
    carregarDadosExtras(); recarregarTudo();
  });

  const apagarVale = (id) => pedirConfirmacao("Remover Desconto", "Deseja realmente apagar este vale/desconto da comissão?", async () => {
    await fetch(`https://goldstar-backend-9m2p.onrender.com/api/vales/${id}`, { method: 'DELETE' });
    carregarDadosExtras();
  });

  const apagarHistorico = (id) => pedirConfirmacao("Excluir Definitivamente", "ATENÇÃO: Deseja destruir este registro do banco de dados? O financeiro será recalculado e não há como recuperar.", async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas/${id}`, { method: 'DELETE' });
      if (res.ok) recarregarTudo();
    } catch(e) {}
  });

  const cancelarItemFila = (id, nomeServico) => pedirConfirmacao(
    "Cancelar Item",
    `Deseja cancelar o item "${nomeServico}"? O profissional ficará livre e o registro aparecerá como CANCELADO no Histórico.`,
    async () => {
      try {
        await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas/${id}/cancelar`, { method: 'PUT' });
        recarregarTudo();
      } catch(e) {}
    }
  );

  const cancelarAtendimentosFila = (itens) => pedirConfirmacao(
    "Cancelar Ficha",
    "A cliente desistiu e foi embora? Os itens sairão da fila, mas ficarão registados no Histórico Geral com uma tarja de CANCELADO para sua segurança.",
    async () => {
      try {
        for (const item of itens) {
           await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas/${item.id}/cancelar`, { method: 'PUT' });
        }
        recarregarTudo();
      } catch(e) {}
    }
  );

  const sinalizarErroAtendimento = (id) => pedirConfirmacao("Sinalizar Erro", "Deseja marcar este atendimento como 'ERRO' para o Administrador cancelar?", async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/atendimentos/${id}/sinalizar-erro`, { method: 'PUT' });
      if (res.ok) recarregarTudo();
    } catch(e) {}
  });

  // 🚀 LÓGICA DE PAGAMENTO ATUALIZADA
  const atualizarStatusComanda = async (itensDaComanda, statusNovo, formaPagamento = 'Dinheiro') => {
    const ids = itensDaComanda.map(item => item.id);
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas/pagar', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ids, statusNovo, formaPagamento })
      });
      recarregarTudo(); 
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  };

  const iniciarServico = async (id) => {
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas/${id}/iniciar`, { method: 'PUT' });
      recarregarTudo();
    } catch(e) {}
  };

  const imprimirComprovante = async (nomeCliente, itens) => {
    let nomeDaEmpresa = "SISTEMA DE GESTÃO";
    try {
      const resConf = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/configuracoes?empresa_id=${idSaaS}`);
      const jsonConf = await resConf.json();
      if (jsonConf.sucesso && jsonConf.dados?.nome_fantasia) {
        nomeDaEmpresa = jsonConf.dados.nome_fantasia;
      }
    } catch (e) {}

    const valorTotal = itens.reduce((soma, item) => soma + Number(item.valor_total), 0);
    const valorJaPago = itens.reduce((soma, item) => item.status === 'pago_antecipado' ? soma + Number(item.valor_total) : soma, 0);
    const dataAtual = new Date().toLocaleString('pt-BR');

    let html = `
      <html>
        <head>
          <title>Recibo - ${nomeCliente}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            h1 { text-align: center; margin-bottom: 2px; font-size: 20px; text-transform: uppercase; font-weight: 900; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 13px; font-weight: normal; letter-spacing: 1px; }
            p { text-align: center; font-size: 12px; margin-top: 5px; color: #444; }
            .divisor { border-bottom: 1px dashed #000; margin: 10px 0; }
            .info { font-size: 12px; margin-bottom: 5px; }
            table { width: 100%; font-size: 12px; text-align: left; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 4px 0; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .total-box { margin-top: 15px; font-size: 14px; text-align: right; }
            .total-final { font-size: 18px; font-weight: 900; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
            .rodape { text-align: center; font-size: 11px; margin-top: 20px; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>${nomeDaEmpresa}</h1>
          <h2>RECIBO NÃO FISCAL</h2>
          <p>${dataAtual}</p>
          <div class="divisor"></div>
          <div class="info"><span class="bold">Cliente:</span> ${nomeCliente}</div>
          <div class="info"><span class="bold">Atendente(s):</span> ${[...new Set(itens.map(i => i.profissional))].join(', ')}</div>
          <div class="info"><span class="bold">Pagamento:</span> ${itens[0].forma_pagamento || 'Concluído'}</div>
          <div class="divisor"></div>
          
          <table>
            <thead>
              <tr>
                <th>Qtd/Item</th>
                <th class="right">Valor</th>
              </tr>
            </thead>
            <tbody>
    `;

    itens.forEach(item => {
      html += `
        <tr>
          <td>1x ${item.servico} <br><small style="color: #666">(${item.servico_tipo === 'produto' ? 'Produto' : 'Serviço'})</small></td>
          <td class="right">${formatarMoeda(item.valor_total)}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          
          <div class="total-box">
            <div>Subtotal: ${formatarMoeda(valorTotal)}</div>
            ${valorJaPago > 0 ? `<div>Pago Antecipado: -${formatarMoeda(valorJaPago)}</div>` : ''}
            <div class="total-final">TOTAL: ${formatarMoeda(valorTotal - valorJaPago)}</div>
          </div>
          
          <div class="divisor"></div>
          <div class="rodape">
            Obrigado pela preferência!<br>
            Volte sempre!
          </div>
        </body>
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } };
        </script>
      </html>
    `;

    const janela = window.open('', '_blank', 'width=400,height=600');
    janela.document.write(html);
    janela.document.close();
  };

  const comandasAgrupadas = comandas.reduce((grupos, item) => {
    if (!grupos[item.cliente_nome]) grupos[item.cliente_nome] = [];
    grupos[item.cliente_nome].push(item);
    return grupos;
  }, {});
  const totalClientesNaFila = Object.keys(comandasAgrupadas).length;

  const clientesEmAtendimento = [];
  const clientesAguardando = [];

  Object.entries(comandasAgrupadas).forEach(([nomeCliente, itens]) => {
    const temServicoRodando = itens.some(item => item.status_fila === 'em_atendimento');
    if (temServicoRodando) {
      clientesEmAtendimento.push({ nomeCliente, itens });
    } else {
      clientesAguardando.push({ nomeCliente, itens });
    }
  });

  const filaPorProfissional = comandas.reduce((acc, item) => {
    const ehProduto = item.servico_tipo === 'produto' || item.duracao === 0 || item.duracao === null;
    if (ehProduto) return acc;

    if (!acc[item.profissional]) acc[item.profissional] = 0;
    
    let tempoRestante = item.duracao || 30;
    if (item.status_fila === 'em_atendimento' && item.hora_inicio) {
      const inicio = new Date(item.hora_inicio);
      const minutosDecorridos = Math.floor((new Date() - inicio) / 60000);
      tempoRestante = Math.max(0, tempoRestante - minutosDecorridos);
    }
    
    acc[item.profissional] += tempoRestante;
    return acc;
  }, {});

  const exportarPlanilhaComissoes = () => {
    const dados = comissoesFiltradas || comissoesMensais;
    if (dados.length === 0) return alert("Vazio.");
    let conteudoCSV = "Profissional,Qtd Servicos,Bruto (R$),Descontos (R$),Liquido (R$),Status,Data Baixa\n";
    dados.forEach(prof => {
      const isFiltrado = dataInicio && dataFim && comissoesFiltradas !== null;
      const chaveUnica = isFiltrado ? `P_${prof.profissional}_${dataInicio}_${dataFim}` : `M_${prof.profissional}_${mes}_${ano}`;
      const pagamentoInfo = pagamentosDb.find(p => p.chave_periodo === chaveUnica);
      const estaPago = !!pagamentoInfo;
      const valesProf = vales.filter(v => v.profissional === prof.profissional);
      const valesAtivos = estaPago ? valesProf.filter(v => v.chave_periodo === chaveUnica) : valesProf.filter(v => !v.pago);
      const totalVales = valesAtivos.reduce((a, v) => a + Number(v.valor), 0);
      const liquido = Number(prof.total_comissao) - totalVales;
      const p = prof.profissional.replace(/,/g, '');
      const brutoStr = Number(prof.total_comissao).toFixed(2).replace('.', ',');
      const descStr = totalVales.toFixed(2).replace('.', ',');
      const liqStr = liquido.toFixed(2).replace('.', ',');
      conteudoCSV += `${p},${prof.qtd_servicos},"${brutoStr}","${descStr}","${liqStr}",${estaPago ? "PAGO" : "A RECEBER"},${estaPago ? pagamentoInfo.data_pagto : ""}\n`;
    });
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `comissoes_com_descontos_${dataInicio ? 'semana' : 'mensal'}.csv`; link.click();
  };

  const exportarPlanilhaGeral = () => {
    if (historico.length === 0) return alert("Vazio.");
    let conteudoCSV = "Data,Cliente,Status,Pagamento,Tipo,Serviço/Produto,Profissional,Valor Total (R$),Comissão (R$)\n";
    historico.forEach(item => {
      const c = item.cliente_nome.replace(/,/g, ''); const s = item.servico.replace(/,/g, '');
      const t = item.servico_tipo === 'produto' ? 'Produto' : 'Serviço';
      const p = item.profissional ? item.profissional.replace(/,/g, '') : '';
      const v = Number(item.valor_total).toFixed(2).replace('.', ','); const com = Number(item.valor_comissao).toFixed(2).replace('.', ',');
      const statusTexto = item.status === 'cancelado' ? 'CANCELADO' : 'PAGO';
      const forma = item.forma_pagamento || 'Dinheiro';
      conteudoCSV += `${item.data},${c},${statusTexto},${forma},${t},${s},${p},"${v}","${com}"\n`;
    });
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = "historico_atendimentos.csv"; link.click();
  };

  const exportarPlanilhaDespesas = () => {
    if (despesas.length === 0) return alert("Nenhuma despesa encontrada para exportar.");
    let conteudoCSV = "Vencimento,Valor (R$),Serviços/Produto,Fornecedor,Status,Data Pagamento\n";
    despesas.forEach(d => {
      const partes = d.data_vencimento.split('-'); 
      const venc = new Date(partes[0], partes[1] - 1, partes[2]);
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const diferencaDias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));
      
      let textoStatus = ""; 
      if (d.pago) { textoStatus = "Pago"; } 
      else if (diferencaDias < 0) { textoStatus = "Venceu"; } 
      else { textoStatus = diferencaDias === 0 ? "Vence Hoje" : `${diferencaDias} dia(s)`; }

      const dataVencFormatada = `${partes[2]}/${partes[1]}/${partes[0].substring(2)}`;
      const valorStr = Number(d.valor).toFixed(2).replace('.', ',');
      const descStr = (d.descricao || '').replace(/"/g, '""'); 
      const fornStr = (d.fornecedor || '').replace(/"/g, '""'); 
      const pagtoStr = d.data_pagamento || '-';

      conteudoCSV += `"${dataVencFormatada}","${valorStr}","${descStr}","${fornStr}","${textoStatus}","${pagtoStr}"\n`;
    });

    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob);
    link.download = `despesas_goldstar_${mes}_${ano}.csv`; 
    link.click();
  };

  const BotaoAba = ({ id, titulo, destaque }) => (
    <button onClick={() => setAbaAtiva(id)} className={`relative whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === id ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {titulo}
      {destaque > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{destaque}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-24 animate-fade-in-up pt-4">
      
      {isAdmin && (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-[280px] w-full flex flex-col mb-4">
          <h3 className="font-bold text-gray-700 mb-2 text-sm">Resumo Diário - {mes}/{ano}</h3>
          
          {dadosGrafico.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Sem dados registados neste mês.
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }} formatter={(valor) => formatarMoeda(valor)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Serviços" stackId="a" fill="#14b8a6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Produtos" stackId="a" fill="#374151" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide pt-2">
        {podeVerCaixa && <BotaoAba id={0} titulo="🛒 Fila / Caixa" destaque={totalClientesNaFila} />}
        <BotaoAba id={1} titulo={isProfissional ? "1. Meus Serviços" : "1. Histórico Geral"} />
        
          {usuario?.perfil !== 'caixa' && (
          <BotaoAba id={2} titulo={isProfissional ? "2. Minha Comissão" : "2. Comissões da Equipe"} />
        )}

        {podeVerCaixa && <BotaoAba id={3} titulo="3. Visual da Agenda" />}
        {isAdmin && (
          <>
            <BotaoAba id={4} titulo="4. Top 10" />
            <BotaoAba id={5} titulo="5. DRE (Finanças)" />
            <BotaoAba id={6} titulo="6. Despesas" />
          </>
        )}
      </div>

      {abaAtiva === 0 && podeVerCaixa && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-1">
             <div className="flex-1 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Folga hoje:</span>
                {colaboradores
                  .filter(c => String(c.dia_folga || '').split(',').includes(String(new Date().getDay())))
                  .map(c => (
                    <span key={c.id} className="bg-gray-200 text-gray-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                      {c.nome} 🏖️
                    </span>
                  ))
                }
                {colaboradores.filter(c => String(c.dia_folga || '').split(',').includes(String(new Date().getDay()))).length === 0 && (
                  <span className="text-[10px] text-gray-300 italic">Ninguém de folga.</span>
                )}
             </div>

             <button 
               onClick={() => setMostrarNovoVale(true)} 
               className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-transform active:scale-95"
             >
               🥤 Lançar Consumo da Equipa
             </button>
          </div>

          <div className="sticky top-0 z-10 bg-gray-50 pt-2 pb-2 space-y-3">
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 overflow-x-auto scrollbar-hide items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-2">Disponibilidade:</span>
              {colaboradores && colaboradores.length > 0 ? (
                colaboradores
                  .filter(c => (c.perfil === 'profissional' || c.perfil === 'dono') && !String(c.dia_folga || '').split(',').includes(String(new Date().getDay())))
                  .map(c => {
                    const tempo = filaPorProfissional[c.nome] || 0;
                    const livre = tempo === 0;
                    return (
                      <div key={c.id} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${livre ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                         <div className={`w-2 h-2 rounded-full ${livre ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                         <div>
                           <p className="text-xs font-bold text-gray-700">{c.nome}</p>
                           <p className={`text-[10px] font-bold ${livre ? 'text-green-600' : 'text-orange-600'}`}>
                             {livre ? 'Livre agora' : `Fila: ${formatarTempo(tempo)}`}
                           </p>
                         </div>
                      </div>
                    );
                  })
              ) : (
                <span className="text-xs text-gray-400 italic">Carregando equipe...</span>
              )}
            </div>

            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 flex gap-3 overflow-x-auto scrollbar-hide items-center shadow-sm">
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1">
                ⏳ Aguardando ({clientesAguardando.length}):
              </span>
              
              {clientesAguardando.length === 0 ? (
                <span className="text-xs text-orange-600 italic">Fila vazia. 🎉</span>
              ) : (
                clientesAguardando.map(({nomeCliente, itens}) => {
                  const horaChegada = new Date(itens[0].data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                  const valorTotal = itens.reduce((soma, item) => soma + Number(item.valor_total), 0);
                  const valorJaPago = itens.reduce((soma, item) => item.status === 'pago_antecipado' ? soma + Number(item.valor_total) : soma, 0);
                  const valorPendente = valorTotal - valorJaPago;
                  
                  // Gerar ID seguro para os inputs deste cliente
                  const safeId = nomeCliente.replace(/[^a-zA-Z0-9]/g, '');

                  return (
                    <div key={nomeCliente} className={`shrink-0 flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm min-w-[250px] transition-colors ${valorPendente === 0 ? 'bg-green-50/60 border-green-200' : 'bg-white border-orange-200'}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${valorPendente === 0 ? 'text-green-800' : 'text-orange-700'}`}>{nomeCliente}</p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {itens.length} item(ns) • {formatarMoeda(valorTotal)} • Chegou {horaChegada}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => cancelarAtendimentosFila(itens)} className="bg-red-50 text-red-500 p-1.5 rounded-lg hover:bg-red-100 transition-colors" title="Desistiu">🗑️</button>
                        <button onClick={() => setClienteParaExtra(nomeCliente)} className="bg-teal-50 text-teal-600 p-1.5 rounded-lg hover:bg-teal-100 transition-colors" title="Adicionar">➕</button>
                        
                        {valorPendente > 0 ? (
                          <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-lg border border-blue-100 shadow-sm">
                            <select id={`pagamento_aguard_${safeId}`} className="bg-transparent text-blue-700 font-bold text-[10px] outline-none cursor-pointer">
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Pix">Pix</option>
                              <option value="Cartão">Cartão</option>
                            </select>
                            <button onClick={() => {
                               const f = document.getElementById(`pagamento_aguard_${safeId}`).value;
                               atualizarStatusComanda(itens.filter(i => i.status === 'pendente'), 'pago_antecipado', f);
                            }} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm">
                              💲 Antecipar
                            </button>
                          </div>
                        ) : (
                          <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-1.5 rounded-lg font-bold text-[10px] flex items-center shadow-sm">✅ Pago</span>
                        )}

                        {/* Botão Iniciar volta aqui */}
                        {itens.find(i => i.servico_tipo !== 'produto' && i.profissional !== 'Caixa') && (
                          <button onClick={() => iniciarServico(itens.find(i => i.servico_tipo !== 'produto' && i.profissional !== 'Caixa').id)} className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-600 font-bold text-[10px] flex items-center transition-colors shadow-sm" title="Iniciar">▶ Iniciar</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden shadow-sm flex flex-col mt-4">
            <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center z-10 shadow-sm shrink-0">
              <h3 className="font-bold text-teal-800 flex items-center gap-2">
                <span className="animate-pulse">🟢</span> Em Atendimento ({clientesEmAtendimento.length})
              </h3>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 bg-teal-50/20 overflow-y-auto max-h-[65vh]">
               {clientesEmAtendimento.length === 0 ? (
                 <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400"><p className="text-sm font-medium">Ninguém na cadeira agora.</p></div>
               ) : (
                 clientesEmAtendimento.map(({nomeCliente, itens}) => {
                   const valorTotal = itens.reduce((soma, item) => soma + Number(item.valor_total), 0);
                   const valorJaPago = itens.reduce((soma, item) => item.status === 'pago_antecipado' ? soma + Number(item.valor_total) : soma, 0);
                   const valorPendente = valorTotal - valorJaPago;
                   const horaChegada = new Date(itens[0].data_hora); 
                   const horaChegadaFormatada = horaChegada.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                   const safeId = nomeCliente.replace(/[^a-zA-Z0-9]/g, '');

                   return (
                     <div key={nomeCliente} className="border border-teal-200 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col justify-between transition-all duration-300">
                       <div>
                         <div className="px-3 py-2 border-b bg-teal-100/40 flex justify-between items-center gap-2">
                           <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-teal-800 text-[13px] truncate" title={nomeCliente}>
                               Cliente: <span className="font-black">{nomeCliente}</span>
                             </h4>
                           </div>
                           <div className="flex items-center gap-1.5 shrink-0">
                             <span className="text-[9px] font-bold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                               Chegou {horaChegadaFormatada}
                             </span>
                             <button onClick={() => setClienteParaExtra(nomeCliente)} className="bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0">
                               ➕ Extra
                             </button>
                           </div>
                         </div>
                         <div className="p-4">
                           <ul className="space-y-3 mb-2">
                             {itens.map(item => {
                               const estaRodando = item.status_fila === 'em_atendimento';
                               let decorridoMinutos = 0;
                               if (estaRodando && item.hora_inicio) {
                                 const inicio = new Date(item.hora_inicio);
                                 decorridoMinutos = Math.max(0, Math.floor((new Date() - inicio) / 60000));
                               }
                               const atrasado = decorridoMinutos > (item.duracao || 30);
                               const corServico = estaRodando ? "bg-white border-teal-400 shadow-sm" : "bg-gray-50/80 border-gray-100";

                               return (
                                 <li key={item.id} className={`flex flex-col text-sm p-2.5 rounded-xl border transition-colors ${corServico}`}>
                                   <div className="flex justify-between items-center mb-1 gap-2">
                                     <span className="font-bold text-gray-800 truncate flex-1 min-w-0">
                                       {item.servico_tipo === 'produto' && <span title="Produto" className="mr-1">🛍️</span>}
                                       {item.servico}
                                       {item.status === 'pago_antecipado' && <span className="text-[9px] text-green-700 bg-green-100 px-1 rounded font-bold ml-1">Pago</span>}
                                     </span>
                                     <span className="font-bold text-teal-600 whitespace-nowrap shrink-0">{formatarMoeda(item.valor_total)}</span>
                                   </div>
                                   <div className="flex justify-between items-end gap-2">
                                     <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate flex-1 min-w-0">com {item.profissional}</span>
                                     <div className="flex items-center gap-1.5 shrink-0">
                                       <button onClick={() => cancelarItemFila(item.id, item.servico)} className="text-red-400 hover:text-red-600 bg-white hover:bg-red-50 border border-transparent hover:border-red-100 p-1.5 rounded-md transition-all shadow-sm text-[10px] shrink-0" title="Desistir deste item">❌</button>
                                       {!estaRodando ? (
                                         item.profissional !== 'Caixa' && item.servico_tipo !== 'produto' && (
                                            <button onClick={() => iniciarServico(item.id)} className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm text-[11px] font-black px-3 py-1.5 rounded-lg transition-transform active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0">▶ Iniciar</button>
                                         )
                                       ) : (
                                         <span className={`text-[11px] font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0 ${atrasado ? 'bg-red-100 text-red-700 animate-pulse border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>⏱ {decorridoMinutos}m / {item.duracao || 30}m</span>
                                       )}
                                     </div>
                                   </div>
                                 </li>
                               );
                             })}
                           </ul>
                         </div>
                       </div>
                       
                       <div className="p-4 pt-0">
                         <div className="border-t border-dashed border-gray-300 pt-3 flex flex-col gap-3">
                           
                           <div className="flex justify-between items-end gap-2">
                             <div className="flex-1 min-w-0">
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Total a Cobrar</p>
                               <p className="text-xl font-black text-gray-800 leading-none mt-1 truncate">{formatarMoeda(valorPendente)}</p>
                             </div>
                             
                             <div className="flex gap-1.5 shrink-0">
                               <button onClick={() => imprimirComprovante(nomeCliente, itens)} className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent hover:border-gray-200 px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0" title="Imprimir Recibo">🖨️ Recibo</button>
                               <button onClick={() => cancelarAtendimentosFila(itens)} className="text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0">🗑️ Desistiu</button>
                             </div>
                           </div>

                           <div className="flex gap-2 w-full mt-1">
                             {/* Novo Seletor Inteligente para Dar Baixa no Atendimento */}
                             {valorPendente > 0 && (
                               <div className="flex-1 flex gap-1 bg-green-50 p-1 rounded-xl border border-green-100 shadow-sm">
                                 <select id={`pagamento_card_${safeId}`} className="bg-transparent text-green-800 font-bold text-xs outline-none cursor-pointer w-full text-center">
                                   <option value="Dinheiro">Dinheiro</option>
                                   <option value="Pix">Pix</option>
                                   <option value="Cartão">Cartão</option>
                                 </select>
                               </div>
                             )}
                             <button onClick={() => {
                               const selectElement = document.getElementById(`pagamento_card_${safeId}`);
                               const f = selectElement ? selectElement.value : 'Dinheiro';
                               atualizarStatusComanda(itens, 'pago', f);
                             }} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-1 rounded-xl shadow-md text-xs transition-colors truncate">
                               {valorPendente === 0 ? "✅ Encerrar" : "💲 Dar Baixa"}
                             </button>
                           </div>

                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-3">
            <h3 className="font-bold text-gray-800">{isProfissional ? 'Meus Serviços Realizados' : 'Histórico Geral e Auditoria'}</h3>
            
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <input type="date" value={filtroDataAba1} onChange={e => setFiltroDataAba1(e.target.value)} className="border border-gray-200 rounded-lg p-2 text-xs bg-white text-gray-700 font-bold outline-none shadow-sm flex-1 md:w-36 cursor-pointer" title="Escolha um dia"/>
              {!isProfissional && (
                <select value={filtroProfAba1} onChange={e => setFiltroProfAba1(e.target.value)} className="border border-gray-200 rounded-lg p-2 text-xs bg-white text-gray-700 font-bold outline-none shadow-sm flex-1 md:w-40">
                  <option value="">👥 Todos</option>
                  {profissionaisUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              {(filtroProfAba1 || filtroDataAba1) && (
                 <button onClick={() => { setFiltroProfAba1(''); setFiltroDataAba1(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm">Limpar</button>
              )}
              {(isAdmin || podeVerCaixa) && <button onClick={exportarPlanilhaGeral} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm">📥 Baixar</button>}
            </div>
          </div>

          {(!isProfissional && filtroProfAba1) && (
            <div className="bg-purple-50/50 p-3 border-b border-purple-100 flex flex-wrap justify-end gap-4 md:gap-8 text-xs">
              <span className="text-gray-600">Total Faturado ({filtroProfAba1}): <span className="font-black text-purple-700 text-sm ml-1">{formatarMoeda(totalFaturadoAba1)}</span></span>
              <span className="text-gray-600">Total Comissão ({filtroProfAba1}): <span className="font-black text-green-600 text-sm ml-1">{formatarMoeda(totalComissaoAba1)}</span></span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Serviço/Produto</th>
                  {!isProfissional && <th className="p-3">Profissional</th>}
                  <th className="p-3 text-center">Pagamento</th>
                  <th className="p-3 text-right">Valor Final</th>
                  <th className="p-3 text-right text-green-600 font-bold">Comissão</th>
                  {(isAdmin || isCaixa) && <th className="p-3 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.length === 0 ? <tr><td colSpan={(isAdmin || isCaixa) ? "8" : (isProfissional ? "6" : "7")} className="p-6 text-center text-gray-400">Nenhum registro encontrado.</td></tr> : historico.map(item => {
                  const temErro = item.cliente_nome.includes('⚠️ ERRO');
                  const isCancelado = item.status === 'cancelado';

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${temErro || isCancelado ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3 text-gray-500 text-xs">{item.data}</td>
                      <td className={`p-3 font-medium ${temErro || isCancelado ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.cliente_nome}
                        {isCancelado && <span className="ml-2 text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-200">Cancelado</span>}
                      </td>
                      <td className="p-3 text-gray-600 font-medium text-xs">
                        {item.servico_tipo === 'produto' ? <span title="Produto Vendido">🛍️ {item.servico}</span> : <span title="Serviço Realizado">💆‍♀️ {item.servico}</span>}
                      </td>
                      {!isProfissional && <td className="p-3 text-gray-600 font-bold text-xs">{item.profissional}</td>}
                      
                      {/* 🚀 O NOVO BADGE NO HISTÓRICO ENTRA AQUI */}
                      <td className="p-3 text-center">
                        {!isCancelado && <BadgePagamento forma={item.forma_pagamento} />}
                      </td>

                      <td className="p-3 font-bold text-teal-600 text-right">
                        {temErro || isCancelado ? <s className="text-gray-400">{formatarMoeda(item.valor_total)}</s> : formatarMoeda(item.valor_total)}
                      </td>
                      <td className="p-3 font-black text-green-600 text-right bg-green-50/30">
                        {temErro || isCancelado ? <s className="text-gray-400">{formatarMoeda(item.valor_comissao)}</s> : formatarMoeda(item.valor_comissao)}
                      </td>
                      {(isAdmin || isCaixa) && (
                        <td className="p-3 text-center flex items-center justify-center gap-2">
                          {isCaixa && !temErro && !isCancelado && (
                            <button onClick={() => sinalizarErroAtendimento(item.id)} className="text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 p-1.5 rounded-lg font-bold transition-colors shadow-sm" title="Sinalizar Erro">🚩</button>
                          )}
                          {isAdmin && (
                            <button onClick={() => apagarHistorico(item.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg font-bold transition-colors shadow-sm" title="Excluir Definitivamente do Sistema">🗑️</button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div><h3 className="font-bold text-orange-800">{isProfissional ? 'Minha Comissão Acumulada' : 'Repasses Acumulados da Equipe'}</h3></div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border rounded-lg p-1.5 text-xs bg-white shadow-sm" /> 
                <span className="text-xs font-bold text-gray-500">até</span> 
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border rounded-lg p-1.5 text-xs bg-white shadow-sm" />
                <button onClick={filtrarComissoesPeriodo} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">Filtrar</button>
                {comissoesFiltradas !== null && <button onClick={limparFiltroPeriodo} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors">Limpar</button>}
              </div>
            </div>
            
            {podeVerCaixa && (
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => setMostrarNovoVale(true)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm whitespace-nowrap">+ Vale / Desconto</button>
                <button onClick={exportarPlanilhaComissoes} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors">📥 Baixar</button>
              </div>
            )}
          </div>
          <div className="p-4">
            {(comissoesFiltradas || comissoesMensais).map((prof, index) => {
              const chaveUnica = comissoesFiltradas ? `P_${prof.profissional}_${dataInicio}_${dataFim}` : `M_${prof.profissional}_${mes}_${ano}`;
              const pagamentoInfo = pagamentosDb.find(p => p.chave_periodo === chaveUnica);
              const estaPago = !!pagamentoInfo;

              const valesDoProfissional = vales.filter(v => v.profissional === prof.profissional);
              const valesAtivos = estaPago ? valesDoProfissional.filter(v => v.chave_periodo === chaveUnica) : valesDoProfissional.filter(v => !v.pago);
              
              const totalVales = valesAtivos.reduce((a, v) => a + Number(v.valor), 0);
              const liquidoAPagar = Number(prof.total_comissao) - totalVales;

              return (
                <div key={index} className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="w-1/2">
                    <p className="font-bold text-gray-800 text-base">{prof.profissional}</p>
                    <p className="text-xs text-gray-500 mb-2">{prof.qtd_servicos} serviço(s) feitos</p>
                    
                    {valesAtivos.length > 0 && (
                      <div className="mt-2 bg-red-50/50 p-2 rounded-lg border border-red-100">
                        <p className="text-[10px] font-bold text-red-800 uppercase tracking-wide border-b border-red-200/50 mb-1.5 pb-1">Descontos a aplicar:</p>
                        {valesAtivos.map(v => (
                          <div key={v.id} className="flex justify-between text-xs text-red-600 items-center mt-1">
                            <span className="truncate pr-2">{v.data_formatada && <span className="font-semibold opacity-75">[{v.data_formatada}] </span>} {v.descricao}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold whitespace-nowrap">{formatarMoeda(v.valor)}</span>
                              {!estaPago && isAdmin && <button onClick={() => apagarVale(v.id)} className="text-red-400 hover:text-red-700 bg-red-100 w-4 h-4 rounded-full flex items-center justify-center font-bold pb-0.5" title="Remover desconto">x</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 flex flex-col items-end gap-1">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">Bruto: <span className="font-bold text-gray-700">{formatarMoeda(prof.total_comissao)}</span></p>
                      {totalVales > 0 && <p className="text-xs text-red-500 font-bold border-b border-gray-200 pb-1 mb-1">- {formatarMoeda(totalVales)}</p>}
                      <p className="font-black text-teal-600 text-xl">{formatarMoeda(liquidoAPagar)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {estaPago ? (
                        <span className="text-[11px] font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-1.5 rounded-lg border border-[#b7e4c7]">Pago: {pagamentoInfo.data_pagto}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#e07a5f] bg-red-50 px-2 py-1.5 rounded-lg border border-red-100">A Receber</span>
                      )}
                      {isAdmin && <input type="checkbox" checked={estaPago} onChange={() => alternarStatusPagamento(prof.profissional, chaveUnica)} className="w-6 h-6 cursor-pointer accent-teal-600 shadow-sm"/>}
                    </div>
                  </div>
                </div>
              );
            })}

            {isProfissional && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span>🛒</span> Meu Histórico de Consumos e Descontos
                </h4>
                
                {vales.filter(v => String(v.profissional).trim().toLowerCase() === nomeLimpoUsuario).length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-gray-100">Nenhum consumo registado no seu nome.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {vales.filter(v => String(v.profissional).trim().toLowerCase() === nomeLimpoUsuario).map(v => (
                      <div key={v.id} className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{v.descricao}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Lançado em: {v.data_formatada}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-sm font-black text-red-500">- {formatarMoeda(v.valor)}</span>
                          {v.pago ? (
                            <span className="text-[9px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Descontado</span>
                          ) : (
                            <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pendente (Próx. Pgto)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isAdmin && abaAtiva === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><h3 className="font-bold text-purple-800 mb-3 border-b pb-2">Top 10 Serviços/Produtos</h3>
            <ul className="text-sm space-y-3">{topServicos.map((s, i) => <li key={i} className="flex justify-between"><span className="text-gray-600"><span className="font-bold mr-2">{i+1}º</span>{s.nome}</span><span className="font-bold">{formatarMoeda(s.gerado)}</span></li>)}</ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><h3 className="font-bold text-blue-800 mb-3 border-b pb-2">Top 10 Clientes</h3>
            <ul className="text-sm space-y-3">{topClientes.map((c, i) => <li key={i} className="flex justify-between"><span className="text-gray-600"><span className="font-bold mr-2">{i+1}º</span>{c.nome}</span><span className="font-bold">{formatarMoeda(c.gasto)}</span></li>)}</ul>
          </div>
        </div>
      )}

      {isAdmin && abaAtiva === 5 && (
        <div className="bg-gray-800 rounded-2xl p-5 text-white shadow-md">
          <h3 className="font-bold text-gray-200 mb-4 border-b border-gray-600 pb-2">Resumo Financeiro (DRE)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Faturamento Bruto</span><span className="font-bold text-green-400">+ {formatarMoeda(faturamentoBruto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Repasses</span><span className="font-bold text-orange-400">- {formatarMoeda(totalComissoes)}</span></div>
            <div className="flex justify-between border-b border-gray-600 pb-3"><span className="text-gray-400">Despesas</span><span className="font-bold text-red-400">- {formatarMoeda(despesasFixas)}</span></div>
            <div className="flex justify-between pt-2"><span className="text-gray-400">Saldo Líquido</span><span className={lucroLiquido >= 0 ? 'text-teal-300' : 'text-red-400'}>{formatarMoeda(lucroLiquido)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Comissão da Dona</span><span className="font-bold text-green-400">+ {formatarMoeda(comissaoDona)}</span></div>
            <div className="flex justify-between pt-3 mt-2 border-t border-gray-500 text-lg"><span className="font-bold text-white">Lucro Operacional</span><span className="font-bold text-teal-300">{formatarMoeda(lucroOperacional)}</span></div>
          </div>
        </div>
      )}

      {isAdmin && abaAtiva === 6 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-white pr-2">Despesas</h3>
              <button onClick={() => setMostrarNovaDespesa(true)} className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors">+ Lançar Despesa</button>
              <button onClick={exportarPlanilhaDespesas} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1">
                📥 Baixar
              </button>
            </div>
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Total: {formatarMoeda(despesasFixas)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-teal-500 text-white">
                <tr>
                  <th className="p-3 font-bold border-r border-teal-600/30">Vencimento</th>
                  <th className="p-3 font-bold border-r border-teal-600/30">Valor</th>
                  <th className="p-3 font-bold border-r border-teal-600/30">Serviços/Produto</th>
                  <th className="p-3 font-bold border-r border-teal-600/30">Fornecedor</th>
                  <th className="p-3 font-bold border-r border-teal-600/30">Status</th>
                  <th className="p-3 font-bold border-r border-teal-600/30">Data Pagamento</th>
                  <th className="p-3 font-bold text-center">Pago</th>
                  <th className="p-3 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                {despesas.length === 0 ? <tr><td colSpan="8" className="p-6 text-center text-gray-400">Nenhuma despesa para este mês.</td></tr> : despesas.map(d => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0);
                    const partes = d.data_vencimento.split('-'); const venc = new Date(partes[0], partes[1] - 1, partes[2]);
                    const diferencaDias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));
                    let classeLinha = ""; let textoStatus = ""; let classeStatus = "font-bold text-center "; let classeTexto = "text-gray-800"; 
                    if (d.pago) { classeLinha = "bg-green-50 hover:bg-green-100"; textoStatus = "Pago"; classeStatus += "text-green-700"; } 
                    else if (diferencaDias < 0) { classeLinha = "bg-red-50 hover:bg-red-100"; textoStatus = "Venceu"; classeStatus += "text-red-700"; } 
                    else { classeLinha = "bg-white hover:bg-gray-50"; textoStatus = diferencaDias === 0 ? "Vence Hoje!" : `${diferencaDias} dia(s)`; classeStatus += diferencaDias === 0 ? "text-orange-600" : "text-gray-600"; }
                    const dataVencFormatada = `${partes[2]}/${partes[1]}/${partes[0].substring(2)}`;
                    return (
                      <tr key={d.id} className={`${classeLinha} ${classeTexto} transition-colors border-b border-gray-200`}>
                        <td className="p-3 font-bold border-r border-gray-200/50">{dataVencFormatada}</td>
                        <td className="p-3 font-bold border-r border-gray-200/50">{formatarMoeda(d.valor)}</td>
                        <td className="p-3 border-r border-gray-200/50 truncate max-w-[200px]">{d.descricao}</td>
                        <td className="p-3 border-r border-gray-200/50 truncate max-w-[150px]">{d.fornecedor || '-'}</td>
                        <td className={`p-3 border-r border-gray-200/50 ${classeStatus}`}>{textoStatus}</td>
                        <td className="p-3 border-r border-gray-200/50 font-bold text-center">{d.pago ? d.data_pagamento : '-'}</td>
                        <td className="p-3 text-center flex items-center justify-center">
                          <input type="checkbox" checked={d.pago} onChange={() => marcarDespesaPaga(d.id, d.pago)} className="w-5 h-5 cursor-pointer accent-teal-600" />
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => apagarDespesa(d.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors shadow-sm" title="Apagar Despesa">🗑️</button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 3 && podeVerCaixa && <LinhaDoTempo comandas={comandas} />}

      {clienteParaExtra && (
        <ModalNovoAtendimento 
          fechar={() => setClienteParaExtra(null)} 
          recarregarTudo={recarregarTudo} 
          comandas={comandas} 
          clientePreDefinido={clienteParaExtra} 
        />
      )}

      {mostrarNovaDespesa && <ModalNovaDespesa fechar={() => setMostrarNovaDespesa(false)} atualizarDados={() => { carregarDadosExtras(); recarregarTudo(); }} usuario={usuario} />}
      {mostrarNovoVale && <ModalNovoVale fechar={() => setMostrarNovoVale(false)} atualizarDados={recarregarTudo} usuario={usuario} />}

      {confirmacao.aberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up border border-gray-100">
            <div className="bg-red-500 p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-red-600 opacity-20 transform -skew-y-12 scale-150 origin-top-left"></div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 text-3xl shadow-lg relative z-10">⚠️</div>
              <h3 className="text-xl font-black text-white relative z-10">{confirmacao.titulo}</h3>
            </div>
            <div className="p-6 text-center text-gray-600 font-medium text-sm">
              <p>{confirmacao.mensagem}</p>
            </div>
            <div className="p-5 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button onClick={() => setConfirmacao({ ...confirmacao, aberto: false })} className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm transition-colors">Cancelar</button>
              <button onClick={() => { confirmacao.onConfirm(); setConfirmacao({ ...confirmacao, aberto: false }); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}