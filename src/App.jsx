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

  // --- LÓGICA DE USUÁRIO E PERMISSÕES ---
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const salvo = localStorage.getItem('usuarioGoldstar');
    return salvo ? JSON.parse(salvo) : { id: 0, nome: 'Admin', perfil: 'admin' };
  });

  useEffect(() => { localStorage.setItem('usuarioGoldstar', JSON.stringify(usuarioLogado)); }, [usuarioLogado]);

  const isAdmin = usuarioLogado.perfil === 'admin';
  const isCaixa = usuarioLogado.perfil === 'caixa';
  const isProfissional = usuarioLogado.perfil === 'profissional';
  const podeOperarCaixa = isAdmin || isCaixa;

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());
  const [temaAtivo, setTemaAtivo] = useState(localStorage.getItem('temaGoldstar') || 'teal');

  useEffect(() => { localStorage.setItem('temaGoldstar', temaAtivo); }, [temaAtivo]);

  const paleta = { teal: { main: '#14b8a6', hover: '#0d9488', light: '#f0fdfa', text: '#115e59' }, pink: { main: '#ec4899', hover: '#db2777', light: '#fdf2f8', text: '#831843' }, purple: { main: '#a855f7', hover: '#9333ea', light: '#faf5ff', text: '#581c87' }, gold: { main: '#eab308', hover: '#ca8a04', light: '#fefce8', text: '#713f12' }, black: { main: '#1f2937', hover: '#111827', light: '#f3f4f6', text: '#030712' } };
  const cor = paleta[temaAtivo] || paleta.teal;

  const carregarDados = () => {
    fetch(`https://goldstar-backend-9m2p.onrender.com/api/resumo?mes=${mesSelecionado}&ano=${anoSelecionado}`).then(r => r.json()).then(d => { if(d.sucesso) setDadosSalao(d); }).catch(e => console.error(e));
  };

  const buscarComandas = () => {
    fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas').then(r => r.json()).then(d => { if (d.sucesso) setComandas(d.dados); }).catch(e => console.error(e));
  };

  const recarregarTudo = () => { carregarDados(); buscarComandas(); };
  useEffect(() => { recarregarTudo(); }, [mesSelecionado, anoSelecionado]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <style>{`.bg-teal-500 { background-color: ${cor.main} !important; } .hover\\:bg-teal-600:hover { background-color: ${cor.hover} !important; } .text-teal-600, .text-teal-500 { color: ${cor.main} !important; } .border-teal-500 { border-color: ${cor.main} !important; } .focus\\:border-teal-500:focus { border-color: ${cor.main} !important; } .bg-teal-50 { background-color: ${cor.light} !important; }`}</style>

      {/* BOTÃO NOVO ATENDIMENTO: Só aparece para Admin e Caixa */}
      {podeOperarCaixa && (
        <button onClick={() => setMostrarNovoAtendimento(true)} className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      <div className="max-w-7xl mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        {/* Mostramos quem está logado no cabeçalho */}
        <Cabecalho aoClicarPerfil={() => setMostrarLogin(true)} />
        
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-4 px-4 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button onClick={() => setMostrarConfiguracoes(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Ajustes
                </button>
              )}
              <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">👤 Olá, {usuarioLogado.nome}</span>
            </div>
            <div className="flex gap-2">
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-teal-500 outline-none p-2.5">
                <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option><option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option><option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
              </select>
              <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-teal-500 outline-none p-2.5">
                <option value="2025">2025</option><option value="2026">2026</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* PAINEL FINANCEIRO: Oculto para Profissionais e Caixas (Só a Admin vê) */}
            {isAdmin && (
              <div className="md:col-span-4 animate-fade-in-up"><PainelValores valores={dadosSalao?.valores} comissoes={dadosSalao?.comissoes} /></div>
            )}
            
            {/* ABAS: Expande para ecrã inteiro se o Painel estiver oculto */}
            <div className={isAdmin ? "md:col-span-8" : "md:col-span-12"}>
              {/* Passamos o usuarioLogado para as abas filtrarem as vistas */}
              <RelatoriosAbas dados={dadosSalao} mes={mesSelecionado} ano={anoSelecionado} comandas={comandas} recarregarTudo={recarregarTudo} usuario={usuarioLogado} />
            </div>
          </div>
        </main>
        <div className="md:hidden"><MenuInferior /></div>
      </div>

      {mostrarNovoAtendimento && <ModalNovoAtendimento fechar={() => setMostrarNovoAtendimento(false)} recarregarTudo={recarregarTudo} comandas={comandas} />}
      {mostrarConfiguracoes && <ModalConfiguracoes fechar={() => setMostrarConfiguracoes(false)} temaAtivo={temaAtivo} setTemaAtivo={setTemaAtivo} />}
      {mostrarLogin && <ModalLogin aoFechar={() => setMostrarLogin(false)} setUsuarioLogado={setUsuarioLogado} />}
    </div>
  );
}