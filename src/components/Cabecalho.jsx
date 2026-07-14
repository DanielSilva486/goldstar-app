import React from 'react';

export default function Cabecalho({ aoClicarPerfil, dadosEmpresa }) {
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
    </header>
  );
}