import React, { useState, useEffect } from 'react';

export default function ModalConfiguracoes({ fechar, temaAtivo, setTemaAtivo }) {
  const [aba, setAba] = useState('tema');
  const [equipe, setEquipe] = useState([]);
  const [salvando, setSalvando] = useState(null);

  const temas = [
    { id: 'teal', nome: 'Verde (Padrão)' },
    { id: 'pink', nome: 'Rosa' },
    { id: 'purple', nome: 'Roxo' },
    { id: 'gold', nome: 'Dourado' },
    { id: 'black', nome: 'Escuro (Dark)' }
  ];

  useEffect(() => {
    if ((aba === 'equipe' || aba === 'comissoes' || aba === 'status') && equipe.length === 0) {
      fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores/todos')
        .then(r => r.json())
        .then(d => { if(d.sucesso) setEquipe(d.dados); });
    }
  }, [aba, equipe.length]);

  const handleChange = (id, campo, valor) => {
    setEquipe(equipe.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };

  const salvarAcesso = async (colab) => {
    setSalvando(colab.id);
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}/acesso`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: colab.email, perfil: colab.perfil, senha: colab.novaSenha })
      });
      alert('✅ Acesso atualizado com sucesso!');
      setEquipe(equipe.map(c => c.id === colab.id ? { ...c, novaSenha: '' } : c));
    } catch (e) { alert('Erro ao salvar acessos.'); }
    setSalvando(null);
  };

  const salvarComissao = async (colab) => {
    setSalvando(colab.id);
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}/comissao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentual_comissao: colab.percentual_comissao })
      });
      alert('✅ Comissão base atualizada com sucesso!');
    } catch (e) { alert('Erro ao salvar comissão.'); }
    setSalvando(null);
  };

  const alternarStatus = async (colab) => {
    const acao = colab.ativo ? 'DESATIVAR' : 'ATIVAR';
    if (!window.confirm(`Tem a certeza que deseja ${acao} a(o) profissional ${colab.nome}?`)) return;
    
    setSalvando(colab.id);
    try {
      const novoStatus = !colab.ativo;
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus })
      });
      setEquipe(equipe.map(c => c.id === colab.id ? { ...c, ativo: novoStatus } : c));
    } catch (e) { alert('Erro ao alterar o status.'); }
    setSalvando(null);
  };

  // Filtra a equipe para mostrar apenas os ativos nas abas de Acesso e Comissões
  const equipeAtiva = equipe.filter(c => c.ativo !== false); // Trata null/undefined como ativo por padrão

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        <div className="bg-gray-800 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-bold tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Painel do Administrador
          </h2>
          <button onClick={fechar} className="w-8 h-8 bg-gray-700 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">X</button>
        </div>

        <div className="flex flex-wrap md:flex-nowrap bg-gray-100 border-b border-gray-200 shrink-0">
          <button onClick={() => setAba('tema')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold transition-colors ${aba === 'tema' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Aparência</button>
          <button onClick={() => setAba('status')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold transition-colors ${aba === 'status' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Status da Equipe</button>
          <button onClick={() => setAba('equipe')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold transition-colors ${aba === 'equipe' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Acessos (Ativos)</button>
          <button onClick={() => setAba('comissoes')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold transition-colors ${aba === 'comissoes' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Comissões (%)</button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          
          {aba === 'tema' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {temas.map(t => (
                <button key={t.id} onClick={() => setTemaAtivo(t.id)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${temaAtivo === t.id ? 'border-teal-500 bg-teal-50 scale-105 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full ${t.id === 'teal' ? 'bg-teal-500' : t.id === 'pink' ? 'bg-pink-500' : t.id === 'purple' ? 'bg-purple-500' : t.id === 'gold' ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>
                  <span className={`text-sm font-bold ${temaAtivo === t.id ? 'text-teal-700' : 'text-gray-600'}`}>{t.nome}</span>
                </button>
              ))}
            </div>
          )}

          {/* NOVA ABA: STATUS DA EQUIPE */}
          {aba === 'status' && (
             <div className="space-y-4">
               <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs md:text-sm font-medium border border-blue-200 shadow-sm flex items-center justify-between">
                 <span>Gerencie quem está trabalhando atualmente no salão. Profissionais inativos não aparecerão nas outras abas.</span>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-800 text-white">
                     <tr>
                       <th className="p-3 font-bold">Colaborador</th>
                       <th className="p-3 font-bold text-center w-32">Status Atual</th>
                       <th className="p-3 font-bold text-center w-40">Ação</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {equipe.map(c => (
                       <tr key={c.id} className={c.ativo !== false ? 'bg-white hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100 opacity-80'}>
                         <td className="p-3 font-bold text-gray-800">{c.nome}</td>
                         <td className="p-3 text-center font-bold">
                           {c.ativo !== false 
                             ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Ativo</span>
                             : <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">Inativo</span>
                           }
                         </td>
                         <td className="p-3 text-center">
                           <button 
                             onClick={() => alternarStatus(c)} 
                             disabled={salvando === c.id}
                             className={`text-xs font-bold px-3 py-1.5 rounded shadow-sm w-full transition-colors ${c.ativo !== false ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                           >
                             {salvando === c.id ? '...' : c.ativo !== false ? 'Desativar' : 'Reativar'}
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {aba === 'equipe' && (
            <div className="space-y-4">
              <div className="bg-teal-50 text-teal-800 p-3 rounded-xl text-xs md:text-sm font-medium border border-teal-200 shadow-sm flex items-center justify-between">
                <span>Defina os e-mails e permissões apenas para a equipa <b>ativa</b>.</span>
              </div>
              
              {equipeAtiva.map(c => (
                <div key={c.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-black text-gray-800 text-lg">{c.nome}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">E-mail de Login</label>
                      <input type="email" value={c.email || ''} onChange={(e) => handleChange(c.id, 'email', e.target.value.toLowerCase())} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trocar Senha</label>
                      <input type="text" placeholder="Deixe em branco p/ manter" value={c.novaSenha || ''} onChange={(e) => handleChange(c.id, 'novaSenha', e.target.value)} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nível de Permissão</label>
                      <select value={c.perfil || 'profissional'} onChange={(e) => handleChange(c.id, 'perfil', e.target.value)} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none">
                        <option value="profissional">Profissional (Apenas Visão Própria)</option>
                        <option value="caixa">Caixa (Fila e Recebimentos)</option>
                        <option value="admin">Administrador (Acesso Total)</option>
                      </select>
                    </div>
                  </div>
                  
                  <button onClick={() => salvarAcesso(c)} disabled={salvando === c.id} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 rounded-xl text-sm mt-1 transition-colors w-full md:w-auto self-end px-6 shadow-md disabled:opacity-50">
                    Salvar Alterações
                  </button>
                </div>
              ))}
            </div>
          )}

          {aba === 'comissoes' && (
            <div className="space-y-4">
              <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-xs md:text-sm font-medium border border-orange-200 shadow-sm">
                Defina a comissão base de cada profissional ativo (em porcentagem %).
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipeAtiva.map(c => (
                  <div key={c.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <span className="font-black text-gray-800 text-base">{c.nome}</span>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comissão Padrão (%)</label>
                      <div className="flex gap-2">
                        <input type="number" value={c.percentual_comissao || 0} onChange={(e) => handleChange(c.id, 'percentual_comissao', e.target.value)} className="w-full border-2 border-gray-100 rounded-lg p-2 text-base font-bold bg-gray-50 focus:border-teal-500 outline-none" />
                        <button onClick={() => salvarComissao(c)} disabled={salvando === c.id} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors whitespace-nowrap shadow-sm disabled:opacity-50">
                          Salvar %
                        </button>
                      </div>
                    </div>
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