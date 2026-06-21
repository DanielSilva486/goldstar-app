import React, { useState, useEffect } from 'react';

export default function ModalNovoAtendimento({ aoFechar, aoSalvar }) {
  const [cliente, setCliente] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  
  // NOVO: Estado para armazenar o valor que pode ser modificado na hora
  const [valorCobrado, setValorCobrado] = useState('');

  const [listaColaboradores, setListaColaboradores] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);

  useEffect(() => {
    fetch('https://goldstar-backend-9m2p.onrender.com')
      .then(res => res.json())
      .then(data => setListaColaboradores(data.dados || []));

    fetch('https://goldstar-backend-9m2p.onrender.com')
      .then(res => res.json())
      .then(data => setListaServicos(data.dados || []));
  }, []);

  // Quando o serviço for selecionado, preenchemos o valor automaticamente, mas deixamos livre para editar
  const selecionarServico = (e) => {
    const idEscolhido = e.target.value;
    setServicoId(idEscolhido);
    
    if (idEscolhido) {
      const servicoEncontrado = listaServicos.find(s => s.id.toString() === idEscolhido);
      if (servicoEncontrado) {
        setValorCobrado(servicoEncontrado.preco);
      }
    } else {
      setValorCobrado('');
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    
    if (!cliente || !colaboradorId || !servicoId || !valorCobrado) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nome: cliente,
          colaborador_id: colaboradorId,
          servico_id: servicoId,
          valor_cobrado: Number(valorCobrado) // Envia o valor final da tela
        })
      });
      
      const dados = await res.json();
      
      if (dados.sucesso) {
        aoSalvar(); 
        aoFechar(); 
      } else {
        alert('Erro: ' + dados.erro);
      }
    } catch (erro) {
      alert('Erro de comunicação com o servidor.');
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 flex flex-col shadow-2xl relative">
        
        <div onClick={aoFechar} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-6">Novo Atendimento</h2>

        <form onSubmit={salvar} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome da(o) Cliente</label>
            <input 
              type="text" 
              placeholder="Ex: Joana Ferreira" 
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Profissional</label>
            <select 
  value={colaboradorId}
  onChange={(e) => setColaboradorId(e.target.value)}
  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white text-gray-800 shadow-sm transition-all"
>
  <option value="" className="text-gray-500">Selecione...</option>
  {listaColaboradores.map(colab => (
    <option key={colab.id} value={colab.id} className="text-gray-900 bg-white">
      {colab.nome} ({Number(colab.percentual_comissao)}%)
    </option>
  ))}
</select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Serviço Realizado</label>
            <select 
  value={servicoId}
  onChange={selecionarServico}
  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white text-gray-800 shadow-sm transition-all"
>
  <option value="" className="text-gray-500">Selecione...</option>
  {listaServicos.map(serv => (
    <option key={serv.id} value={serv.id} className="text-gray-900 bg-white">
      {serv.nome}
    </option>
  ))}
</select>
          </div>

          {/* NOVO CAMPO: Valor a Cobrar */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor a Cobrar (R$)</label>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={valorCobrado}
              onChange={(e) => setValorCobrado(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-bold text-teal-700 bg-teal-50"
            />
            <p className="text-[10px] text-gray-500 mt-1">Preenchido automaticamente, mas você pode modificar.</p>
          </div>

          <button 
            type="submit"
            className="mt-2 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            Registrar Venda
          </button>
        </form>
        
      </div>
    </div>
  );
}