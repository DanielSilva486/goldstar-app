import React, { useState, useEffect } from 'react';

export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo, usuario }) {
  
  // PERMISSÕES
  const isAdmin = usuario.perfil === 'admin';
  const isCaixa = usuario.perfil === 'caixa';
  const isProfissional = usuario.perfil === 'profissional';
  const podeVerCaixa = isAdmin || isCaixa;

  // Garantir que um profissional não fica preso numa aba que não existe para ele
  const [abaAtiva, setAbaAtiva] = useState(podeVerCaixa ? 0 : 1);

  // FILTRA OS DADOS SE FOR PROFISSIONAL
  const historicoGeral = dados?.historico || [];
  const historico = isProfissional ? historicoGeral.filter(h => h.profissional === usuario.nome) : historicoGeral;

  const comissoesGerais = dados?.comissoes || [];
  const comissoesMensais = isProfissional ? comissoesGerais.filter(c => c.profissional === usuario.nome) : comissoesGerais;

  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [buscandoFiltro, setBuscandoFiltro] = useState(false);
  const [pagamentosDb, setPagamentosDb] = useState([]);
  const [despesas, setDespesas] = useState([]);

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = Number(valores.total_despesas || 0); 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;
  const comissaoDona = Number(comissoesGerais.find(c => c.profissional.toLowerCase().includes('raquel'))?.total_comissao || 0);
  const lucroOperacional = lucroLiquido + comissaoDona;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

  const BotaoAba = ({ id, titulo, destaque }) => (
    <button onClick={() => setAbaAtiva(id)} className={`relative whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === id ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {titulo}
      {destaque > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{destaque}</span>}
    </button>
  );

  return (
    <div className="mt-2 px-4 pb-24 animate-fade-in-up">
      {/* RENDERIZA ABAS CONFORME O PERFIL */}
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
                 return (
                   <div key={nomeCliente} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                     <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                       <h4 className="font-bold text-gray-800">Cliente: <span className="text-blue-600">{nomeCliente}</span></h4>
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
                       <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-end">
                         <div><p className="text-xs text-gray-500 font-bold uppercase">Total a Cobrar</p><p className="text-xl font-black text-gray-800">{formatarMoeda(valorPendente)}</p></div>
                         <div className="flex gap-2">
                           {valorPendente > 0 && <button onClick={() => atualizarStatusComanda(itens.filter(i => i.status === 'pendente'), 'pago_antecipado')} className="bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-xs">Antecipar</button>}
                           <button onClick={() => atualizarStatusComanda(itens, 'pago')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-xl shadow-md text-xs">{valorPendente === 0 ? "Encerrar" : "Dar Baixa"}</button>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      )}

      {abaAtiva === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{isProfissional ? 'Meus Serviços Realizados' : 'Histórico Geral'}</h3>
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
            {podeVerCaixa && (
              <button onClick={exportarPlanilhaComissoes} className="bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-lg">📥 Baixar</button>
            )}
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
                      {isAdmin && (
                        <input type="checkbox" checked={estaPago} onChange={() => alternarStatusPagamento(prof.profissional, chaveUnica)} className="w-5 h-5 cursor-pointer accent-[#2d6a4f]"/>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABAS 3, 4 E 5 - EXCLUSIVAS DO ADMIN */}
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

      {/* ABA 5: AGORA COM VERIFICAÇÃO DE PERMISSÃO CORRETA */}
      {(isAdmin || abaAtiva === 5) && abaAtiva === 5 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isAdmin ? (
            <>
              <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-white">Gestão de Despesas</h3>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Total: {formatarMoeda(despesasFixas)}</span>
              </div>
              <div className="overflow-x-auto p-4">
                {/* Aqui vai a tabela de despesas que você já tem no código */}
                <p className="text-gray-500 text-sm">Lista de despesas completa...</p>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-gray-400">
              <p>🚫 Acesso restrito. Apenas administradores podem ver as despesas.</p>
            </div>
          )}
        </div>
      )}