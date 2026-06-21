import React from 'react';

export default function ModalLogin({ aoFechar }) {
  return (
    <div className="absolute inset-0 bg-gray-900/60 flex justify-center items-end sm:items-center z-50">
      {/* Container do Modal */}
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 flex flex-col items-center shadow-lg pb-12 relative">
        
        {/* Seta para fechar o modal */}
        <div 
          onClick={aoFechar}
          className="absolute -top-4 w-10 h-10 bg-gray-400 hover:bg-gray-500 cursor-pointer rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors"
        >
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2 mt-4">Definições do perfil</h2>
        <p className="text-gray-500 text-sm mb-8 text-center">
          Guarde o seu progresso e acesse o sistema do salão.
        </p>

        {/* Botão do Google */}
        <div className="w-full bg-blue-50/50 rounded-2xl flex items-center justify-between p-3 mb-4 shadow-sm border border-blue-100">
          <div className="flex items-center gap-3 pl-2">
            {/* Ícone do Google em SVG */}
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-gray-700 font-medium">Google</span>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors">
            Ligar
          </button>
        </div>
      </div>
    </div>
  );
}