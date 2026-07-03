import React, { useState, useEffect } from 'react';

export default function ModalNovoVale({ fechar, atualizarDados }) {
  const [equipe, setEquipe] = useState([]);
  const [profissional, setProfissional] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('https://goldstar-backend-teste.onrender.com/api/colaboradores')
      .then(r => r.json())
      .then(d => { if(d.sucesso) setEquipe(d.dados); });
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    if (!profissional) return alert('Por favor, selecione um profissional.');
    
    setSalvando(true);
    try {
      await fetch('https://goldstar-backend-teste.onrender.com/api/vales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profissional, 
          descricao, 
          valor: Number(valor.replace(',', '.')) 
        })
      });
      atualizarDados();
      fechar();
    } catch (err) {
      alert('Erro ao registar o vale.');
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="bg-orange-500 p-4 flex justify-between items-center">
          <h2 className="text-white font-bold tracking-wide">Lançar Vale / Consumo</h2>
          <button onClick={fechar} className="w-8 h-8 bg-orange-600 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">X</button>
        </div>

        <form onSubmit={salvar} className="p-6 space-y-4 bg-gray-50">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profissional *</label>
            <select required value={profissional} onChange={e => setProfissional(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 bg-white font-bold text-gray-700">
              <option value="">Selecione quem está a dever...</option>
              {equipe.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição do Consumo *</label>
            <input type="text" required value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 bg-white" placeholder="Ex: Compra de Calcinhas, Vale Dinheiro, Lanche..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor a Descontar (R$) *</label>
            <input type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 bg-white font-bold text-orange-600 text-lg" placeholder="0.00" />
          </div>

          <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-xs mt-2 border border-orange-100">
            💡 <b>Nota:</b> Este valor será abatido automaticamente na próxima vez que der baixa na comissão deste profissional.
          </div>

          <button type="submit" disabled={salvando} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-transform active:scale-95 disabled:opacity-50 mt-4">
            {salvando ? 'A Gravar...' : 'Registar Vale'}
          </button>
        </form>
      </div>
    </div>
  );
}