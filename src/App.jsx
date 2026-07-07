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
  const [mostrarConfirmacaoSair, setMostrarConfirmacaoSair] = useState(false);
  const [dadosSalao, setDadosSalao] = useState(null); 
  const [comandas, setComandas] = useState([]);

  const [dadosEmpresa, setDadosEmpresa] = useState({
    nome_fantasia: 'Goldstar',
    cor_primaria: '#14b8a6', 
    logo_url: ''
  });

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
      setMostrarLogin(false);
    } else {
      localStorage.removeItem('usuarioGoldstar');
      setMostrarLogin(true);
    }
  }, [usuarioLogado]);

 // 🚀 SAAS: A configuração (cores e logo) agora muda dependendo de qual salão faz login!
  useEffect(() => {
    const idDaEmpresa = usuarioLogado ? usuarioLogado.empresa_id : 1;
    
    fetch(`https://goldstar-backend-9m2p.onrender.com/api/configuracoes?empresa_id=${idDaEmpresa}`)
      .then(res => res.json())
      .then(d => {
        if (d.sucesso && d.dados) {
          setDadosEmpresa({
            nome_fantasia: d.dados.nome_fantasia || 'Goldstar',
            cor_primaria: d.dados.cor_primaria || '#14b8a6',
            logo_url: d.dados.logo_url || ''
          });
          document.title = d.dados.nome_fantasia || 'Sistema de Gestão';

          const iconeParaNavegador = d.dados.logo_url;
          if (iconeParaNavegador) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = iconeParaNavegador;
          }
        }
      })
      .catch(e => console.log('Erro ao carregar configurações SaaS', e));
  }, [usuarioLogado]);

  const isAdmin = usuarioLogado?.perfil === 'admin' || usuarioLogado?.perfil === 'dono';
  const podeOperarCaixa = isAdmin || usuarioLogado?.perfil === 'caixa';

  const dataAtual = new Date();
  
  // 🚀 LÓGICA DO MÊS ATUAL:
  const mesRealHoje = String(dataAtual.getMonth() + 1);
  const anoRealHoje = String(dataAtual.getFullYear());
  
  const [mesSelecionado, setMesSelecionado] = useState(mesRealHoje);
  const [anoSelecionado, setAnoSelecionado] = useState(anoRealHoje);
  
  // Verifica se o que o usuário escolheu é o mesmo de hoje
  const ehMesAtual = String(mesSelecionado) === mesRealHoje && String(anoSelecionado) === anoRealHoje;
  
  const [temaAtivo, setTemaAtivo] = useState(localStorage.getItem('temaGoldstar') || 'teal');

  useEffect(() => {
    localStorage.setItem('temaGoldstar', temaAtivo); 
  }, [temaAtivo]);

  const paleta = {
    teal: { main: dadosEmpresa.cor_primaria, hover: dadosEmpresa.cor_primaria + 'E6', light: dadosEmpresa.cor_primaria + '1A', text: '#115e59' },
    pink: { main: '#ec4899', hover: '#db2777', light: '#fdf2f8', text: '#831843' },
    purple: { main: '#a855f7', hover: '#9333ea', light: '#faf5ff', text: '#581c87' },
    gold: { main: '#eab308', hover: '#ca8a04', light: '#fefce8', text: '#713f12' },
    black: { main: '#1f2937', hover: '#111827', light: '#f3f4f6', text: '#030712' },
  };
  
  const cor = paleta[temaAtivo] || paleta.teal;

  // 🚀 SAAS: Agora o sistema avisa ao servidor qual é a empresa exata que quer os dados!
  const carregarDados = () => {
    if (!usuarioLogado) return; 
    fetch(`https://goldstar-backend-9m2p.onrender.com/api/resumo?mes=${mesSelecionado}&ano=${anoSelecionado}&empresa_id=${usuarioLogado.empresa_id}`)
      .then(r => r.json()).then(d => { if(d.sucesso) setDadosSalao(d); });
  };
  
  const buscarComandas = () => {
    if (!usuarioLogado) return; 
    fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas?empresa_id=${usuarioLogado.empresa_id}`)
      .then(r => r.json()).then(d => { if (d.sucesso) setComandas(d.dados); });
  };

  const recarregarTudo = () => { 
    if (!usuarioLogado) {
      setDadosSalao(null);
      setComandas([]);
      return;
    }
    carregarDados(); 
    buscarComandas(); 
  };

  useEffect(() => { recarregarTudo(); }, [mesSelecionado, anoSelecionado, usuarioLogado]); 

  const confirmarLogout = () => {
    setUsuarioLogado(null);
    setMostrarConfirmacaoSair(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      <style>{`
        .bg-teal-500 { background-color: ${cor.main} !important; }
        .hover\\:bg-teal-600:hover { background-color: ${cor.hover} !important; }
        .text-teal-600, .text-teal-500 { color: ${cor.main} !important; }
        .text-teal-400 { color: ${cor.main} !important; }
        .border-teal-500 { border-color: ${cor.main} !important; }
        .focus\\:border-teal-500:focus { border-color: ${cor.main} !important; }
        .bg-teal-50 { background-color: ${cor.light} !important; }
        .text-teal-900 { color: ${cor.text} !important; }
        .focus\\:ring-teal-500:focus { --tw-ring-color: ${cor.main} !important; }
      `}</style>

      {podeOperarCaixa && usuarioLogado && (
        <button onClick={() => setMostrarNovoAtendimento(true)} className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      <div className="max-w-7xl mx-auto bg-white min-h-screen shadow-2xl flex flex-col">
        <Cabecalho aoClicarPerfil={() => setMostrarLogin(true)} dadosEmpresa={dadosEmpresa} />
        
        {!usuarioLogado ? (
          <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full animate-fade-in-up">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">Acesso Bloqueado</h2>
              <p className="text-sm text-gray-500 mb-6">Por motivos de segurança, você precisa fazer o login para aceder aos dados do sistema.</p>
              <button onClick={() => setMostrarLogin(true)} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md">
                Entrar no Sistema
              </button>
            </div>

         

          </main>

 ) : (
          <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4 md:px-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button onClick={() => setMostrarConfiguracoes(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Ajustes
                  </button>
                )}
                
                {usuarioLogado && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                      👤 {usuarioLogado.nome}
                    </span>
                    <button onClick={() => setMostrarConfirmacaoSair(true)} className="text-xs font-bold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors border border-red-100 shadow-sm">
                      Sair
                    </button>
                  </div>
                )}
              </div>

                <div className="flex gap-2">
                <select 
                  value={mesSelecionado} 
                  onChange={(e) => setMesSelecionado(e.target.value)} 
                  className={`border text-sm rounded-lg outline-none p-2.5 cursor-pointer shadow-sm transition-all
                    ${ehMesAtual 
                      ? 'bg-teal-50 border-teal-400 text-teal-800 font-black' 
                      : 'bg-white border-gray-200 text-gray-700 font-medium hover:bg-gray-50'
                    }`}
                >
                  <option value="1">Janeiro</option><option value="2">Fevereiro</option><option value="3">Março</option><option value="4">Abril</option><option value="5">Maio</option><option value="6">Junho</option><option value="7">Julho</option><option value="8">Agosto</option><option value="9">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                </select>
                
                <select 
                  value={anoSelecionado} 
                  onChange={(e) => setAnoSelecionado(e.target.value)} 
                  className={`border text-sm rounded-lg outline-none p-2.5 cursor-pointer shadow-sm transition-all
                    ${ehMesAtual 
                      ? 'bg-teal-50 border-teal-400 text-teal-800 font-black' 
                      : 'bg-white border-gray-200 text-gray-700 font-medium hover:bg-gray-50'
                    }`}
                >
                  <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option>
                </select>
              </div>
          </div>
            
            {/* 🚀 O NOVO LAYOUT DA TELA DO ADMIN FICA AQUI */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {isAdmin && (
                // O painel fica com tamanho travado (ex: 280px) e gruda no topo (sticky)
                <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 sticky top-4">
                  <PainelValores valores={dadosSalao?.valores} comissoes={dadosSalao?.comissoes} />
                </div>
              )}
              
              {/* A área principal ganha flex-1 para esticar e aproveitar todo o resto da tela! */}
              <div className="flex-1 w-full min-w-0">
                <RelatoriosAbas dados={dadosSalao} mes={mesSelecionado} ano={anoSelecionado} comandas={comandas} recarregarTudo={recarregarTudo} usuario={usuarioLogado} />
              </div>
            </div>
            
          </main>
        )}

      <footer className="w-full text-center py-6 text-gray-400 text-[11px] font-medium border-t border-gray-100">
        Powered by <span className="font-black text-teal-600">GestãoGold</span> | © 2026 — Gestão Inteligente para Salões
      </footer>


      </div>

      {mostrarNovoAtendimento && usuarioLogado && <ModalNovoAtendimento fechar={() => setMostrarNovoAtendimento(false)} recarregarTudo={recarregarTudo} comandas={comandas} />}
      {mostrarConfiguracoes && usuarioLogado && <ModalConfiguracoes fechar={() => setMostrarConfiguracoes(false)} temaAtivo={temaAtivo} setTemaAtivo={setTemaAtivo} />}
      {mostrarLogin && <ModalLogin aoFechar={() => { if(usuarioLogado) setMostrarLogin(false); }} setUsuarioLogado={setUsuarioLogado} />}

      {mostrarConfirmacaoSair && (
        <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center transform transition-all scale-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Sair do Sistema</h2>
            <p className="text-sm text-gray-500 mb-6">Tem a certeza que deseja encerrar a sua sessão?</p>
            <div className="flex gap-3">
              <button onClick={() => setMostrarConfirmacaoSair(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmarLogout} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors">Sim, Sair</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}