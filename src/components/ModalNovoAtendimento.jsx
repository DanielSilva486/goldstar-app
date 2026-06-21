import React, { useState, useEffect } from 'react';

export default function ModalNovoAtendimento({ fechar, atualizarDados }) {
  // Listas do Salão
  const [listaColaboradores, setListaColaboradores] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);

  // Estado da Esquerda: Formulário de Adição
  const [clienteNome, setClienteNome] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [valorCobrado, setValorCobrado] = useState('');
  const [carregandoAdicao, setCarregandoAdicao] = useState(false);

  // Estado da Direita: Comandas em Aberto (O Caixa real)
  const [comandas, setComandas] = useState([]);
  const [carregandoComandas, setCarregandoComandas] = useState(false);

  // Carrega Funcionários, Serviços e as Comandas que estão na "espera"
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

  // Preenche o valor automaticamente ao escolher o serviço
  const aoMudarServico = (e) => {
    const idSelecionado = e.target.value;
    setServicoId(idSelecionado);
    const servico = listaServicos.find(s => s.id == idSelecionado);
    if (servico) setValorCobrado(servico.preco);
  };

  // 1. ADICIONA À COMANDA (Status: pendente)
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
          status: 'pendente' // ENTRA NA ESPERA
        })
      });
      
      // Limpa os campos de serviço, mas mantém o nome da cliente (para adicionar mais coisas rápidas)
      setServicoId('');
      setColaboradorId('');
      setValorCobrado('');
      
      // Atualiza a tela da direita (Caixa)
      buscarComandasAbertas();
    } catch (erro) { alert('Erro ao adicionar à comanda.'); }
    setCarregandoAdicao(false);
  };

  // 2. DAR BAIXA / COBRAR (Muda Status para Pago)
  const cobrarComanda = async (nomeCliente, itensDaComanda) => {
    // Pega o ID de todos os serviços que esta cliente fez
    const idsParaPagar = itensDaComanda.map(item => item.id);
    
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas/pagar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsParaPagar })
      });
      
      // Atualiza o Caixa (tira a cliente da espera)
      buscarComandasAbertas();
      // Atualiza o Resumo Financeiro no fundo da tela
      if (atualizarDados) atualizarDados(); 
      
    } catch (erro) { alert('Erro ao finalizar cobrança.'); }
  };

  // Função para formatar moeda
  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Agrupa os itens da espera pelo nome da cliente
  const comandasAgrupadas = comandas.reduce((grupos, item) => {
    if (!grupos[item.cliente_nome]) grupos[item.cliente_nome] = [];
    grupos[item.cliente_nome].push(item);
    return grupos;
  }, {});

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4 sm:p-6">
      
      {/* Container Principal (Largo) */}
      <div className="bg-white w-full max-w-5xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-gray-800 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-white">
             <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
             <h2 className="text-xl font-bold tracking-wide">Frente de Caixa</h2>
          </div>
          <button onClick={fechar} className="w-8 h-8 bg-gray-700 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">
            X
          </button>
        </div>

        {/* Divisão em Duas Colunas */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* LADO ESQUERDO: Adicionar Itens à Comanda */}
          <div className="w-full md:w-5/12 bg-white p-6 overflow-y-auto border-r border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">1. Dados do Atendimento</h3>
            
            <form onSubmit={adicionarNaComanda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da(o) Cliente</label>
                <input 
                  type="text" 
                  value={clienteNome} 
                  onChange={(e) => setClienteNome(e.target.value)} 
                  placeholder="Ex: Maria Silva" 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50 transition-colors" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serviço Realizado</label>
                <select 
                  value={servicoId} 
                  onChange={aoMudarServico} 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" 
                  required
                >
                  <option value="">Selecione o Serviço...</option>
                  {listaServicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profissional</label>
                <select 
                  value={colaboradorId} 
                  onChange={(e) => setColaboradorId(e.target.value)} 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" 
                  required
                >
                  <option value="">Selecione quem atendeu...</option>
                  {listaColaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Final (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={valorCobrado} 
                  onChange={(e) => setValorCobrado(e.target.value)} 
                  className="w-full border-2 border-teal-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-teal-50 text-teal-900 font-bold" 
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={carregandoAdicao} 
                  className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                >
                  {carregandoAdicao ? 'Adicionando...' : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      Adicionar à Comanda
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">O valor só entra no fluxo de caixa após a cobrança ao lado.</p>
              </div>
            </form>
          </div>

          {/* LADO DIREITO: Painel de Comandas Abertas (O Caixa) */}
          <div className="w-full md:w-7/12 bg-gray-50 p-6 overflow-y-auto">
             <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
               <h3 className="font-bold text-gray-700">2. Resumo de Comandas (Aguardando Pagamento)</h3>
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
                   // Calcula o total da comanda desta cliente
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
                                 <span className="text-[10px] text-gray-400">por {item.profissional}</span>
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