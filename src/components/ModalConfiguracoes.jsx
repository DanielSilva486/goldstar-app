import React, { useState, useEffect } from 'react';

export default function ModalConfiguracoes({ aoFechar }) {
  const [abaAtiva, setAbaAtiva] = useState('servicos'); 
  
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoPreco, setNovoServicoPreco] = useState('');
  const [novoColabNome, setNovoColabNome] = useState('');
  const [novoColabComissao, setNovoColabComissao] = useState('');

  // --- NOVO: Estado para a barra de busca ---
  const [termoBusca, setTermoBusca] = useState('');

  const [alerta, setAlerta] = useState({ visivel: false, texto: '', tipo: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ visivel: false, texto: '', acao: null });

  const mostrarAlerta = (texto, tipo) => {
    setAlerta({ visivel: true, texto, tipo });
    setTimeout(() => setAlerta({ visivel: false, texto: '', tipo: '' }), 4000);
  };

  const confirmarAcao = (texto, acao) => {
    setModalConfirmacao({ visivel: true, texto, acao });
  };

  const fecharConfirmacao = () => setModalConfirmacao({ visivel: false, texto: '', acao: null });

  const carregarDados = () => {
    fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos')
      .then(res => res.json())
      .then(dados => setServicos(dados.dados || []));

    fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores')
      .then(res => res.json())
      .then(dados => setColaboradores(dados.dados || []));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const adicionarServico = async (e) => {
    e.preventDefault();
    await fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoServicoNome, preco: Number(novoServicoPreco) })
    });
    setNovoServicoNome(''); setNovoServicoPreco('');
    mostrarAlerta('Serviço cadastrado!', 'sucesso');
    carregarDados();
  };

  const apagarServico = (id) => {
    confirmarAcao("Tem certeza que deseja excluir este serviço?", async () => {
      fecharConfirmacao();
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/servicos/${id}`, { method: 'DELETE' });
      const dados = await res.json();
      if(!dados.sucesso) mostrarAlerta(dados.erro, 'erro');
      else mostrarAlerta('Serviço apagado!', 'sucesso');
      carregarDados();
    });
  };

  const adicionarColaborador = async (e) => {
    e.preventDefault();
    await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoColabNome, percentual_comissao: Number(novoColabComissao) })
    });
    setNovoColabNome(''); setNovoColabComissao('');
    mostrarAlerta('Profissional cadastrada!', 'sucesso');
    carregarDados();
  };

  const apagarColaborador = (id) => {
    confirmarAcao("Tem certeza que deseja excluir esta profissional?", async () => {
      fecharConfirmacao();
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${id}`, { method: 'DELETE' });
      const dados = await res.json();
      if(!dados.sucesso) mostrarAlerta("Proteção ativada: Não é possível apagar uma pessoa que já possui serviços no histórico financeiro.", 'erro');
      else mostrarAlerta('Profissional apagada!', 'sucesso');
      carregarDados();
    });
  };

  // --- Lógica de Filtro da Busca ---
  const servicosFiltrados = servicos.filter(s => s.nome.toLowerCase().includes(termoBusca.toLowerCase()));
  const colabFiltrados = colaboradores.filter(c => c.nome.toLowerCase().includes(termoBusca.toLowerCase()));

  // Função para trocar de aba e limpar a busca
  const mudarAba = (aba) => {
    setAbaAtiva(aba);
    setTermoBusca('');
  };

  return (
    <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 flex flex-col shadow-2xl relative max-h-[90vh] overflow-hidden">
        
        {alerta.visivel && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg text-sm font-bold text-white z-50 transition-all ${alerta.tipo === 'erro' ? 'bg-red-500' : 'bg-green-500'}`}>
            {alerta.texto}
          </div>
        )}

        {modalConfirmacao.visivel && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col justify-center items-center z-50 p-6 text-center">
             <div className="bg-red-100 p-4 rounded-full mb-4 text-red-600">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Exclusão</h3>
             <p className="text-gray-600 mb-6">{modalConfirmacao.texto}</p>
             <div className="flex gap-3">
               <button onClick={fecharConfirmacao} className="px-5 py-2 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
               <button onClick={modalConfirmacao.acao} className="px-5 py-2 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Sim, Apagar</button>
             </div>
          </div>
        )}

        <div onClick={aoFechar} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full flex items-center justify-center transition-colors">
           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Ajustes e Cadastros</h2>

        <div className="flex gap-2 mb-4 border-b pb-2">
          <button onClick={() => mudarAba('servicos')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${abaAtiva === 'servicos' ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Serviços</button>
          <button onClick={() => mudarAba('equipe')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${abaAtiva === 'equipe' ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Equipe</button>
        </div>

        {/* --- BARRA DE BUSCA --- */}
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            placeholder={`Buscar ${abaAtiva === 'servicos' ? 'serviço' : 'profissional'}...`} 
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="overflow-y-auto pr-2 pb-4 scrollbar-hide">
          
          {abaAtiva === 'servicos' && (
            <div>
              <form onSubmit={adicionarServico} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
                <input required type="text" placeholder="Adicionar Serviço..." value={novoServicoNome} onChange={e => setNovoServicoNome(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                <input required type="number" step="0.01" placeholder="R$ 0,00" value={novoServicoPreco} onChange={e => setNovoServicoPreco(e.target.value)} className="w-24 border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                <button type="submit" className="bg-teal-500 text-white px-3 rounded-lg font-bold hover:bg-teal-600 transition-colors">+</button>
              </form>

              <div className="space-y-2">
                {servicosFiltrados.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">Nenhum serviço encontrado.</p>
                ) : (
                  servicosFiltrados.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-300 transition-colors">
                      <span className="text-sm font-medium text-gray-700">{s.nome} <span className="text-teal-600 font-bold ml-2">R$ {Number(s.preco).toFixed(2)}</span></span>
                      <button onClick={() => apagarServico(s.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {abaAtiva === 'equipe' && (
            <div>
              <form onSubmit={adicionarColaborador} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner">
                <input required type="text" placeholder="Nova Profissional..." value={novoColabNome} onChange={e => setNovoColabNome(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                <input required type="number" placeholder="Comissão (%)" value={novoColabComissao} onChange={e => setNovoColabComissao(e.target.value)} className="w-28 border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                <button type="submit" className="bg-teal-500 text-white px-3 rounded-lg font-bold hover:bg-teal-600 transition-colors">+</button>
              </form>

              <div className="space-y-2">
                {colabFiltrados.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">Nenhuma profissional encontrada.</p>
                ) : (
                  colabFiltrados.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-300 transition-colors">
                      <span className="text-sm font-medium text-gray-700">{c.nome} <span className="text-orange-500 font-bold ml-2">{Number(c.percentual_comissao)}%</span></span>
                      <button onClick={() => apagarColaborador(c.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}