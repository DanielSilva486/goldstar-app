import { useState, useEffect } from 'react';

export default function ModalNovoAtendimento({ fechar, atualizarDados }) {
  const [listaColaboradores, setListaColaboradores] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);

  const [clienteNome, setClienteNome] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [valorCobrado, setValorCobrado] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Busca os dados assim que a tela abre
  useEffect(() => {
    // Buscar Profissionais
    fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores')
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setListaColaboradores(data.dados);
      })
      .catch(err => console.error("Erro ao buscar profissionais:", err));

    // Buscar Serviços
    fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos')
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setListaServicos(data.dados);
      })
      .catch(err => console.error("Erro ao buscar serviços:", err));
  }, []);

  const salvarAtendimento = async (e) => {
    e.preventDefault(); // Evita que a página recarregue
    
    if (!colaboradorId || !servicoId || !clienteNome) {
      alert('Por favor, preencha o nome do cliente, profissional e serviço.');
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colaborador_id: colaboradorId,
          servico_id: servicoId,
          cliente_nome: clienteNome,
          valor_cobrado: valorCobrado || null
        })
      });
      
      const data = await res.json();
      
      if (data.sucesso) {
        // Se a venda deu certo, atualiza os painéis e fecha a janela
        if (atualizarDados) atualizarDados();
        fechar();
      } else {
        alert('Erro ao salvar: ' + data.erro);
      }
    } catch (erro) {
      alert('Erro de conexão ao salvar a venda.');
    }
    setCarregando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Novo Atendimento</h2>
            
            {/* O BOTÃO X QUE FECHA O MODAL */}
            <button onClick={fechar} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={salvarAtendimento} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da(o) Cliente</label>
              <input 
                type="text" 
                value={clienteNome} 
                onChange={(e) => setClienteNome(e.target.value)} 
                placeholder="Ex: Joana Ferreira" 
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white text-gray-800" 
                required 
              />
            </div>

            {/* CAIXINHA 1: PROFISSIONAL (Limpa e sem aparência duplicada) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
              <select 
                value={colaboradorId} 
                onChange={(e) => setColaboradorId(e.target.value)} 
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white text-gray-800"