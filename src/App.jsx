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

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear());

  const carregarDados = () => {
    fetch(`https://goldstar-backend-9m2p.onrender.com/api/resumo?mes=${mesSelecionado}&ano=${anoSelecionado}`)
      .then(resposta => resposta.json())
      .then(dados => {
        if(dados.sucesso) setDadosSalao(dados);
      })
      .catch(erro => console.error("Erro ao puxar dados:", erro));
  };

  useEffect(() => {
    carregarDados();
  }, [mesSelecionado, anoSelecionado]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      
      {/* Botão Flutuante */}
      <button 
        onClick={() => setMostrarNovoAtendimento(true)} 
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-[0_10px_25px_rgba(20,184,166,0.4)] flex items-center justify-center transition-all active:scale-90"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {/* Corpo do Aplicativo */}
      <div className="max-w-7xl mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        <Cabecalho aoClicarPerfil={() => setMostrarLogin(true)} />
        
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-4 px-4 md:px-8">
          
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setMostrarConfiguracoes(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              Ajustes
            </button>

            <div className="flex gap-2">
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="bg-gray-50 border p-2 rounded-lg text-sm">
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
              <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="bg-gray-50 border p-2 rounded-lg text-sm">
                <option value="2025">2025</option><option value="2026">2026</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4"><PainelValores valores={dadosSalao?.valores} /></div>
            <div className="md:col-span-8"><RelatoriosAbas dados={dadosSalao} /></div>
          </div>
        </main>

        <div className="md:hidden"><MenuInferior /></div>
      </div>

      {/* Modais com a função atualizarDados conectada */}
      {mostrarNovoAtendimento && <ModalNovoAtendimento fechar={() => setMostrarNovoAtendimento(false)} atualizarDados={carregarDados} />}
      {mostrarConfiguracoes && <ModalConfiguracoes fechar={() => setMostrarConfiguracoes(false)} />}
      {mostrarLogin && <ModalLogin aoFechar={() => setMostrarLogin(false)} />}
      
    </div>
  );
}