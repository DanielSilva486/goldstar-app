import React, { useState } from 'react';

export default function ModalLogin({ aoFechar, setUsuarioLogado }) {
  // Controle de qual tela mostrar
  const [modoCadastro, setModoCadastro] = useState(false);

  // Estados do Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Estados do Cadastro
  const [nomeSalao, setNomeSalao] = useState('');
  const [nomeDono, setNomeDono] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');

  // Estados de controle
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');
    setCarregando(true);

    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const json = await res.json();

      if (json.sucesso) {
        setUsuarioLogado(json.usuario);
        aoFechar();
      } else {
        setErro(json.erro || 'E-mail ou senha incorretos.');
      }
    } catch (err) {
      setErro('Erro de conexão. Verifique sua internet.');
    } finally {
      setCarregando(false);
    }
  };

  const fazerCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/nova-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome_salao: nomeSalao, 
          nome_dono: nomeDono, 
          email: emailCadastro, 
          senha: senhaCadastro 
        })
      });
      
      const json = await res.json();

      if (json.sucesso) {
        // Limpa o formulário e volta para o login com mensagem de sucesso
        setModoCadastro(false);
        setEmail(emailCadastro); // Já preenche o email para facilitar o login
        setSenha('');
        setMensagemSucesso('🎉 Salão criado com sucesso! Faça login abaixo para começar.');
      } else {
        setErro(json.erro || 'Erro ao criar conta.');
      }
    } catch (err) {
      setErro('Erro de conexão. Verifique sua internet.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-8">
        
        {/* CABEÇALHO ANIMADO */}
        <div className="bg-teal-500 p-8 text-center relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-full bg-teal-600 opacity-20 transform -skew-y-12 scale-150 origin-top-left"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg rotate-3 transition-transform">
              <span className="text-3xl">{modoCadastro ? '🚀' : '🌟'}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">GestãoGold SaaS</h2>
            <p className="text-teal-50 text-sm font-medium mt-1">
              {modoCadastro ? 'Crie a sua conta gratuita agora' : 'O motor do seu salão de beleza'}
            </p>
          </div>
        </div>

        {/* ÁREA DO FORMULÁRIO */}
        <div className="p-8">
          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100 mb-4 animate-shake">
              {erro}
            </div>
          )}

          {mensagemSucesso && !modoCadastro && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-bold text-center border border-green-100 mb-4 animate-fade-in-up">
              {mensagemSucesso}
            </div>
          )}

          {/* === TELA DE LOGIN === */}
          {!modoCadastro ? (
            <form onSubmit={fazerLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">E-mail de Acesso</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-all"
                  placeholder="ex: ana@salao.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Senha</label>
                <input 
                  type="password" 
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                disabled={carregando}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
              >
                {carregando ? 'Acessando...' : 'Entrar na minha conta'}
              </button>
            </form>
          ) : (
          
          /* === TELA DE CADASTRO === */
            <form onSubmit={fazerCadastro} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Nome do Salão</label>
                <input 
                  type="text" 
                  required
                  value={nomeSalao}
                  onChange={e => setNomeSalao(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white"
                  placeholder="Ex: Studio Bella"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Seu Nome (Dono/a)</label>
                <input 
                  type="text" 
                  required
                  value={nomeDono}
                  onChange={e => setNomeDono(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white"
                  placeholder="Ex: Ana Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">E-mail Profissional</label>
                <input 
                  type="email" 
                  required
                  value={emailCadastro}
                  onChange={e => setEmailCadastro(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white"
                  placeholder="ana@salao.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Crie uma Senha</label>
                <input 
                  type="password" 
                  required
                  value={senhaCadastro}
                  onChange={e => setSenhaCadastro(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <button 
                type="submit" 
                disabled={carregando}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
              >
                {carregando ? 'Criando Salão...' : 'Criar Conta e Acessar'}
              </button>
            </form>
          )}
        </div>
        
        {/* RODAPÉ DO MODAL (ALTERNAR ENTRE TELAS) */}
        <div className="bg-gray-50 p-5 text-center border-t border-gray-100">
          {!modoCadastro ? (
            <p className="text-sm text-gray-600 font-medium">
              Ainda não tem conta?{' '}
              <button onClick={() => { setModoCadastro(true); setErro(''); setMensagemSucesso(''); }} className="text-teal-600 font-black hover:underline">
                Cadastre seu Salão
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600 font-medium">
              Já possui uma conta?{' '}
              <button onClick={() => { setModoCadastro(false); setErro(''); }} className="text-teal-600 font-black hover:underline">
                Faça o Login
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}