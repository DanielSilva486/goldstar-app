import React, { useState, useEffect } from 'react';

// 🚀 SAAS: URL DO COFRE NO GOOGLE SHEETS
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwWfanYNIWjCZRjZsmUy0wQ3OasN8Cbv_1PN7RR-nHg6nDyWn9OxNdPyKDZfHWliqK8sQ/exec';

export default function ModalNovoAtendimento({ fechar, recarregarTudo, comandas = [], clientePreDefinido }) {
  const usuarioLocal = JSON.parse(localStorage.getItem('usuarioGoldstar') || '{}');
  const idSaaS = usuarioLocal.empresa_id || 1;

  const [listaColaboradores, setListaColaboradores] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);
  // 🚀 NOVO: Gaveta para guardar as Regras Específicas da Elaine e companhia
  const [listaComissoesEsp, setListaComissoesEsp] = useState([]);

  const [tipoAdicao, setTipoAdicao] = useState('servico');

  const [clienteNome, setClienteNome] = useState(clientePreDefinido || '');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [valorCobrado, setValorCobrado] = useState('');
  
  const [quantidade, setQuantidade] = useState(1);
  const [precoBase, setPrecoBase] = useState(0);
  
  const [dataManual, setDataManual] = useState('');
  const [carregandoAdicao, setCarregandoAdicao] = useState(false);

  const formatarDataAtualParaInput = () => {
    const agora = new Date();
    const timezoneOffset = agora.getTimezoneOffset() * 60000;
    return (new Date(agora - timezoneOffset)).toISOString().slice(0, 16);
  };

  useEffect(() => {
    setDataManual(formatarDataAtualParaInput());
    
    const carregarListas = async () => {
      try {
        const resC = await fetch(`https://gestaogold.onrender.com/api/colaboradores/todos?empresa_id=${idSaaS}`);
        const dataC = await resC.json();
        if (dataC.sucesso) setListaColaboradores(dataC.dados.filter(c => c.ativo !== false));

        const resS = await fetch(`https://gestaogold.onrender.com/api/servicos?empresa_id=${idSaaS}`);
        const dataS = await resS.json();
        if (dataS.sucesso) setListaServicos(dataS.dados);

        // 🚀 NOVO: Puxa a tabela de regras específicas (Ex: Escova a 40%)
        const resCE = await fetch(`https://gestaogold.onrender.com/api/comissoes-especificas?empresa_id=${idSaaS}`);
        const dataCE = await resCE.json();
        if (dataCE.sucesso) setListaComissoesEsp(dataCE.dados);

      } catch (e) { console.error(e); }
    };
    carregarListas();
  }, [idSaaS]);

  useEffect(() => {
    setServicoId('');
    setColaboradorId('');
    setValorCobrado('');
    setQuantidade(1);
    setPrecoBase(0);
  }, [tipoAdicao]);

  const aoMudarServico = (e) => {
    const id = e.target.value;
    setServicoId(id);
    const servico = listaServicos.find(s => s.id == id);
    if (servico) {
      const preco = Number(servico.preco);
      setPrecoBase(preco);
      setValorCobrado((preco * quantidade).toFixed(2));
    } else {
      setPrecoBase(0);
      setValorCobrado('');
    }
  };

  const mudarQuantidade = (e) => {
    const novaQtd = Math.max(1, Number(e.target.value));
    setQuantidade(novaQtd);
    if (precoBase > 0) {
      setValorCobrado((precoBase * novaQtd).toFixed(2));
    }
  };

  const adicionarNaComanda = async (e) => {
    e.preventDefault();
    if (!clienteNome || !colaboradorId || !servicoId) return;

    setCarregandoAdicao(true);
    try {
      const dataParaEnviar = dataManual ? new Date(dataManual) : new Date();

      const servicoObj = listaServicos.find(s => s.id == servicoId);
      const colabObj = listaColaboradores.find(c => c.id == colaboradorId);

      const qtdLoop = tipoAdicao === 'produto' ? quantidade : 1;
      const valorUnitario = valorCobrado ? (Number(valorCobrado) / qtdLoop) : 0;

      // 💰 A NOVA CALCULADORA BLINDADA
      // 1. Pega a comissão padrão
      let taxaComissao = (colabObj && colabObj.percentual_comissao !== undefined) ? Number(colabObj.percentual_comissao) : 50;
      
      // 2. Procura se existe exceção para esta dupla (Ex: Elaine + Escova)
      const regraEspecifica = listaComissoesEsp.find(r => 
        (r.prof === colabObj?.nome && r.serv === servicoObj?.nome) || 
        (r.colaborador_id == colaboradorId && r.servico_id == servicoId)
      );
      
      // 3. Se achou a regra, sobrepõe o valor padrão
      if (regraEspecifica) {
        taxaComissao = Number(regraEspecifica.percentual);
      }

      if (tipoAdicao === 'produto') taxaComissao = 0; 
      
      const valorDaComissao = (valorUnitario * taxaComissao) / 100;

      for (let i = 0; i < qtdLoop; i++) {
        const filaLocal = JSON.parse(localStorage.getItem('gestaoGold_filaLocal') || '[]');
        const novoItemFila = {
          id: 'local_' + Date.now() + i, 
          cliente_nome: clienteNome,
          profissional: colabObj ? colabObj.nome : '',
          servico: servicoObj ? servicoObj.nome : '',
          servico_tipo: tipoAdicao,
          valor_total: valorUnitario,
          valor_comissao: valorDaComissao, 
          status: 'pendente',
          status_fila: 'aguardando',
          data_hora: dataParaEnviar.toISOString(),
          duracao: servicoObj ? servicoObj.duracao : 30
        };
        filaLocal.push(novoItemFila);
        localStorage.setItem('gestaoGold_filaLocal', JSON.stringify(filaLocal));
      }
      
      recarregarTudo(); 
      
      if (clientePreDefinido) {
        fechar();
      } else {
        setServicoId(''); setColaboradorId(''); setValorCobrado(''); setQuantidade(1); setPrecoBase(0);
        setDataManual(formatarDataAtualParaInput());
      }
      
    } catch (erro) { 
      alert('Erro ao adicionar à comanda.'); 
    }
    setCarregandoAdicao(false);
  };

 const filaPorProfissional = comandas.reduce((acc, item) => {
    const ehProduto = item.servico_tipo === 'produto' || item.duracao === 0 || item.duracao === null;
    
    if (ehProduto) return acc; 

    if (!acc[item.profissional]) acc[item.profissional] = 0;
    
    let tempoRestante = item.duracao || 30;
    if (item.status_fila === 'em_atendimento' && item.hora_inicio) {
      const inicio = new Date(item.hora_inicio);
      const minutosDecorridos = Math.floor((new Date() - inicio) / 60000);
      tempoRestante = Math.max(0, tempoRestante - minutosDecorridos);
    }
    
    acc[item.profissional] += tempoRestante;
    return acc;
  }, {});

  const formatarTempo = (minutosTotal) => {
    if (!minutosTotal || minutosTotal === 0) return 'Livre';
    const horas = Math.floor(minutosTotal / 60);
    const min = minutosTotal % 60;
    return horas > 0 ? `${horas}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  const servicosFiltrados = listaServicos.filter(s => 
    tipoAdicao === 'servico' ? s.tipo !== 'produto' : s.tipo === 'produto'
  );

  const colaboradoresFiltrados = listaColaboradores.filter(c => {
    const deFolgaHoje = String(c.dia_folga || '').split(',').includes(String(new Date().getDay()));
    if (deFolgaHoje) return false;
    return tipoAdicao === 'servico' ? (c.perfil === 'profissional' || c.perfil === 'dono') : true;
  });

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-fade-in-up">
        
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
             <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             <h2 className="font-bold tracking-wide">
               {clientePreDefinido ? 'Adicionar Extra' : 'Novo Atendimento'}
             </h2>
          </div>
          <button onClick={fechar} className="w-8 h-8 bg-gray-700 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">X</button>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50">
          <button 
            onClick={() => setTipoAdicao('servico')} 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${tipoAdicao === 'servico' ? 'bg-white text-purple-600 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-700'}`}>
            💆‍♀️ Serviço de Cadeira
          </button>
          <button 
            onClick={() => setTipoAdicao('produto')} 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${tipoAdicao === 'produto' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>
            🛍️ Venda de Produto
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <form onSubmit={adicionarNaComanda} className="space-y-4">
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Data e Hora do Registro</label>
              <input 
                type="datetime-local" 
                value={dataManual} 
                onChange={(e) => setDataManual(e.target.value)} 
                className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:border-teal-500 outline-none shadow-sm text-gray-600 font-medium" 
                required 
              />
              <p className="text-[9px] text-gray-400 mt-0.5">Altere apenas se estiver registrando um atendimento de dias anteriores.</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da(o) Cliente</label>
              <input 
                type="text" 
                value={clienteNome} 
                onChange={(e) => setClienteNome(e.target.value)} 
                placeholder="Ex: Maria Silva" 
                readOnly={!!clientePreDefinido}
                className={`w-full border-2 rounded-xl p-3 text-sm outline-none transition-colors ${clientePreDefinido ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed font-bold' : 'border-gray-100 bg-gray-50 focus:border-teal-500'}`} 
                required 
              />
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  {tipoAdicao === 'servico' ? 'Qual Serviço?' : 'Qual Produto?'}
                </label>
                <select value={servicoId} onChange={aoMudarServico} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50 font-medium text-gray-700" required>
                  <option value="">{tipoAdicao === 'servico' ? 'Selecione o Serviço...' : 'Selecione o Produto...'}</option>
                  {servicosFiltrados.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} {tipoAdicao === 'servico' ? `(${s.duracao || 0}m)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {tipoAdicao === 'produto' && (
                <div className="w-20">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 text-center">Qtd.</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantidade} 
                    onChange={mudarQuantidade} 
                    className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-white font-black text-center text-blue-700 shadow-sm" 
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                {tipoAdicao === 'servico' ? 'Profissional' : 'Vendedor / Caixa'}
              </label>
              <select value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50 font-medium text-gray-700" required>
                <option value="">{tipoAdicao === 'servico' ? 'Selecione quem vai atender...' : 'Selecione quem está vendendo...'}</option>
                {colaboradoresFiltrados.map(c => {
                    const tempo = filaPorProfissional[c.nome] || 0;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.nome} {tipoAdicao === 'servico' && (tempo > 0 ? `👉 Fila: ${formatarTempo(tempo)}` : '✅ Livre agora')}
                      </option>
                    );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Final (R$)</label>
              <input type="number" step="0.01" value={valorCobrado} onChange={(e) => setValorCobrado(e.target.value)} className="w-full border-2 border-teal-100 rounded-xl p-3 text-xl focus:border-teal-500 outline-none bg-teal-50 text-teal-900 font-black text-center" />
              {tipoAdicao === 'produto' && quantidade > 1 && (
                <p className="text-[10px] text-center text-gray-400 mt-1 font-medium uppercase">
                  O valor acima é o total pelas {quantidade} unidades.
                </p>
              )}
            </div>

            <div className="pt-4">
              <button type="submit" disabled={carregandoAdicao} className={`w-full text-white font-black py-4 rounded-xl transition-all shadow-md text-lg ${tipoAdicao === 'servico' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {carregandoAdicao ? 'Adicionando...' : '+ Confirmar na Fila'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}