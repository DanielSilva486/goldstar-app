import React, { useState, useEffect } from 'react';

export default function ModalNovoAtendimento({ fechar, atualizarDados }) {
  const [listaColaboradores, setListaColaboradores] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);

  const [clienteNome, setClienteNome] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [valorCobrado, setValorCobrado] = useState('');
  const [carregandoAdicao, setCarregandoAdicao] = useState(false);

  const [comandas, setComandas] = useState([]);
  const [carregandoComandas, setCarregandoComandas] = useState(false);

  const carregarDadosIniciais = async () => {
    try {
      const resC = await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores');
      const dataC = await resC.json();
      if (dataC.sucesso) setListaColaboradores(dataC.dados);

      const resS = await fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos');
      const dataS = await resS.json();
      if (dataS.sucesso) setListaServicos(dataS.dados);

      buscarComandasAbertas();
    } catch (e) { console.error(e); }
  };

  const buscarComandasAbertas = async () => {
    setCarregandoComandas(true);
    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas');
      const data = await res.json();
      if (data.sucesso) setComandas(data.dados);
    } catch (e) { console.error(e); }
    setCarregandoComandas(false);
  };

  useEffect(() => { carregarDadosIniciais(); }, []);

  const aoMudarServico = (e) => {
    const idSelecionado = e.target.value;
    setServicoId(idSelecionado);
    const servico = listaServicos.find(s => s.id == idSelecionado);
    if (servico) setValorCobrado(servico.preco);
  };

  const adicionarNaComanda = async (e) => {
    e.preventDefault();
    if (!clienteNome || !colaboradorId || !servicoId) return;

    setCarregandoAdicao(true);
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaborador_id: colaboradorId,
          servico_id: servicoId,
          cliente_nome: clienteNome,
          valor_cobrado: valorCobrado || null,
          status: 'pendente'
        })
      });
      
      setServicoId('');
      setColaboradorId('');
      setValorCobrado('');
      buscarComandasAbertas();
    } catch (erro) { alert('Erro ao adicionar à comanda.'); }
    setCarregandoAdicao(false);
  };

  const cobrarComanda = async (nomeCliente, itensDaComanda) => {
    const idsParaPagar = itensDaComanda.map(item => item.id);
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas/pagar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsParaPagar })
      });
      buscarComandasAbertas();
      if (atualizarDados) atualizarDados(); 
    } catch (erro) { alert('Erro ao finalizar cobrança.'); }
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Agrupa comandas por cliente
  const comandasAgrupadas = comandas.reduce((grupos, item) => {
    if (!grupos[item.cliente_nome]) grupos[item.cliente_nome] = [];
    grupos[item.cliente_nome].push(item);
    return grupos;
  }, {});

  // --- MÁGICA DA FILA ---
  // Calcula a soma dos minutos pendentes de cada profissional
  const filaPorProfissional = comandas.reduce((acc, item) => {
    if (!acc[item.profissional]) acc[item.profissional] = 0;
    acc[item.profissional] += (item.duracao || 30); // Se o serviço não tiver tempo cadastrado, assume 30min
    return acc;
  }, {});

  // Formata o tempo para ficar bonito (ex: 90 vira "1h 30m")
  const formatarTempo = (minutosTotal) => {
    if (!minutosTotal || minutosTotal === 0) return 'Livre';
    const horas = Math.floor(minutosTotal / 60);
    const minutos = minutosTotal % 60;
    if (horas > 0) return `${horas}h ${minutos > 0 ? minutos + 'm' : ''}`;
    return `${minutos}m`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4 sm:p-6">
      
      <div className="bg-white w-full max-w-5xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        <div className="bg-gray-800 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-white">
             <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
             <h2 className="text-xl font-bold tracking-wide">Frente de Caixa & Gestão de Fila</h2>
          </div>
          <button onClick={fechar} className="w-8 h-8 bg-gray-700 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">
            X
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* LADO ESQUERDO: Formulário */}
          <div className="w-full md:w-5/12 bg-white p-6 overflow-y-auto border-r border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">1. Dados do Atendimento</h3>
            
            <form onSubmit={adicionarNaComanda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da(o) Cliente</label>
                <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Ex: Maria Silva" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serviço Realizado</label>
                <select value={servicoId} onChange={aoMudarServico} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" required>
                  <option value="">Selecione o Serviço...</option>
                  {listaServicos.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.duracao || 30}m)</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profissional (Tempo de Fila)</label>
                <select value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" required>
                  <option value="">Selecione quem vai atender...</option>
                  {listaColaboradores.map(c => {
                    const tempoOcupado = filaPorProfissional[c.nome] || 0;
                    const avisoFila = tempoOcupado > 0 ? `👉 Ocupada: ${formatarTempo(tempoOcupado)}` : '✅ Livre agora';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.nome} - {avisoFila}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Final (R$)</label>
                <input type="number" step="0.01" value={valorCobrado} onChange={(e) => setValorCobrado(e.target.value)} className="w-full border-2 border-teal-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-teal-50 text-teal-900 font-bold" />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={carregandoAdicao} className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                  {carregandoAdicao ? 'Adicionando...' : '+ Adicionar à Fila / Comanda'}
                </button>
              </div>
            </form>
          </div>

          {/* LADO DIREITO: Painel de Comandas e Tempos */}
          <div className="w-full md:w-7/12 bg-gray-50 p-6 overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
               <h3 className="font-bold text-gray-700">2. Resumo de Comandas (Aguardando)</h3>
               <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg">
                 {Object.keys(comandasAgrupadas).length} em aberto
               </span>
             </div>

             {carregandoComandas ? (
               <p className="text-center text-gray-500 py-10">Buscando comandas...</p>
             ) : Object.keys(comandasAgrupadas).length === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                 <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                 <p>Nenhuma comanda aberta no momento.</p>
               </div>
             ) : (
               <div className="space-y-4 pb-4">
                 {Object.entries(comandasAgrupadas).map(([nomeCliente, itens]) => {
                   const totalComanda = itens.reduce((soma, item) => soma + Number(item.valor_total), 0);

                   return (
                     <div key={nomeCliente} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                       <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                         <h4 className="font-bold text-gray-800">Cliente: <span className="text-blue-600">{nomeCliente}</span></h4>
                       </div>
                       
                       <div className="p-4">
                         <ul className="space-y-2 mb-4">
                           {itens.map(item => (
                             <li key={item.id} className="flex justify-between text-sm text-gray-600 items-center">
                               <div className="flex flex-col">
                                 <span className="font-medium text-gray-800">{item.servico}</span>
                                 <span className="text-[10px] text-gray-400">por {item.profissional} <span className="text-orange-500 font-bold ml-1">⏱️ {item.duracao || 30}m</span></span>
                               </div>
                               <span className="font-medium">{formatarMoeda(item.valor_total)}</span>
                             </li>
                           ))}
                         </ul>
                         
                         <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-end">
                           <div>
                             <p className="text-xs text-gray-500 font-bold uppercase">Total a Cobrar</p>
                             <p className="text-2xl font-black text-gray-800">{formatarMoeda(totalComanda)}</p>
                           </div>
                           <button 
                             onClick={() => cobrarComanda(nomeCliente, itens)}
                             className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-md"
                           >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                             Cobrar e Dar Baixa
                           </button>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}