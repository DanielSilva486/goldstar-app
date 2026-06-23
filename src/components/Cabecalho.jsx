import React from 'react';

export default function Cabecalho({ aoClicarPerfil }) {
  
  // --- SUA FOTO DE PERFIL ---
  const urlDaFoto = "https://ui-avatars.com/api/?name=Goldstar+Salão&background=0D8ABC&color=fff&size=128&bold=true"; 

  return (
    <header className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 pt-8 pb-6 flex justify-between items-center shadow-md rounded-b-3xl mb-4">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Gestão Goldstar</h1>
        <p className="text-sm text-teal-100 font-medium mt-0.5 opacity-90">Painel de Controle Profissional</p>
      </div>
      
      <button 
        onClick={aoClicarPerfil}
        className="relative w-12 h-12 rounded-full border-2 border-teal-500 p-0.5 overflow-visible shadow-sm hover:shadow-lg transition-all active:scale-95 bg-white"
      >
        <img 
          src={urlDaFoto} 
          alt="Perfil Goldstar" 
          className="w-full h-full object-cover rounded-full"
        />
        {/* Bolinha verde de status "Online" adaptada para destacar no fundo escuro */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm"></span>
      </button>
    </header>
  );
}