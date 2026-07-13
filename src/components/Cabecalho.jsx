import React from 'react';

// 🚀 COMPONENTE DO SINO (Integrado no Cabeçalho)
const IconeNotificacao = ({ despesas }) => {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const alertas = despesas ? despesas.filter(d => !d.pago && new Date(d.data_vencimento) <= hoje) : [];
  
  return (
    <button className="relative p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all mr-4 shadow-sm border border-white/10" title="Despesas Vencidas">
      🔔
      {alertas.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
          {alertas.length}
        </span>
      )}
    </button>
  );
};

export default function Cabecalho({ aoClicarPerfil, dadosEmpresa, despesas }) {
  const nomeEmpresa = dadosEmpresa?.nome_fantasia || "Goldstar";
  const corPrincipal = dadosEmpresa?.cor_primaria || "#14b8a6";
  const corSemHashtag = corPrincipal.replace('#', '');
  
  const urlDaFoto = dadosEmpresa?.logo_url 
    ? dadosEmpresa.logo_url 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeEmpresa)}&background=${corSemHashtag}&color=fff&size=128&bold=true`; 

  return (
    <header 
      style={{ backgroundColor: corPrincipal }}
      className="px-6 pt-8 pb-6 flex justify-between items-center shadow-md rounded-b-3xl mb-4 transition-colors duration-500"
    >
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">{nomeEmpresa}</h1>
        <p className="text-sm text-white/80 font-medium mt-0.5 opacity-90">Painel de Controle Profissional</p>
      </div>

      <div className="flex items-center">
        {/* 🚀 O SINO DE NOTIFICAÇÕES AGORA ESTÁ AQUI */}
        <IconeNotificacao despesas={despesas} />
        
        <button 
          onClick={aoClicarPerfil}
          className="relative w-20 h-20 rounded-full border-2 border-white/30 p-0.5 overflow-visible shadow-sm hover:shadow-lg transition-all active:scale-95 bg-white/10"
        >
          <img 
            src={urlDaFoto} 
            alt={`Perfil ${nomeEmpresa}`} 
            className="w-full h-full object-cover rounded-full bg-white"
          />
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></span>
        </button>
      </div>
    </header>
  );
}