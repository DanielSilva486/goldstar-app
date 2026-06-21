import React from 'react';

export default function Cabecalho({ aoClicarPerfil }) {
  
  // --- SUA FOTO DE PERFIL ---
  // Para colocar a sua foto real, basta apagar o link abaixo e colar o link da sua foto 
  // (pode ser a foto do seu perfil do Google, do WhatsApp ou do Instagram do salão)
  const urlDaFoto = "https://ui-avatars.com/api/?name=Goldstar+Salão&background=0D8ABC&color=fff&size=128&bold=true"; 

  return (
    <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-white">
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Goldstar</h1>
        <p className="text-sm text-gray-500 font-medium mt-0.5">Gestão do Salão</p>
      </div>
      
      <button 
        onClick={aoClicarPerfil}
        className="relative w-12 h-12 rounded-full border-2 border-gray-100 p-0.5 overflow-visible shadow-sm hover:shadow-md transition-all active:scale-95 bg-white"
      >
        <img 
          src={urlDaFoto} 
          alt="Perfil Goldstar" 
          className="w-full h-full object-cover rounded-full"
        />
        {/* Bolinha verde de status "Online" */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
      </button>
    </header>
  );
}