import React, { useState } from 'react';

export default function ModalNovaDespesa({ fechar, atualizarDados }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [pago, setPago] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await fetch('https://goldstar-backend-teste.onrender.com/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descricao, 
          valor: Number(valor.replace(',', '.')), 
          fornecedor, 
          data_vencimento: dataVencimento, 
          pago 
        })
      });
      atualizarDados();
      fechar();
    } catch (err) {
      alert('Erro ao salvar despesa.');
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="bg-teal-500 p-4 flex justify-between items-center">
          <h2 className="text-white font-bold tracking-wide">Lançar Nova Despesa</h2>
          <button onClick={fechar} className="w-8 h-8 bg-teal-600 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">X</button>
        </div>

        <form onSubmit={salvar} className="p-6 space-y-4 bg-gray-50">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição (Serviço/Produto) *</label>
            <input type="text" required value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-teal-500 bg-white" placeholder="Ex: Conta de Luz" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" required value={valor} onChange={e => setValor(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-teal-500 bg-white font-bold" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vencimento *</label>
              <input type="date" required value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-teal-500 bg-white text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fornecedor (Opcional)</label>
            <input type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none focus:border-teal-500 bg-white" placeholder="Ex: CPFL" />
          </div>

          <label className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer">
            <input type="checkbox" checked={pago} onChange={e => setPago(e.target.checked)} className="w-5 h-5 accent-teal-500" />
            <span className="text-sm font-bold text-gray-700">Esta conta já está paga</span>
          </label>

          <button type="submit" disabled={salvando} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-transform active:scale-95 disabled:opacity-50 mt-4">
            {salvando ? 'A Gravar...' : 'Gravar Despesa'}
          </button>
        </form>
      </div>
    </div>
  );
}