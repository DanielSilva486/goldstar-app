import React, { useState, useEffect } from 'react';

export default function ModalConfiguracoes({ fechar, temaAtivo, setTemaAtivo }) {
  const [abaAtiva, setAbaAtiva] = useState('servicos');
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [comissoesEsp, setComissoesEsp] = useState([]);
  
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoPreco, setNovoServicoPreco] = useState('');
  const [novoColabNome, setNovoColabNome] = useState('');
  const [novoColabComissao, setNovoColabComissao] = useState('');
  const [novoColabId, setNovoColabId] = useState('');
  const [novoServicoId, setNovoServicoId] = useState('');
  const [novaComissao, setNovaComissao] = useState('');

  const carregarDados = async () => {
    const [resS, resC, resCE] = await Promise.all([
      fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos').then(r => r.json()),
      fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores/todos').then(r => r.json()),
      fetch('https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas').then(r => r.json())
    ]);
    setServicos(resS.dados || []);
    setColaboradores(resC.dados || []);
    setComissoesEsp(resCE.dados || []);
  };

  useEffect(() => { carregarDados(); }, []);

  const adicionarServico = async (e) => {
    e.preventDefault();
    await fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: novoServicoNome, preco: Number(novoServicoPreco) })
    });
    setNovoServicoNome(''); setNovoServicoPreco(''); carregarDados();
  };

  const apagarServico = async (id) => {
    await fetch(`https://goldstar-backend-9m2p.onrender.com/api/servicos/${id}`, { method: 'DELETE' });
    carregarDados();
  };

  const adicionarColaborador = async (e) => {
    e.preventDefault();
    await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: novoColabNome, percentual_comissao: Number(novoColabComissao) })
    });
    setNovoColabNome(''); setNovoColabComissao(''); carregarDados();
  };

  const alternarStatus = async (id, statusAtual) => {
    await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !statusAtual })
    });
    carregarDados();
  };

  const salvarComissaoEsp = async (e) => {
    e.preventDefault();
    await fetch('https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colaborador_id: novoColabId, servico_id: novoServicoId, percentual: novaComissao })
    });
    carregarDados();
  };

  return (
    <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        <div onClick={fechar} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full flex items-center justify-center transition-colors">
           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        
        <h2 className="text-xl font-bold mb-4">Ajustes e Personalização</h2>

        <div className="flex gap-2 mb-4 border-b pb-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setAbaAtiva('servicos')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${abaAtiva === 'servicos' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Serviços</button>
          <button onClick={() => setAbaAtiva('equipe')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${abaAtiva === 'equipe' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Equipe</button>
          <button onClick={() => setAbaAtiva('comissoes')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${abaAtiva === 'comissoes' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Comissões Esp.</button>
          <button onClick={() => setAbaAtiva('aparencia')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${abaAtiva === 'aparencia' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>🎨 Aparência</button>
        </div>

        <div className="overflow-y-auto pr-2 pb-4 scrollbar-hide">
          
          {/* --- NOVA ABA: APARÊNCIA --- */}
          {abaAtiva === 'aparencia' && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Paleta de Cores do Sistema</h3>
                <p className="text-sm text-gray-500 mb-4">Escolha a cor que mais combina com o seu salão. A cor será salva automaticamente.</p>
                
                <div className="flex gap-4 justify-start">
                  <button onClick={() => setTemaAtivo('teal')} className={`w-12 h-12 rounded-full bg-[#14b8a6] shadow-sm transition-all ${temaAtivo === 'teal' ? 'ring-4 ring-offset-2 ring-[#14b8a6] scale-110' : 'hover:scale-105'}`} title="Esmeralda"></button>
                  <button onClick={() => setTemaAtivo('pink')} className={`w-12 h-12 rounded-full bg-[#ec4899] shadow-sm transition-all ${temaAtivo === 'pink' ? 'ring-4 ring-offset-2 ring-[#ec4899] scale-110' : 'hover:scale-105'}`} title="Rosa"></button>
                  <button onClick={() => setTemaAtivo('purple')} className={`w-12 h-12 rounded-full bg-[#a855f7] shadow-sm transition-all ${temaAtivo === 'purple' ? 'ring-4 ring-offset-2 ring-[#a855f7] scale-110' : 'hover:scale-105'}`} title="Roxo"></button>
                  <button onClick={() => setTemaAtivo('gold')} className={`w-12 h-12 rounded-full bg-[#eab308] shadow-sm transition-all ${temaAtivo === 'gold' ? 'ring-4 ring-offset-2 ring-[#eab308] scale-110' : 'hover:scale-105'}`} title="Dourado"></button>
                  <button onClick={() => setTemaAtivo('black')} className={`w-12 h-12 rounded-full bg-[#1f2937] shadow-sm transition-all ${temaAtivo === 'black' ? 'ring-4 ring-offset-2 ring-[#1f2937] scale-110' : 'hover:scale-105'}`} title="Preto Minimalista"></button>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'servicos' && (
            <div>
              <form onSubmit={adicionarServico} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <input required type="text" placeholder="Adicionar Serviço..." value={novoServicoNome} onChange={e => setNovoServicoNome(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none" />
                <input required type="number" step="0.01" placeholder="R$ 0,00" value={novoServicoPreco} onChange={e => setNovoServicoPreco(e.target.value)} className="w-24 border rounded-lg p-2 text-sm outline-none" />
                <button type="submit" className="bg-teal-500 text-white px-3 rounded-lg font-bold">+</button>
              </form>
              <div className="space-y-2">
                {servicos.map(s => (
                  <div key={s.id} className="flex justify-between p-3 bg-white border rounded-xl shadow-sm text-sm">
                    <span>{s.nome} <span className="text-teal-600 font-bold ml-2">R$ {Number(s.preco).toFixed(2)}</span></span>
                    <button onClick={() => apagarServico(s.id)} className="text-red-400 font-bold hover:text-red-600">X</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {abaAtiva === 'equipe' && (
            <div>
              <form onSubmit={adicionarColaborador} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <input required type="text" placeholder="Nova Profissional..." value={novoColabNome} onChange={e => setNovoColabNome(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none" />
                <input required type="number" placeholder="Comissão (%)" value={novoColabComissao} onChange={e => setNovoColabComissao(e.target.value)} className="w-28 border rounded-lg p-2 text-sm outline-none" />
                <button type="submit" className="bg-teal-500 text-white px-3 rounded-lg font-bold">+</button>
              </form>
              <div className="space-y-2">
                {colaboradores.map(c => (
                  <div key={c.id} className={`flex justify-between items-center p-3 border rounded-xl shadow-sm ${c.ativo === false ? 'bg-gray-100' : 'bg-white'}`}>
                    <span className={`text-sm ${c.ativo === false ? 'line-through text-gray-400' : 'text-gray-700'}`}>{c.nome} <span className="font-bold ml-2 text-orange-500">{Number(c.percentual_comissao)}%</span></span>
                    <button onClick={() => alternarStatus(c.id, c.ativo)} className="p-1.5 rounded-md">{c.ativo === false ? "✅" : "🚫"}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {abaAtiva === 'comissoes' && (
            <div className="space-y-4">
              <form onSubmit={salvarComissaoEsp} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <select onChange={e => setNovoColabId(e.target.value)} className="border p-2 rounded-lg text-sm bg-white outline-none">
                  <option>Profissional</option>
                  {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <select onChange={e => setNovoServicoId(e.target.value)} className="border p-2 rounded-lg text-sm bg-white outline-none">
                  <option>Serviço</option>
                  {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
                <input required placeholder="% Comissão" type="number" onChange={e => setNovaComissao(e.target.value)} className="border p-2 rounded-lg text-sm outline-none" />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-bold">Salvar Regra</button>
              </form>
              <div className="space-y-2">
                {comissoesEsp.map(item => (
                  <div key={item.id} className="flex justify-between p-3 border rounded-xl bg-white shadow-sm text-sm">
                    <span className="text-gray-700">{item.prof} - {item.serv}</span>
                    <span className="font-bold text-teal-600">{item.percentual}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}