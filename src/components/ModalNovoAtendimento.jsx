import React, { useState, useEffect } from 'react';

export default function ModalNovoAtendimento({ fechar, recarregarTudo, comandas }) {
  const [listaColaboradores, setListaColaboradores] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);

  const [clienteNome, setClienteNome] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [valorCobrado, setValorCobrado] = useState('');
  const [carregandoAdicao, setCarregandoAdicao] = useState(false);

  useEffect(() => {
    const carregarListas = async () => {
      try {
        const resC = await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores');
        const dataC = await resC.json();
        if (dataC.sucesso) setListaColaboradores(dataC.dados);

        const resS = await fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos');
        const dataS = await resS.json();
        if (dataS.sucesso) setListaServicos(dataS.dados);
      } catch (e) { console.error(e); }
    };
    carregarListas();
  }, []);

  const aoMudarServico = (e) => {
    const id = e.target.value;
    setServicoId(id);
    const servico = listaServicos.find(s => s.id == id);
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
          colaborador_id: colaboradorId, servico_id: servicoId, cliente_nome: clienteNome, valor_cobrado: valorCobrado || null, status: 'pendente'
        })
      });
      
      recarregarTudo(); // Atualiza a fila
      
      // Limpa para poder adicionar mais serviços rapidamente
      setServicoId(''); setColaboradorId(''); setValorCobrado('');
      
      // Se quiser que feche automático, descomente a linha abaixo:
      // fechar(); 
    } catch (erro) { alert('Erro ao adicionar à comanda.'); }
    setCarregandoAdicao(false);
  };

  const filaPorProfissional = comandas.reduce((acc, item) => {
    if (!acc[item.profissional]) acc[item.profissional] = 0;
    acc[item.profissional] += (item.duracao || 30);
    return acc;
  }, {});

  const formatarTempo = (minutosTotal) => {
    if (!minutosTotal || minutosTotal === 0) return 'Livre';
    const horas = Math.floor(minutosTotal / 60);
    const min = minutosTotal % 60;
    return horas > 0 ? `${horas}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-fade-in-up">
        
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
             <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             <h2 className="font-bold tracking-wide">Adicionar à Fila</h2>
          </div>
          <button onClick={fechar} className="w-8 h-8 bg-gray-700 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">X</button>
        </div>

        <div className="p-6 overflow-y-auto">
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profissional (Fila Atual)</label>
              <select value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" required>
                <option value="">Selecione quem vai atender...</option>
                {listaColaboradores.map(c => {
                  const tempo = filaPorProfissional[c.nome] || 0;
                  return <option key={c.id} value={c.id}>{c.nome} - {tempo > 0 ? `👉 Ocupada: ${formatarTempo(tempo)}` : '✅ Livre agora'}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Final (R$)</label>
              <input type="number" step="0.01" value={valorCobrado} onChange={(e) => setValorCobrado(e.target.value)} className="w-full border-2 border-teal-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-teal-50 text-teal-900 font-bold" />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={carregandoAdicao} className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                {carregandoAdicao ? 'Adicionando...' : '+ Enviar para Fila / Caixa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}