import React from 'react';

// 🚀 NOVO: O Cabeçalho agora recebe os dadosEmpresa que enviámos do App.jsx
export default function Cabecalho({ aoClicarPerfil, dadosEmpresa }) {
  
  // Variáveis de segurança caso a internet esteja lenta e os dados demorem 1 segundo a chegar
  const nomeEmpresa = dadosEmpresa?.nome_fantasia || "Goldstar";
  const corPrincipal = dadosEmpresa?.cor_primaria || "#14b8a6";
  
  // Tira o símbolo '#' da cor para o gerador de avatares conseguir ler
  const corSemHashtag = corPrincipal.replace('#', '');
  
  // 🚀 NOVO: A magia da Logo! Tem link? Usa o link. Não tem? Gera uma foto com a cor da empresa.
  const urlDaFoto = dadosEmpresa?.logo_url 
    ? dadosEmpresa.logo_url 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeEmpresa)}&background=${corSemHashtag}&color=fff&size=128&bold=true`; 

  return (
    // 🚀 NOVO: O fundo (backgroundColor) agora muda automaticamente conforme a cor do banco!
    <header 
      style={{ backgroundColor: corPrincipal }}
      className="px-6 pt-8 pb-6 flex justify-between items-center shadow-md rounded-b-3xl mb-4 transition-colors duration-500"
    >
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">{nomeEmpresa}</h1>
        {/* Usamos text-white/80 para ficar sempre legível, seja qual for a cor de fundo */}
        <p className="text-sm text-white/80 font-medium mt-0.5 opacity-90">Painel de Controle Profissional</p>
      </div>

 {/* Substitua o seu bloco de botão atual por este: */}     
<button 
  onClick={aoClicarPerfil}
  // Aumentei de w-16 h-16 para w-20 h-20 (você pode colocar w-24 h-24 se preferir maior)
  className="relative w-20 h-20 rounded-full border-2 border-white/30 p-0.5 overflow-visible shadow-sm hover:shadow-lg transition-all active:scale-95 bg-white/10"
>
  <img 
    src={urlDaFoto} 
    alt={`Perfil ${nomeEmpresa}`} 
    className="w-full h-full object-cover rounded-full bg-white"
  />
  {/* A bolinha de status também pode ser aumentada um pouco para acompanhar o novo tamanho do logo */}
  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></span>
</button>

    </header>
  );
}