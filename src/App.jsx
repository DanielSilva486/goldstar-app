import React, { useState, useEffect } from 'react';
import Cabecalho from './components/Cabecalho';
import PainelValores from './components/PainelValores';
import MenuInferior from './components/MenuInferior';
import ModalLogin from './components/ModalLogin';
import RelatoriosAbas from './components/RelatoriosAbas';
import ModalNovoAtendimento from './components/ModalNovoAtendimento';
import ModalConfiguracoes from './components/ModalConfiguracoes';

export default function App() {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarNovoAtendimento, setMostrarNovoAtendimento] = useState(false);
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false); 
  const [dadosSalao, setDadosSalao] = useState(null); 
  const [comandas, setComandas] = useState([]);

  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    try {
      const salvo = localStorage.getItem('usuarioGoldstar');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed.nome === 'Admin') return { ...parsed, perfil: 'admin' };
        return parsed;
      }
      return null; // Retorna null se não estiver logado
    } catch (e) { return null; }
  });

  useEffect(() => { 
    if (usuarioLogado) {
      localStorage.setItem('usuarioGoldstar', JSON.stringify(usuarioLogado)); 
    } else {
      localStorage.removeItem('usuarioGoldstar');
    }
  }, [usuarioLogado]);

  useEffect(() => { if (!usuarioLogado) setMostrarLogin(true); }, [usuarioLogado]);

  const isAdmin = usuarioLogado?.perfil === 'admin';
  const podeOperarCaixa = isAdmin || usuarioLogado?.perfil === 'caixa';

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [temaAtivo, setTemaAtivo] = useState(localStorage.getItem('temaGoldstar') || 'teal');

  const carregarDados = () => {
    fetch(`https://goldstar-backend-9m2p.onrender.com/api/resumo?mes=${mesSelecionado}&ano=${anoSelecionado}`)
      .then(r => r.json()).then(d => { if(d.sucesso) setDadosSalao(d); });
  };
  const buscarComandas = () => {
    fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas')
      .then(r => r.json()).then(d => { if (d.sucesso) setComandas(d.dados); });
  };
  const recarregarTudo = () => { carregarDados(); buscarComandas(); };
  useEffect(() => { recarregarTudo(); }, [mesSelecionado, anoSelecionado]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {podeOperarCaixa && (
        <button onClick={() => setMostrarNovoAtendimento(true)} className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      <div className="max-w-7xl mx-auto bg-white min-h-screen shadow-2xl flex flex-col">
        <Cabecalho aoClicarPerfil={() => setMostrarLogin(true)} />
        <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4 md:px-8">
          <div className="flex justify-between items-center mb-6">
            {isAdmin && (
              <button onClick={() => setMostrarConfiguracoes(true)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-700">Ajustes</button>
            )}
            {usuarioLogado && <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">👤 {usuarioLogado.nome}</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {isAdmin && (
              <div className="md:col-span-4"><PainelValores valores={dadosSalao?.valores} comissoes={dadosSalao?.comissoes} /></div>
            )}
            <div className={isAdmin ? "md:col-span-8" : "md:col-span-12"}>
              <RelatoriosAbas dados={dadosSalao} mes={mesSelecionado} ano={anoSelecionado} comandas={comandas} recarregarTudo={recarregarTudo} usuario={usuarioLogado} />
            </div>
          </div>
        </main>
      </div>

      {mostrarNovoAtendimento && <ModalNovoAtendimento fechar={() => setMostrarNovoAtendimento(false)} recarregarTudo={recarregarTudo} comandas={comandas} />}
      {mostrarConfiguracoes && <ModalConfiguracoes fechar={() => setMostrarConfiguracoes(false)} temaAtivo={temaAtivo} setTemaAtivo={setTemaAtivo} />}
      {mostrarLogin && <ModalLogin aoFechar={() => setMostrarLogin(false)} setUsuarioLogado={setUsuarioLogado} />}
    </div>
  );
}