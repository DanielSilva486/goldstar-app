import React, { useState, useEffect } from 'react';

export default function ModalConfiguracoes({ fechar }) {
  const [abaAtiva, setAbaAtiva] = useState('servicos');
  const [colaboradores, setColaboradores] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');

  const carregarDados = () => {
    fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores/todos')
      .then(res => res.json())
      .then(dados => setColaboradores(dados.dados || []));
  };

  useEffect(() => { carregarDados(); }, []);

  const alternarStatus = async (id, statusAtual) => {
    await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !statusAtual })
    });
    carregarDados();
  };

  const colabFiltrados = colaboradores.filter(c => c.nome.toLowerCase().includes(termoBusca.toLowerCase()));

  return (
    <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
        
        {/* BOTÃO X FECHAR CORRIGIDO */}
        <div onClick={fechar} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full flex items-center justify-center">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>

        <h2 className="text-xl font-bold mb-4">Equipe</h2>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {colabFiltrados.map(c => (
            <div key={c.id} className={`flex justify-between items-center p-3 border rounded-xl ${c.ativo === false ? 'bg-gray-100' : 'bg-white'}`}>
              <span className={c.ativo === false ? 'line-through text-gray-400' : 'text-gray-700'}>
                {c.nome} - {Number(c.percentual_comissao)}%
              </span>
              
              <button onClick={() => alternarStatus(c.id, c.ativo)} className="p-2">
                {c.ativo === false ? "✅" : "🚫"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}