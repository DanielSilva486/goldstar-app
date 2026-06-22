import React, { useState, useEffect } from 'react';
import ModalNovaDespesa from './ModalNovaDespesa';
export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo, usuario }) {
  
  // PERMISSÕES
  const isAdmin = usuario?.perfil === 'admin';
  const isCaixa = usuario?.perfil === 'caixa';
  const isProfissional = usuario?.perfil === 'profissional';
  const podeVerCaixa = isAdmin || isCaixa;

  const [abaAtiva, setAbaAtiva] = useState(podeVerCaixa ? 0 : 1);

  // FILTRA OS DADOS SE FOR PROFISSIONAL
  const historicoGeral = dados?.historico || [];
  const historico = isProfissional ? historicoGeral.filter(h => h.profissional === usuario?.nome) : historicoGeral;

  const comissoesGerais = dados?.comissoes || [];
  const comissoesMensais = isProfissional ? comissoesGerais.filter(c => c.profissional === usuario?.nome) : comissoesGerais;

  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [buscandoFiltro, setBuscandoFiltro] = useState(false);
  const [pagamentosDb, setPagamentosDb] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [mostrarNovaDespesa, setMostrarNovaDespesa] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);

  const [minutoAtual, setMinutoAtual] = useState(new Date().getMinutes());
  useEffect(() => {
    const intervalo = setInterval(() => setMinutoAtual(new Date().getMinutes()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = Number(valores.total_despesas || 0); 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;
  const comissaoDona = Number(comissoesGerais.find(c => c.profissional.toLowerCase().includes('raquel'))?.total_comissao || 0);
  const lucroOperacional = lucroLiquido + comissaoDona;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatarTempo = (minutosTotal) => {
    const horas = Math.floor(minutosTotal / 60);
    const min = minutosTotal % 60;
    return horas > 0 ? `${horas}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  const carregarDadosExtras = async () => {
    try {
      const resPagamentos = await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes');
      const jsonPagamentos = await resPagamentos.json();
      if(jsonPagamentos.sucesso) setPagamentosDb(jsonPagamentos.dados);

      if (isAdmin) {
        const resDespesas = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas?mes=${mes}&ano=${ano}`);
        const jsonDespesas = await resDespesas.json();
        if(jsonDespesas.sucesso) setDespesas(jsonDespesas.dados);
      }

      if (podeVerCaixa) {
        const resColab = await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores');
        const jsonColab = await resColab.json();
        if(jsonColab.sucesso) setColaboradores(jsonColab.dados);
      }
    } catch (e) {}
  };

  useEffect(() => { carregarDadosExtras(); }, [mes, ano, isAdmin]);

  const filtrarComissoesPeriodo = async () => {
    if (!dataInicio || !dataFim) return;
    setBuscandoFiltro(true);
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-periodo?inicio=${dataInicio}&fim=${dataFim}`);
      const json = await res.json();
      if (json.sucesso) {
         const filtrado = isProfissional ? json.dados.filter(c => c.profissional === usuario.nome) : json.dados;
         setComissoesFiltradas(filtrado);
      }
    } catch (e) {}
    setBuscandoFiltro(false);
  };

  const limparFiltroPeriodo = () => { setDataInicio(''); setDataFim(''); setComissoesFiltradas(null); };

  const alternarStatusPagamento = async (profissional, chaveUnica) => {
    if (!isAdmin) return alert("Apenas a administração pode dar baixa em comissões.");
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes/toggle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profissional, chave_periodo: chaveUnica })
      });
      carregarDadosExtras(); 
    } catch (e) {}
  };

  const marcarDespesaPaga = async (id, statusAtual) => {
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas/${id}/pagar`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pago: !statusAtual }) });
      carregarDadosExtras(); recarregarTudo(); 
    } catch (e) {}
  };

  const atualizarStatusComanda = async (itensDaComanda, statusNovo) => {
    const ids = itensDaComanda.map(item => item.id);
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas/pagar', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, statusNovo }) });
      recarregarTudo(); 
    } catch (erro) {}
  };

  const comandasAgrupadas = comandas.reduce((grupos, item) => {
    if (!grupos[item.cliente_nome]) grupos[item.cliente_nome] = [];
    grupos[item.cliente_nome].push(item);
    return grupos;
  }, {});
  const totalClientesNaFila = Object.keys(comandasAgrupadas).length;

  const filaPorProfissional = comandas.reduce((acc, item) => {
    if (!acc[item.profissional]) acc[item.profissional] = 0;
    acc[item.profissional] += (item.duracao || 30);
    return acc;
  }, {});

  const exportarPlanilhaComissoes = () => {
    const dados = comissoesFiltradas || comissoesMensais;
    if (dados.length === 0) return alert("Vazio.");
    let conteudoCSV = "Profissional,Qtd de Servicos,Comissao (R$),Status,Data Baixa\n";
    dados.forEach(prof => {
      const isFiltrado = dataInicio && dataFim && comissoesFiltradas !== null;
      const chaveUnica = isFiltrado ? `P_${prof.profissional}_${dataInicio}_${dataFim}` : `M_${prof.profissional}_${mes}_${ano}`;
      const pagamentoInfo = pagamentosDb.find(p => p.chave_periodo === chaveUnica);
      const estaPago = !!pagamentoInfo;
      const p = prof.profissional.replace(/,/g, '');
      const v = Number(prof.total_comissao).toFixed(2).replace('.', ',');
      conteudoCSV += `${p},${prof.qtd_servicos},"${v}",${estaPago ? "PAGO" : "A RECEBER"},${estaPago ? pagamentoInfo.data_pagto : ""}\n`;
    });
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `comissoes_${dataInicio ? 'semana' : 'mensal'}.csv`; link.click();
  };

  const exportarPlanilhaGeral = () => {
    if (historico.length === 0) return alert("Vazio.");
    let conteudoCSV = "Data,Cliente,Serviço,Profissional,Valor Total (R$),Comissão (R$)\n";
    historico.forEach(item => {
      const c = item.cliente_nome.replace(/,/g, ''); const s = item.servico.replace(/,/g, '');
      const p = item.profissional ? item.profissional.replace(/,/g, '') : '';
      const v = Number(item.valor_total).toFixed(2).replace('.', ','); const com = Number(item.valor_comissao).toFixed(2).replace('.', ',');
      conteudoCSV += `${item.data},${c},${s},${p},"${v}","${com}"\n`;
    });
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = "historico_atendimentos.csv"; link.click();
  };

  const BotaoAba = ({ id, titulo, destaque }) => (
    <button onClick={() => setAbaAtiva(id)} className={`relative whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === id ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {titulo}
      {destaque > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{destaque}</span>}
    </button>
  );

  return (
    <div className="mt-2 px-4 pb-24 animate-fade-in-up">
      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide pt-2">
        {podeVerCaixa && <BotaoAba id={0} titulo="🛒 Fila / Caixa" destaque={totalClientesNaFila} />}
        <BotaoAba id={1} titulo={isProfissional ? "1. Meus Serviços" : "1. Histórico Geral"} />
        <BotaoAba id={2} titulo={isProfissional ? "2. Minha Comissão" : "2. Comissões da Equipe"} />
        
        {isAdmin && (
          <>
            <BotaoAba id={3} titulo="3. Top 10" />
            <BotaoAba id={4} titulo="4. DRE (Finanças)" />
            <BotaoAba id={5} titulo="5. Despesas" />
          </>
        )}
      </div>

      {abaAtiva === 0 && podeVerCaixa && (
        <div className="space-y-4">
          <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 overflow-x-auto scrollbar-hide items-center">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-2">Disponibilidade:</span>
             {colaboradores.map(c => {
                const tempo = filaPorProfissional[c.nome] || 0;
                const livre = tempo === 0;
                return (
                  <div key={c.id} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${livre ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                     <div className={`w-2 h-2 rounded-full ${livre ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                     <div>
                       <p className="text-xs font-bold text-gray-700">{c.nome}</p>
                       <p className={`text-[10px] font-bold ${livre ? 'text-green-600' : 'text-orange-600'}`}>{livre ? 'Livre agora' : `Fila: ${formatarTempo(tempo)}`}</p>
                     </div>
                  </div>
                )
             })}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden min-h-[400px]">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-800">Clientes Aguardando</h3></div>
            <div className="p-4 space-y-4">
               {totalClientesNaFila === 0 ? (
                 <div className="flex flex-col items-center justify-center py-16 text-gray-400"><p>A fila de espera está vazia. 🎉</p></div>
               ) : (
                 Object.entries(comandasAgrupadas).map(([nomeCliente, itens]) => {
                   const valorTotal = itens.reduce((soma, item) => soma + Number(item.valor_total), 0);
                   const valorJaPago = itens.reduce((soma, item) => item.status === 'pago_antecipado' ? soma + Number(item.valor_total) : soma, 0);
                   const valorPendente = valorTotal - valorJaPago;
                   
                   const tempoEstimado = itens.reduce((soma, item) => soma + (item.duracao || 30), 0);
                   const horaChegada = new Date(itens[0].data_hora); 
                   const agora = new Date();
                   const decorridoMinutos = Math.max(0, Math.floor((agora - horaChegada) / 60000));
                   
                   let corTempo = "bg-green-100 text-green-700 border-green-200";
                   let textoTempo = `${decorridoMinutos}m / ${tempoEstimado}m`;
                   let iconeTempo = "⏱️";

                   if (decorridoMinutos >= tempoEstimado) {
                     corTempo = "bg-red-100 text-red-700 border-red-300 animate-pulse";
                     textoTempo = `Atraso: ${decorridoMinutos - tempoEstimado}m`;
                     iconeTempo = "⚠️";
                   } else if (tempoEstimado - decorridoMinutos <= 15) {
                     corTempo = "bg-orange-100 text-orange-700 border-orange-200";
                   }

                   return (
                     <div key={nomeCliente} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                       <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                         <h4 className="font-bold text-gray-800">Cliente: <span className="text-blue-600">{nomeCliente}</span></h4>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 font-bold ${corTempo}`} title={`Chegou às ${horaChegada.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}>
                            {iconeTempo} {textoTempo}
                         </span>
                       </div>
                       <div className="p-4">
                         <ul className="space-y-2 mb-4">
                           {itens.map(item => (
                             <li key={item.id} className="flex justify-between text-sm text-gray-600 items-center">
                               <div className="flex flex-col"><span className="font-medium text-gray-800">{item.servico} {item.status === 'pago_antecipado' && <span className="text-[9px] text-green-700 bg-green-100 px-1 rounded font-bold ml-2">✅ Pago</span>}</span><span className="text-[10px] text-gray-400">por {item.profissional}</span></div>
                               <span className="font-medium">{item.status === 'pago_antecipado' ? <s className="text-gray-400">{formatarMoeda(item.valor_total)}</s> : formatarMoeda(item.valor_total)}</span>
                             </li>
                           ))}
                         </ul>
                         <div className="border-t border-dashed border-gray-300 pt-3 flex flex-col md:flex-row md:justify-between items-end gap-3">
                           <div><p className="text-xs text-gray-500 font-bold uppercase">Total a Cobrar</p><p className="text-xl font-black text-gray-800">{formatarMoeda(valorPendente)}</p></div>
                           <div className="flex gap-2 w-full md:w-auto">
                             {valorPendente > 0 && <button onClick={() => atualizarStatusComanda(itens.filter(i => i.status === 'pendente'), 'pago_antecipado')} className="flex-1 md:flex-none bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-sm">Antecipar</button>}
                             <button onClick={() => atualizarStatusComanda(itens, 'pago')} className="flex-1 md:flex-none bg-green-500 text-white font-bold py-2 px-4 rounded-xl shadow-md text-sm">{valorPendente === 0 ? "Encerrar Atendimento" : "Dar Baixa Final"}</button>
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
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{isProfissional ? 'Meus Serviços Realizados' : 'Histórico Geral'}</h3>
            {isAdmin && <button onClick={exportarPlanilhaGeral} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm">📥 Baixar</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Serviço</th>{!isProfissional && <th className="p-3">Profissional</th>}<th className="p-3 text-right">Valor</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {historico.length === 0 ? <tr><td colSpan={isProfissional ? "4" : "5"} className="p-6 text-center text-gray-400">Nenhum serviço encontrado.</td></tr> : historico.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{item.data}</td><td className="p-3 font-medium text-gray-800">{item.cliente_nome}</td><td className="p-3 text-gray-600">{item.servico}</td>{!isProfissional && <td className="p-3 text-gray-600">{item.profissional}</td>}<td className="p-3 font-bold text-teal-600 text-right">{formatarMoeda(item.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="font-bold text-orange-800">{isProfissional ? 'Minha Comissão Acumulada' : 'Repasses Acumulados da Equipe'}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border rounded-lg p-1.5 text-xs bg-white" /> <span className="text-xs font-bold">até</span> <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border rounded-lg p-1.5 text-xs bg-white" />
                <button onClick={filtrarComissoesPeriodo} className="bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-lg">Filtrar</button>
                {comissoesFiltradas !== null && <button onClick={limparFiltroPeriodo} className="bg-gray-200 text-xs font-bold px-3 py-2 rounded-lg">Limpar</button>}
              </div>
            </div>
            {podeVerCaixa && <button onClick={exportarPlanilhaComissoes} className="bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm">📥 Baixar Tabela</button>}
          </div>
          <div className="p-4">
            {(comissoesFiltradas || comissoesMensais).map((prof, index) => {
              const chaveUnica = comissoesFiltradas ? `P_${prof.profissional}_${dataInicio}_${dataFim}` : `M_${prof.profissional}_${mes}_${ano}`;
              const pagamentoInfo = pagamentosDb.find(p => p.chave_periodo === chaveUnica);
              const estaPago = !!pagamentoInfo;
              return (
                <div key={index} className="flex justify-between items-center mb-4 border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-gray-800">{prof.profissional}</p>
                    <p className="text-xs text-gray-500">{prof.qtd_servicos} serviço(s)</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-bold text-orange-600 text-lg">{formatarMoeda(prof.total_comissao)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {estaPago ? (
                        <span className="text-[11px] font-bold text-[#2d6a4f] bg-[#d8f3dc] px-2 py-1 rounded">Pago em: {pagamentoInfo.data_pagto}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#e07a5f] bg-red-50 px-2 py-1 rounded">A Receber</span>
                      )}
                      {isAdmin && <input type="checkbox" checked={estaPago} onChange={() => alternarStatusPagamento(prof.profissional, chaveUnica)} className="w-5 h-5 cursor-pointer accent-[#2d6a4f]"/>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && abaAtiva === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-4"><h3 className="font-bold text-purple-800 mb-3 border-b pb-2">Top 10 Serviços</h3>
            <ul className="text-sm space-y-3">{topServicos.map((s, i) => <li key={i} className="flex justify-between"><span className="text-gray-600"><span className="font-bold mr-2">{i+1}º</span>{s.nome}</span><span className="font-bold">{formatarMoeda(s.gerado)}</span></li>)}</ul>
          </div>
          <div className="bg-white rounded-2xl border p-4"><h3 className="font-bold text-blue-800 mb-3 border-b pb-2">Top 10 Clientes</h3>
            <ul className="text-sm space-y-3">{topClientes.map((c, i) => <li key={i} className="flex justify-between"><span className="text-gray-600"><span className="font-bold mr-2">{i+1}º</span>{c.nome}</span><span className="font-bold">{formatarMoeda(c.gasto)}</span></li>)}</ul>
          </div>
        </div>
      )}

      {isAdmin && abaAtiva === 4 && (
        <div className="bg-gray-800 rounded-2xl p-5 text-white">
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

      {/* Tabela de Despesas Corrigida e Segura */}
      {isAdmin && abaAtiva === 5 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
           <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
  <div className="flex items-center gap-4">
    <h3 className="font-bold text-white">Despesas</h3>
    <button onClick={() => setMostrarNovaDespesa(true)} className="bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors">+ Lançar Despesa</button>
  </div>
  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Total: {formatarMoeda(despesasFixas)}</span>
</div>
            
<div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-teal-500 text-white">
                <tr><th className="p-3 font-bold border-r border-teal-600/30">Vencimento</th><th className="p-3 font-bold border-r border-teal-600/30">Valor</th><th className="p-3 font-bold border-r border-teal-600/30">Serviços/Produto</th><th className="p-3 font-bold border-r border-teal-600/30">Fornecedor</th><th className="p-3 font-bold border-r border-teal-600/30">Status</th><th className="p-3 font-bold border-r border-teal-600/30">Data Pagamento</th><th className="p-3 font-bold text-center">Pago</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-b border-gray-200">
                {despesas.length === 0 ? <tr><td colSpan="7" className="p-6 text-center text-gray-400">Nenhuma despesa para este mês.</td></tr> : despesas.map(d => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0);
                    const partes = d.data_vencimento.split('-'); const venc = new Date(partes[0], partes[1] - 1, partes[2]);
                    const diferencaDias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));
                    let classeLinha = ""; let textoStatus = ""; let classeStatus = "font-bold text-center ";
                    
                    if (d.pago) { 
                      classeLinha = "bg-teal-500 text-white"; 
                      textoStatus = "Pago"; 
                      classeStatus += "text-white";
                    } else if (diferencaDias < 0) { 
                      classeLinha = "bg-red-400 text-white"; 
                      textoStatus = "Venceu"; 
                      classeStatus += "text-white";
                    } else { 
                      classeLinha = "bg-gray-50 text-gray-800 hover:bg-gray-100"; 
                      textoStatus = diferencaDias === 0 ? "Vence Hoje!" : `${diferencaDias} dia(s)`; 
                      classeStatus += "text-gray-800"; 
                    }
                    
                    const dataVencFormatada = `${partes[2]}/${partes[1]}/${partes[0].substring(2)}`;
                    return (
                      <tr key={d.id} className={`${classeLinha} transition-colors border-b border-gray-300/30`}>
                        <td className="p-3 font-bold border-r border-gray-300/30">{dataVencFormatada}</td><td className="p-3 font-bold border-r border-gray-300/30">{formatarMoeda(d.valor)}</td><td className="p-3 border-r border-gray-300/30 truncate max-w-[200px]">{d.descricao}</td><td className="p-3 border-r border-gray-300/30 truncate max-w-[150px]">{d.fornecedor || '-'}</td><td className={`p-3 border-r border-gray-300/30 ${classeStatus}`}>{textoStatus}</td><td className="p-3 border-r border-gray-300/30 font-bold text-center">{d.pago ? d.data_pagamento : '-'}</td><td className="p-3 text-center flex items-center justify-center"><input type="checkbox" checked={d.pago} onChange={() => marcarDespesaPaga(d.id, d.pago)} className="w-5 h-5 cursor-pointer accent-current" /></td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
     {mostrarNovaDespesa && <ModalNovaDespesa fechar={() => setMostrarNovaDespesa(false)} atualizarDados={recarregarTudo} />}
    </div>
  );
}