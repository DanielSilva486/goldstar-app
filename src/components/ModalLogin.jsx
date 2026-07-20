import React, { useState } from 'react';

export default function ModalLogin({ aoFechar, setUsuarioLogado }) {
  // Controle de qual ecrã mostrar
  const [telaAtiva, setTelaAtiva] = useState('login'); // 'login', 'cadastro' ou 'recuperacao'
  const [etapaRecuperacao, setEtapaRecuperacao] = useState(1);

  // Estados do Login e Recuperação
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  // Estados do Cadastro
  const [nomeSalao, setNomeSalao] = useState('');
  const [nomeDono, setNomeDono] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState(''); // 🚀 NOVO: Estado para confirmar e-mail
  const [senhaCadastro, setSenhaCadastro] = useState('');

  // Estados de controlo
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro(''); setMensagemSucesso(''); setCarregando(true);

    try {
      const res = await fetch('https://gestaogold.onrender.com/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const json = await res.json();

      if (json.sucesso) {
        setUsuarioLogado(json.usuario);
        aoFechar();
      } else {
        setErro(json.erro || 'E-mail ou senha incorretos.');
      }
    } catch (err) { setErro('Erro de conexão. Verifique a sua internet.'); } 
    finally { setCarregando(false); }
  };

  const fazerCadastro = async (e) => {
    e.preventDefault();
    setErro(''); setCarregando(true);

    // 🚀 BLINDAGEM 1: Verifica se os e-mails são idênticos
    if (emailCadastro.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
      setCarregando(false);
      return setErro('Os e-mails não coincidem. Verifique a digitação!');
    }

    // 🚀 BLINDAGEM 2: Verifica o formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailCadastro)) {
      setCarregando(false);
      return setErro('Digite um formato de e-mail válido (ex: seu.nome@gmail.com).');
    }

    // 🚀 BLINDAGEM 3: Bloqueia domínios de teste óbvios
    const dominiosProibidos = ['@teste.com', '@exemplo.com', '@123.com', '@email.com', '@admin.com'];
    const dominioInvalido = dominiosProibidos.some(d => emailCadastro.toLowerCase().includes(d));
    if (dominioInvalido) {
      setCarregando(false);
      return setErro('Por motivos de segurança, não aceitamos e-mails de teste. Use um e-mail real.');
    }

    try {
      const res = await fetch('https://gestaogold.onrender.com/api/nova-empresa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_salao: nomeSalao, nome_dono: nomeDono, email: emailCadastro.toLowerCase(), senha: senhaCadastro })
      });
      const json = await res.json();

      if (json.sucesso) {
        setTelaAtiva('login');
        setEmail(emailCadastro); 
        setSenha('');
        setMensagemSucesso('🎉 Salão criado com sucesso! Faça login abaixo para começar.');
      } else {
        setErro(json.erro || 'Erro ao criar conta.');
      }
    } catch (err) { setErro('Erro de conexão. Verifique a sua internet.'); } 
    finally { setCarregando(false); }
  };

  const pedirCodigoRecuperacao = async (e) => {
    e.preventDefault();
    if (!email) return setErro("Digite o seu e-mail para receber o código.");
    
    setErro(''); setMensagemSucesso(''); setCarregando(true);
    try {
      const res = await fetch('https://gestaogold.onrender.com/api/esqueci-senha', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const json = await res.json();

      if (json.sucesso) {
        setEtapaRecuperacao(2);
        setMensagemSucesso('Código enviado! Verifique a sua caixa de entrada (e o Spam).');
      } else {
        setErro(json.erro || 'Erro ao enviar código.');
      }
    } catch (err) { setErro('Erro de conexão.'); } 
    finally { setCarregando(false); }
  };

  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    setErro(''); setCarregando(true);

    try {
      const res = await fetch('https://gestaogold.onrender.com/api/redefinir-senha', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: codigoRecuperacao, novaSenha })
      });
      const json = await res.json();

      if (json.sucesso) {
        setTelaAtiva('login');
        setSenha('');
        setCodigoRecuperacao('');
        setEtapaRecuperacao(1);
        setMensagemSucesso('✅ Senha alterada com sucesso! Pode fazer login agora.');
      } else {
        setErro(json.erro || 'Código inválido ou expirado.');
      }
    } catch (err) { setErro('Erro de conexão.'); } 
    finally { setCarregando(false); }
  };

  const mudarTela = (novaTela) => {
    setTelaAtiva(novaTela);
    setErro('');
    setMensagemSucesso('');
    if (novaTela === 'recuperacao') setEtapaRecuperacao(1);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-8">
        
        {/* CABEÇALHO ANIMADO COM LOGOMARCA NOVA */}
        <div className={`p-8 text-center relative overflow-hidden transition-all duration-500 ${telaAtiva === 'recuperacao' ? 'bg-indigo-600' : 'bg-teal-500'}`}>
          <div className={`absolute top-0 left-0 w-full h-full opacity-20 transform -skew-y-12 scale-150 origin-top-left ${telaAtiva === 'recuperacao' ? 'bg-indigo-700' : 'bg-teal-600'}`}></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-3 shadow-xl rounded-full overflow-hidden border-4 border-white/20 transition-transform hover:scale-105 bg-white">
              <img src="/logo-gold.png" alt="GestãoGold" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight">GestãoGold SaaS</h2>
            <p className="text-white/80 text-sm font-medium mt-1">
              {telaAtiva === 'cadastro' ? 'Crie a sua conta gratuita' : telaAtiva === 'recuperacao' ? 'Recuperação de Acesso' : 'O motor do seu salão de beleza'}
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

          {mensagemSucesso && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-bold text-center border border-green-100 mb-4 animate-fade-in-up">
              {mensagemSucesso}
            </div>
          )}

          {/* === TELA DE LOGIN === */}
          {telaAtiva === 'login' && (
            <form onSubmit={fazerLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">E-mail de Acesso</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-all" placeholder="ex: ana@salao.com" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="block text-sm font-bold text-gray-700">Senha</label>
                  <a href="mailto:suportegestaogold@gmail.com?subject=Ajuda com o GestãoGold" className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors">Precisa de ajuda?</a>
                </div>
                <input type="password" required value={senha} onChange={e => setSenha(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-all" placeholder="••••••••" />
              </div>
              <div className="flex justify-between mt-1 px-1">
                 <button type="button" onClick={() => mudarTela('recuperacao')} className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                   Esqueci a minha senha
                 </button>
              </div>
              <button type="submit" disabled={carregando} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 mt-4 disabled:opacity-70">
                {carregando ? 'Acessando...' : 'Entrar na minha conta'}
              </button>
            </form>
          )}

          {/* === TELA DE RECUPERAÇÃO === */}
          {telaAtiva === 'recuperacao' && (
            <form onSubmit={etapaRecuperacao === 1 ? pedirCodigoRecuperacao : salvarNovaSenha} className="space-y-4 animate-fade-in">
              {etapaRecuperacao === 1 ? (
                <>
                  <p className="text-sm text-gray-600 font-medium text-center mb-2">Digite o e-mail associado à sua conta para receber o código de 6 dígitos.</p>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">O seu E-mail</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white" placeholder="ex: ana@salao.com" />
                  </div>
                  <button type="submit" disabled={carregando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-70">
                    {carregando ? 'A enviar...' : 'Enviar Código por E-mail'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Código de 6 dígitos</label>
                    <input type="text" required maxLength="6" value={codigoRecuperacao} onChange={e => setCodigoRecuperacao(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white text-center font-mono text-xl tracking-[0.5em]" placeholder="000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Criar Nova Senha</label>
                    <input type="password" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white" placeholder="Mínimo 6 caracteres" />
                  </div>
                  <button type="submit" disabled={carregando} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-70 mt-2">
                    {carregando ? 'A Salvar...' : 'Salvar Nova Senha'}
                  </button>
                </>
              )}
            </form>
          )}

          {/* === TELA DE CADASTRO === */}
          {telaAtiva === 'cadastro' && (
            <form onSubmit={fazerCadastro} className="space-y-4 animate-fade-in">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4">
                <p className="text-xs text-blue-800 font-bold flex items-start gap-2">
                  <span className="text-lg">🛡️</span>
                  Utilize um e-mail real e que você tenha acesso. Se esquecer a senha no futuro, o código de recuperação só será enviado para este e-mail.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Nome do Salão</label>
                <input type="text" required value={nomeSalao} onChange={e => setNomeSalao(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50" placeholder="Ex: Studio Bella" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">O Seu Nome (Dono/a)</label>
                <input type="text" required value={nomeDono} onChange={e => setNomeDono(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50" placeholder="Ex: Ana Silva" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">E-mail Profissional</label>
                <input type="email" required value={emailCadastro} onChange={e => setEmailCadastro(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50" placeholder="ana@salao.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Confirmar E-mail</label>
                <input type="email" required value={confirmarEmail} onChange={e => setConfirmarEmail(e.target.value)} onPaste={(e) => e.preventDefault()} className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50" placeholder="Digite o e-mail novamente" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Crie uma Senha</label>
                <input type="password" required minLength="4" value={senhaCadastro} onChange={e => setSenhaCadastro(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl p-2.5 outline-none focus:border-teal-500 bg-gray-50" placeholder="Mínimo 4 caracteres" />
              </div>
              <button type="submit" disabled={carregando} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-70 mt-2">
                {carregando ? 'A Criar...' : 'Criar Conta e Acessar'}
              </button>
            </form>
          )}
        </div>
        
        {/* RODAPÉ DO MODAL (ALTERNAR ENTRE ECRÃS) */}
        <div className="bg-gray-50 p-5 text-center border-t border-gray-100 flex flex-col gap-2">
          {telaAtiva !== 'cadastro' && (
            <p className="text-sm text-gray-600 font-medium">
              Ainda não tem conta?{' '}
              <button type="button" onClick={() => mudarTela('cadastro')} className="text-teal-600 font-black hover:underline">
                Cadastre o seu Salão
              </button>
            </p>
          )}
          
          {telaAtiva !== 'login' && (
            <p className="text-sm text-gray-600 font-medium">
              Já possui uma conta?{' '}
              <button type="button" onClick={() => mudarTela('login')} className="text-teal-600 font-black hover:underline">
                Faça o Login
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}