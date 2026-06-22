import React, { useState } from 'react';

export default function ModalLogin({ aoFechar, setUsuarioLogado }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setCarregando(true); setErro('');
    
    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario, senha })
      });
      const data = await res.json();
      
      if (data.sucesso) {
        setUsuarioLogado(data.usuario);
        aoFechar();
      } else {
        setErro(data.erro || 'Erro ao entrar. Verifique o nome.');
      }
    } catch (err) { setErro('Erro de conexão'); }
    
    setCarregando(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
        <button onClick={aoFechar} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex justify-center items-center text-gray-600 font-bold hover:bg-gray-200">X</button>
        
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-800 mb-6 text-center">Acesso da Equipe</h2>
        
        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu Nome / Usuário</label>
            <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Ex: admin ou Gaby" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-teal-500 outline-none bg-gray-50" required />
          </div>
          
          {erro && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{erro}</p>}
          
          <button type="submit" disabled={carregando} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-2">
            {carregando ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-gray-400 bg-gray-50 p-3 rounded-xl">
          <p className="font-bold">Informação para Teste:</p>
          <p>Mestre: <span className="font-bold text-gray-600">admin</span> | Senha: <span className="font-bold text-gray-600">admin</span></p>
          <p>Equipe: Escreva o nome exato e a senha padrão <span className="font-bold text-gray-600">1234</span></p>
        </div>
      </div>
    </div>
  );
}