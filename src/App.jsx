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
      return null;
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
          
          {/* CABEÇALHO RESTAURADO COM OS MESES E ANOS */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button onClick={() => setMostrarConfiguracoes(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Ajustes
                </button>
              )}
              {usuarioLogado && <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">👤 {usuarioLogado.nome}</span>}
            </div>

            <div className="flex gap-2">
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-teal-500 outline-none p-2.5 cursor-pointer">
                <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option><option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option><option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
              </select>
              <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-teal-500 outline-none p-2.5 cursor-pointer">
                <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option>
              </select>
            </div>
          </div>
          {/* FIM DO CABEÇALHO */}
          
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