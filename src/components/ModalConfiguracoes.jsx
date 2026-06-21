import React, { useState, useEffect } from 'react';

export default function ModalConfiguracoes({ fechar }) {
  const [abaAtiva, setAbaAtiva] = useState('servicos');
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [comissoesEsp, setComissoesEsp] = useState([]);
  
  // Estados para formulários
  const [novoColabId, setNovoColabId] = useState('');
  const [novoServicoId, setNovoServicoId] = useState('');
  const [novaComissao, setNovaComissao] = useState('');

  const carregarDados = async () => {
    const [resS, resC] = await Promise.all([
      fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos').then(r => r.json()),
      fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores/todos').then(r => r.json())
    ]);
    setServicos(resS.dados || []);
    setColaboradores(resC.dados || []);
    
    // Busca comissões especiais (precisaremos criar essa rota no server.js)
    fetch('https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas')
      .then(r => r.json())
      .then(d => setComissoesEsp(d.dados || []));
  };

  useEffect(() => { carregarDados(); }, []);

  const salvarComissaoEsp = async (e) => {
    e.preventDefault();
    await fetch('https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colaborador_id: novoColabId, servico_id: novoServicoId, percentual: novaComissao })
    });
    carregarDados();
  };

  return (
    <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
        <div onClick={fechar} className="absolute top-4 right-4 cursor-pointer p-2 bg-gray-100 rounded-full">✕</div>
        
        <h2 className="text-xl font-bold mb-4">Ajustes</h2>

        {/* Abas */}
        <div className="flex gap-2 mb-4 border-b pb-2">
          <button onClick={() => setAbaAtiva('servicos')} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">Serviços</button>
          <button onClick={() => setAbaAtiva('equipe')} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">Equipe</button>
          <button onClick={() => setAbaAtiva('comissoes')} className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm">Comissões Esp.</button>
        </div>

        {abaAtiva === 'comissoes' && (
          <div className="space-y-4">
            <form onSubmit={salvarComissaoEsp} className="grid grid-cols-2 gap-2">
              <select onChange={e => setNovoColabId(e.target.value)} className="border p-2 rounded text-sm">
                <option>Profissional</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select onChange={e => setNovoServicoId(e.target.value)} className="border p-2 rounded text-sm">
                <option>Serviço</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <input placeholder="% Comissão" type="number" onChange={e => setNovaComissao(e.target.value)} className="border p-2 rounded text-sm" />
              <button type="submit" className="bg-teal-500 text-white rounded text-sm font-bold">Salvar Regra</button>
            </form>

            <div className="mt-4 space-y-2">
              {comissoesEsp.map(item => (
                <div key={item.id} className="flex justify-between p-2 border rounded text-sm">
                  <span>{item.prof} - {item.serv}</span>
                  <span className="font-bold text-teal-600">{item.percentual}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}