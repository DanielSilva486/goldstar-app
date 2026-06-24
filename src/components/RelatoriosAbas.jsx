import React, { useState, useEffect } from 'react';
import ModalNovaDespesa from './ModalNovaDespesa';
import ModalNovoVale from './ModalNovoVale';
import LinhaDoTempo from './LinhaDoTempo';

export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo, usuario }) {
  const isAdmin = usuario?.perfil === 'admin';
  const isCaixa = usuario?.perfil === 'caixa' || usuario?.nome === 'Raquel Patroa'; 
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
  
  const [confirmacao, setConfirmacao] = useState({ aberto: false, titulo: '', mensagem: '', onConfirm: null });
  const pedirConfirmacao = (titulo, mensagem, acao) => setConfirmacao({ aberto: true, titulo, mensagem, onConfirm: acao });

  const nomeLimpoUsuario = String(usuario?.nome || '').trim().toLowerCase();
  const historicoGeral = dados?.historico || [];
  const historico = isProfissional ? historicoGeral.filter(h => String(h.profissional).trim().toLowerCase() === nomeLimpoUsuario) : historicoGeral;

  const comissoesGerais = dados?.comissoes || [];
  const comissoesMensais = isProfissional ? comissoesGerais.filter(c => String(c.profissional).trim().toLowerCase() === nomeLimpoUsuario) : comissoesGerais;

  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = Number(valores.total_despesas || 0); 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;
  const comissaoDona = Number(comissoesGerais.find(c => String(c.profissional).toLowerCase().includes('raquel'))?.total_comissao || 0);
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

      const resVales = await fetch('https://goldstar-backend-9m2p.onrender.com/api/vales');
      const jsonVales = await resVales.json();
      if(jsonVales.sucesso) setVales(jsonVales.dados);

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
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-periodo?inicio=${dataInicio}&fim=${dataFim}`);
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
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profissional, chave_periodo: chaveUnica }) });
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

  const apagarHistorico = (id) => pedirConfirmacao("Apagar Atendimento", "Deseja realmente apagar este serviço do Histórico Geral? O financeiro será recalculado.", async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas/${id}`, { method: 'DELETE' });
      if (res.ok) { recarregarTudo(); }
    } catch(e) {}
  });

  const sinalizarErroAtendimento = (id) => pedirConfirmacao("Sinalizar Erro", "Deseja marcar este atendimento como 'ERRO' para o Administrador cancelar?", async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/atendimentos/${id}/sinalizar-erro`, { method: 'PUT' });
      if (res.ok) { recarregarTudo(); }
    } catch(e) {}
  });

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
    <div className="min-h-screen bg-gray-50 px-4 pb-24 animate-fade-in-up pt-4">
      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide pt-2">
        {podeVerCaixa && <BotaoAba id={0} titulo="🛒 Fila / Caixa" destaque={totalClientesNaFila} />}
        <BotaoAba id={1} titulo={isProfissional ? "1. Meus Serviços" : "1. Histórico Geral"} />
        <BotaoAba id={2} titulo={isProfissional ? "2. Minha Comissão" : "2. Comissões da Equipe"} />
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
          <div className="sticky top-0 z-10 bg-gray-50 pt-2 pb-2">
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
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-[400px] shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-800">Clientes Aguardando</h3></div>
            <div className="p-4 space-y-4 bg-gray-50/50">
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
                   const horaChegadaFormatada = horaChegada.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                   
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
                       <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex flex-wrap gap-2 justify-between items-center">
                         <h4 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                           <span>Cliente: <span className="text-blue-600">{nomeCliente}</span></span>
                           <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">
                             Chegou às {horaChegadaFormatada}
                           </span>
                         </h4>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 font-bold ${corTempo}`}>
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
                             {valorPendente > 0 && <button onClick={() => atualizarStatusComanda(itens.filter(i => i.status === 'pendente'), 'pago_antecipado')} className="flex-1 md:flex-none bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl text-sm hover:bg-blue-200">Antecipar</button>}
                             <button onClick={() => atualizarStatusComanda(itens, 'pago')} className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-md text-sm transition-colors">{valorPendente === 0 ? "Encerrar Atendimento" : "Dar Baixa Final"}</button>
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
            {(isAdmin || podeVerCaixa) && <button onClick={exportarPlanilhaGeral} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm">📥 Baixar</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Serviço</th>
                  {!isProfissional && <th className="p-3">Profissional</th>}
                  <th className="p-3 text-right">Valor</th>
                  {(isAdmin || isCaixa) && <th className="p-3 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.length === 0 ? <tr><td colSpan={(isAdmin || isCaixa) ? "6" : (isProfissional ? "4" : "5")} className="p-6 text-center text-gray-400">Nenhum serviço encontrado.</td></tr> : historico.map(item => {
                  const temErro = item.cliente_nome.includes('⚠️ ERRO');
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${temErro ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3 text-gray-500">{item.data}</td>
                      <td className={`p-3 font-medium ${temErro ? 'text-red-600' : 'text-gray-800'}`}>{item.cliente_nome}</td>
                      <td className="p-3 text-gray-600">{item.servico}</td>
                      {!isProfissional && <td className="p-3 text-gray-600">{item.profissional}</td>}
                      <td className="p-3 font-bold text-teal-600 text-right">
                        {temErro ? <s className="text-gray-400">{formatarMoeda(item.valor_total)}</s> : formatarMoeda(item.valor_total)}
                      </td>
                      {(isAdmin || isCaixa) && (
                        <td className="p-3 text-center flex items-center justify-center gap-2">
                          {isCaixa && !temErro && (
                            <button onClick={() => sinalizarErroAtendimento(item.id)} className="text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 p-1.5 rounded-lg font-bold transition-colors shadow-sm" title="Sinalizar Erro">🚩</button>
                          )}
                          {isAdmin && (
                            <button onClick={() => apagarHistorico(item.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg font-bold transition-colors shadow-sm" title="Apagar Atendimento">🗑️</button>
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
           {/* ... conteúdo da aba 2 ... */}
        </div>
      )}

      {/* ABA 3, 4, 5, 6 e MODAIS */}
      {abaAtiva === 3 && podeVerCaixa && <LinhaDoTempo comandas={comandas} />}
      {mostrarNovaDespesa && <ModalNovaDespesa fechar={() => setMostrarNovaDespesa(false)} atualizarDados={() => { carregarDadosExtras(); recarregarTudo(); }} />}
      {mostrarNovoVale && <ModalNovoVale fechar={() => setMostrarNovoVale(false)} atualizarDados={recarregarTudo} />}

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