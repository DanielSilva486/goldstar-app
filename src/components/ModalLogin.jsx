import React, { useState } from 'react';

export default function ModalLogin({ aoFechar, setUsuarioLogado }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setCarregando(true); setErro('');
    
    try {
      const res = await fetch('https://goldstar-backend-teste.onrender.com/api/login', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();
      
      if (data.sucesso) {
        setUsuarioLogado(data.usuario);
        aoFechar();
      } else {
        setErro(data.erro || 'Erro ao entrar. Verifique as credenciais.');
      }
    } catch (err) { setErro('Erro de conexão com o servidor.'); }
    
    setCarregando(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
        <button onClick={aoFechar} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex justify-center items-center text-gray-600 font-bold hover:bg-gray-200">X</button>
        
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-800 mb-6 text-center">Acesso da Equipe</h2>
        
        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value.toLowerCase())} 
              placeholder="ex: admim@goldstar.com" 
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
            <input 
              type="password" 
              value={senha} 
              onChange={e => setSenha(e.target.value)} 
              placeholder="••••" 
              className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" 
              required 
            />
          </div>
          
          {erro && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{erro}</p>}
          
          <button type="submit" disabled={carregando} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-2">
            {carregando ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-gray-400 bg-gray-50 p-3 rounded-xl">
          
          <p className="mt-1">Equipe: Seu nome junto + @goldstar.com<br/>(ex: <span className="font-bold text-gray-600">gaby@goldstar.com</span>) | Senha: <span className="font-bold text-gray-600">1234</span></p>
        </div>
      </div>
    </div>
  );
}