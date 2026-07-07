import React, { useState } from 'react';

export default function ModalLogin({ aoFechar, setUsuarioLogado }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      // 🚀 Chama o seu Backend SaaS
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const json = await res.json();

      if (json.sucesso) {
        setUsuarioLogado(json.usuario); // O usuário já vem com o empresa_id do backend!
        aoFechar();
      } else {
        setErro(json.erro || 'E-mail ou senha incorretos.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Cabeçalho do Login */}
        <div className="bg-teal-500 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-teal-600 opacity-20 transform -skew-y-12 scale-150 origin-top-left"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
              <span className="text-4xl">🌟</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">GestãoGold SaaS</h2>
            <p className="text-teal-50 text-sm font-medium mt-1">O motor do seu salão de beleza</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <form onSubmit={fazerLogin} className="space-y-5">
            
            {erro && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100 animate-shake">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">E-mail de Acesso</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-gray-700 bg-gray-50 focus:bg-white"
                placeholder="ex: ana@salao.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Senha</label>
              <input 
                type="password" 
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium text-gray-700 bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={carregando}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Acessar Sistema...
                </>
              ) : 'Entrar na minha conta'}
            </button>
          </form>
        </div>
        
        {/* Rodapé do Modal */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium">Ambiente seguro e criptografado 🔒</p>
        </div>

      </div>
    </div>
  );
}