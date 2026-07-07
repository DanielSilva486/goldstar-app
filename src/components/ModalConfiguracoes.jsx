import React, { useState, useEffect } from 'react';

export default function ModalConfiguracoes({ fechar, temaAtivo, setTemaAtivo }) {
  const [aba, setAba] = useState('tema');
  const usuarioLocal = JSON.parse(localStorage.getItem('usuarioGoldstar') || '{}');
  const idSaaS = usuarioLocal.empresa_id || 1;
  const [equipe, setEquipe] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [comissoesEsp, setComissoesEsp] = useState([]);
  const [salvando, setSalvando] = useState(null);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [novoServico, setNovoServico] = useState({ id: null, nome: '', preco: '', duracao: 30, tipo: 'servico' });
  const [abaProduto, setAbaProduto] = useState('servico'); 

  const [novaRegra, setNovaRegra] = useState({});
  const [novoProfissional, setNovoProfissional] = useState({ nome: '', percentual_comissao: '', chave_pix: '' });
  
  const [dadosEmpresa, setDadosEmpresa] = useState({ nome_fantasia: '', cor_primaria: '#00C49A', logo_url: '', hora_abertura: '', hora_fecho: '', ip_autorizado: '' });

  const [confirmacao, setConfirmacao] = useState({ aberto: false, titulo: '', mensagem: '', onConfirm: null });
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const pedirConfirmacao = (titulo, mensagem, acao) => {
    setConfirmacao({ aberto: true, titulo, mensagem, onConfirm: acao });
  };

  const mostrarToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3500);
  };

  const temas = [
    { id: 'teal', nome: 'Verde (Padrão)' },
    { id: 'pink', nome: 'Rosa' },
    { id: 'purple', nome: 'Roxo' },
    { id: 'gold', nome: 'Dourado' },
    { id: 'black', nome: 'Escuro (Dark)' }
  ];

  // 🚀 SAAS: Buscas blindadas por empresa
  const carregarServicos = async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/servicos?empresa_id=${idSaaS}`);
      const d = await res.json();
      if (d.sucesso) setServicos(d.dados);
    } catch(e) {}
  };

  const carregarComissoesEsp = async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas?empresa_id=${idSaaS}`);
      const d = await res.json();
      if (d.sucesso) setComissoesEsp(d.dados);
    } catch(e) {}
  };

  const carregarEquipe = async () => {
    try {
      const r = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/todos?empresa_id=${idSaaS}`);
      const d = await r.json();
      if (d.sucesso) setEquipe(d.dados);
    } catch(e) {}
  };

  const carregarEmpresa = async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/configuracoes?empresa_id=${idSaaS}`);
      const d = await res.json();
      if (d.sucesso && d.dados) setDadosEmpresa({
        nome_fantasia: d.dados.nome_fantasia || '',
        cor_primaria: d.dados.cor_primaria || '#00C49A',
        logo_url: d.dados.logo_url || '',
        hora_abertura: d.dados.hora_abertura || '',
        hora_fecho: d.dados.hora_fecho || '',
        ip_autorizado: d.dados.ip_autorizado || ''
      });
    } catch(e) {}
  };

  useEffect(() => {
    if ((aba === 'equipe' || aba === 'comissoes' || aba === 'status') && equipe.length === 0) {
      carregarEquipe();
    }
    if (aba === 'servicos' || aba === 'comissoes') {
      carregarServicos();
    }
    if (aba === 'comissoes') {
      carregarComissoesEsp();
    }
    if (aba === 'empresa') {
      carregarEmpresa();
    }
  }, [aba, equipe.length]);

  const handleChange = (id, campo, valor) => {
    setEquipe(equipe.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };

  const handleRegra = (colab_id, campo, valor) => {
    setNovaRegra({ ...novaRegra, [colab_id]: { ...novaRegra[colab_id], [campo]: valor } });
  };

  const fazerUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'goldstar_logo'); 
    const cloudName = 'dwoaj3sug';

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setDadosEmpresa({ ...dadosEmpresa, logo_url: data.secure_url });
        mostrarToast('Logótipo carregado e processado!');
      } else {
        mostrarToast('Erro ao processar imagem.', 'erro');
      }
    } catch (error) {
      mostrarToast('Erro de ligação à nuvem.', 'erro');
    }
    setUploadingLogo(false);
  };

  const salvarEmpresa = async (e) => {
    e.preventDefault();
    setSalvando('empresa');
    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dadosEmpresa, empresa_id: idSaaS })
      });
      const d = await res.json();
      if(d.sucesso) {
        mostrarToast('Configurações salvas! A cor e logótipo serão aplicados ao atualizar a página.');
      } else {
        mostrarToast('Erro ao salvar.', 'erro');
      }
    } catch (error) {
       mostrarToast('Erro de conexão.', 'erro');
    }
    setSalvando(null);
  };

  const adicionarProfissional = async (e) => {
    e.preventDefault();
    setSalvando('novo_profissional');
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            apelido: novoProfissional.nome, 
            nome_completo: novoProfissional.nome_completo,
            pix: novoProfissional.chave_pix,
            percentual_comissao: novoProfissional.percentual_comissao,
            empresa_id: idSaaS
        })
      });
      setNovoProfissional({ nome: '', percentual_comissao: '', chave_pix: '', nome_completo: '' });
      mostrarToast('Profissional cadastrado! A senha inicial é 1234.');
      carregarEquipe(); 
    } catch (e) { mostrarToast('Erro ao adicionar o profissional.', 'erro'); }
    setSalvando(null);
  };

  const exportarPlanilhaEquipe = async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/exportar-equipe?empresa_id=${idSaaS}`);
      const json = await res.json();
      if (!json.sucesso) return alert("Erro ao buscar dados.");
      
      let csv = "Apelido,Nome Completo,E-mail,Senha,PIX,Comissao,Perfil\n";
      json.dados.forEach(c => {
        csv += `${c.nome},${c.nome_completo || ''},${c.email},${c.senha || '1234'},${c.chave_pix || ''},${c.percentual_comissao}%,${c.perfil}\n`;
      });
      
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "lista_completa_equipe.csv";
      link.click();
    } catch (e) { alert("Erro ao gerar planilha."); }
  };

  const salvarAcesso = async (colab) => {
    setSalvando(colab.id);
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}/acesso`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email: colab.email, perfil: colab.perfil, senha: colab.novaSenha, dia_folga: colab.dia_folga })
      });
      mostrarToast('Acesso atualizado com sucesso!');
      setEquipe(equipe.map(c => c.id === colab.id ? { ...c, novaSenha: '' } : c));
    } catch (e) { mostrarToast('Erro ao salvar acessos.', 'erro'); }
    setSalvando(null);
  };

  const salvarComissaoPadrao = async (colab) => {
    setSalvando(colab.id);
    try {
      await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}/comissao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentual_comissao: colab.percentual_comissao })
      });
      mostrarToast('Comissão padrão atualizada!');
    } catch (e) { mostrarToast('Erro ao salvar comissão.', 'erro'); }
    setSalvando(null);
  };

  const alternarStatus = (colab) => {
    const acao = colab.ativo ? 'DESATIVAR' : 'ATIVAR';
    pedirConfirmacao(
      `${acao} PROFISSIONAL`,
      `Tem a certeza que deseja ${acao.toLowerCase()} a(o) profissional ${colab.nome}?`,
      async () => {
        setSalvando(colab.id);
        try {
          const novoStatus = !colab.ativo;
          await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: novoStatus })
          });
          setEquipe(equipe.map(c => c.id === colab.id ? { ...c, ativo: novoStatus } : c));
          mostrarToast(`Profissional ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
        } catch (e) { mostrarToast('Erro ao alterar o status.', 'erro'); }
        setSalvando(null);
      }
    );
  };

  const deletarColaborador = (colab) => {
    pedirConfirmacao(
      "EXCLUIR DEFINITIVAMENTE",
      `Deseja realmente apagar o registo de ${colab.nome}? Atenção: Só é possível apagar se o profissional não tiver nenhum serviço feito no Histórico Geral.`,
      async () => {
        setSalvando(colab.id);
        try {
          const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/colaboradores/${colab.id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.sucesso) {
            mostrarToast(`${colab.nome} apagada(o) do sistema!`);
            carregarEquipe();
          } else {
            mostrarToast('Erro: Este profissional já gerou histórico no salão e não pode ser apagado, apenas Desativado.', 'erro');
          }
        } catch (e) { mostrarToast('Erro de conexão.', 'erro'); }
        setSalvando(null);
      }
    );
  };

  const adicionarServico = async (e) => {
    e.preventDefault();
    setSalvando('novo_servico');
    try {
      if (novoServico.id) {
        await fetch(`https://goldstar-backend-9m2p.onrender.com/api/servicos/${novoServico.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: novoServico.nome, preco: novoServico.preco, duracao: abaProduto === 'produto' ? 0 : novoServico.duracao })
        });
        mostrarToast(`${abaProduto === 'produto' ? 'Produto' : 'Serviço'} atualizado com sucesso!`);
      } else {
        await fetch('https://goldstar-backend-9m2p.onrender.com/api/servicos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...novoServico, tipo: abaProduto, duracao: abaProduto === 'produto' ? 0 : novoServico.duracao, empresa_id: idSaaS })
        });
        mostrarToast(`${abaProduto === 'produto' ? 'Produto' : 'Serviço'} adicionado ao sistema!`);
      }
      setNovoServico({ id: null, nome: '', preco: '', duracao: 30, tipo: abaProduto });
      carregarServicos();
    } catch (e) { mostrarToast('Erro ao salvar.', 'erro'); }
    setSalvando(null);
  };

  const prepararEdicaoServico = (s) => {
    setNovoServico({ id: s.id, nome: s.nome, preco: s.preco, duracao: s.duracao || 30, tipo: s.tipo });
  };

  const cancelarEdicaoServico = () => {
    setNovoServico({ id: null, nome: '', preco: '', duracao: 30, tipo: abaProduto });
  };

  const deletarServico = (id) => {
    pedirConfirmacao(
      "Arquivar Item",
      "Deseja arquivar este item? Ele sairá do Caixa, mas os relatórios antigos continuarão intactos.",
      async () => {
        try {
          const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/servicos/${id}`, { method: 'DELETE' });
          const d = await res.json();
          if(d.sucesso) {
             carregarServicos(); 
             mostrarToast('Item arquivado com sucesso.');
          } else {
             mostrarToast('Não foi possível arquivar.', 'erro');
          }
        } catch (e) { mostrarToast('Erro de conexão.', 'erro'); }
      }
    );
  };

  const adicionarRegraEspecifica = async (colab_id) => {
    const regra = novaRegra[colab_id];
    if (!regra || !regra.servico_id || !regra.percentual) return mostrarToast("Selecione o serviço e digite a percentagem!", 'erro');
    
    setSalvando('regra_' + colab_id);
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colaborador_id: colab_id, servico_id: regra.servico_id, percentual: regra.percentual, empresa_id: idSaaS })
      });
      setNovaRegra({ ...novaRegra, [colab_id]: { servico_id: '', percentual: '' } });
      carregarComissoesEsp();
      mostrarToast('Regra específica adicionada!');
    } catch (e) { mostrarToast('Erro ao salvar regra.', 'erro'); }
    setSalvando(null);
  };

  const deletarRegraEspecifica = (id) => {
    pedirConfirmacao(
      "Remover Regra",
      "Deseja remover esta regra? O profissional voltará a receber a comissão padrão neste serviço.",
      async () => {
        try {
          await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-especificas/${id}`, { method: 'DELETE' });
          carregarComissoesEsp(); 
          mostrarToast('Regra removida com sucesso!');
        } catch (e) { mostrarToast('Erro ao remover regra.', 'erro'); }
      }
    );
  };

  const equipeAtiva = equipe.filter(c => c.ativo !== false);
  const listaServicos = servicos.filter(s => s.tipo !== 'produto');
  const listaProdutos = servicos.filter(s => s.tipo === 'produto');

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {toast.visivel && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
            <div className={`px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 ${toast.tipo === 'erro' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
              {toast.tipo === 'erro' ? '⚠️' : '✅'} {toast.mensagem}
            </div>
          </div>
        )}

        <div className="bg-gray-800 p-4 flex justify-between items-center shrink-0">
          <h2 className="text-white font-bold tracking-wide flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Painel do Administrador
          </h2>
          <button onClick={fechar} className="w-8 h-8 bg-gray-700 hover:bg-red-500 text-white rounded-full flex justify-center items-center transition-colors">X</button>
        </div>

        <div className="flex flex-wrap bg-gray-100 border-b border-gray-200 shrink-0 text-[10px] md:text-sm">
          <button onClick={() => setAba('tema')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'tema' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Aparência</button>
          <button onClick={() => setAba('empresa')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'empresa' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Dados</button>
          <button onClick={() => setAba('status')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'status' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Status</button>
          <button onClick={() => setAba('equipe')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'equipe' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Acessos</button>
          <button onClick={() => setAba('servicos')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'servicos' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Catálogo</button>
          <button onClick={() => setAba('comissoes')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'comissoes' ? 'bg-white text-teal-600 border-b-2 border-teal-500' : 'text-gray-500 hover:text-gray-700'}`}>Comissões (%)</button>
          <button onClick={() => setAba('assinatura')} className={`flex-1 py-3 px-1 font-bold transition-colors ${aba === 'assinatura' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>⭐ Meu Plano</button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 relative">
          
          {aba === 'tema' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {temas.map(t => (
                <button key={t.id} onClick={() => setTemaAtivo(t.id)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${temaAtivo === t.id ? 'border-teal-500 bg-teal-50 scale-105 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full ${t.id === 'teal' ? 'bg-teal-500' : t.id === 'pink' ? 'bg-pink-500' : t.id === 'purple' ? 'bg-purple-500' : t.id === 'gold' ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>
                  <span className={`text-sm font-bold ${temaAtivo === t.id ? 'text-teal-700' : 'text-gray-600'}`}>{t.nome}</span>
                </button>
              ))}
            </div>
          )}

          {aba === 'empresa' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium border border-blue-200 shadow-sm">
                Personalize o sistema para os seus clientes. Defina o nome e a cor principal da marca. O logótipo será armazenado automaticamente na nuvem.
              </div>
              
              <form onSubmit={salvarEmpresa} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-5">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Salão / Empresa</label>
                   <input type="text" required placeholder="Ex: Studio Bela" value={dadosEmpresa.nome_fantasia} onChange={e => setDadosEmpresa({...dadosEmpresa, nome_fantasia: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm bg-gray-50 focus:border-teal-500 outline-none transition-colors"/>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor Principal da Marca</label>
                   <div className="flex gap-3 items-center">
                     <input type="color" value={dadosEmpresa.cor_primaria} onChange={e => setDadosEmpresa({...dadosEmpresa, cor_primaria: e.target.value})} className="w-14 h-14 rounded cursor-pointer border-0 p-0 bg-transparent" />
                     <input type="text" value={dadosEmpresa.cor_primaria} onChange={e => setDadosEmpresa({...dadosEmpresa, cor_primaria: e.target.value})} className="flex-1 border-2 border-gray-100 rounded-xl p-3 text-sm font-mono bg-gray-50 focus:border-teal-500 outline-none transition-colors uppercase" placeholder="#00C49A" />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1 font-medium">Clique no quadrado para escolher a cor visualmente.</p>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logótipo da Empresa</label>
                   <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                       {dadosEmpresa.logo_url ? (
                         <img src={dadosEmpresa.logo_url} alt="Logo" className="w-full h-full object-contain" />
                       ) : (
                         <span className="text-2xl opacity-30">📷</span>
                       )}
                     </div>
                     <div className="flex-1">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={fazerUploadLogo}
                         disabled={uploadingLogo}
                         className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer transition-colors"
                       />
                       <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                         {uploadingLogo ? 'A enviar imagem para a nuvem...' : 'Apenas imagens (PNG ou JPG). O fundo transparente é recomendado.'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="mt-2 border-t border-gray-100 pt-4">
                   <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                     🔒 Segurança do Caixa
                   </h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                     <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Horário de Abertura</label>
                       <input 
                         type="time" 
                         value={dadosEmpresa.hora_abertura || ''} 
                         onChange={(e) => setDadosEmpresa({...dadosEmpresa, hora_abertura: e.target.value})} 
                         className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm bg-gray-50 focus:border-teal-500 outline-none transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Horário de Fecho</label>
                       <input 
                         type="time" 
                         value={dadosEmpresa.hora_fecho || ''} 
                         onChange={(e) => setDadosEmpresa({...dadosEmpresa, hora_fecho: e.target.value})} 
                         className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm bg-gray-50 focus:border-teal-500 outline-none transition-colors"
                       />
                     </div>
                   </div>

                   <div>
                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">IP da Rede Wi-Fi Autorizada (Opcional)</label>
                     <input 
                       type="text" 
                       placeholder="Ex: 177.10.25.102"
                       value={dadosEmpresa.ip_autorizado || ''} 
                       onChange={(e) => setDadosEmpresa({...dadosEmpresa, ip_autorizado: e.target.value})} 
                       className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm bg-gray-50 focus:border-teal-500 outline-none transition-colors"
                     />
                     <p className="text-[10px] text-gray-400 mt-1">
                       Se preenchido, o perfil "Caixa" só conseguirá aceder se estiver conectado a esta rede de internet.
                     </p>
                   </div>
                 </div>

                 <button type="submit" disabled={salvando === 'empresa'} className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-xl text-sm transition-colors shadow-md disabled:opacity-50">
                   {salvando === 'empresa' ? 'A Guardar...' : 'Guardar Dados da Empresa'}
                 </button>
              </form>
            </div>
          )}

          {aba === 'status' && (
             <div className="space-y-4">
               <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs md:text-sm font-medium border border-blue-200 shadow-sm flex items-center justify-between">
                 <span>Gerencie quem está trabalhando atualmente no salão. Profissionais inativos não aparecerão nas outras abas.</span>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-800 text-white">
                     <tr>
                       <th className="p-3 font-bold">Colaborador</th>
                       <th className="p-3 font-bold text-center w-32">Status Atual</th>
                       <th className="p-3 font-bold text-center w-56">Ação</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {equipe.map(c => (
                       <tr key={c.id} className={c.ativo !== false ? 'bg-white hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100 opacity-80'}>
                         <td className="p-3">
                           <div className="flex flex-col">
                             <span className="font-bold text-gray-800 text-sm md:text-base">{c.nome_completo || c.nome}</span>
                             <span className="text-[10px] md:text-[11px] text-gray-500 font-medium mt-0.5">
                               Visor do Caixa: <strong className="text-gray-600">{c.nome}</strong>
                             </span>
                           </div>
                         </td>
                         <td className="p-3 text-center font-bold">
                           {c.ativo !== false 
                             ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">Ativo</span>
                             : <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">Inativo</span>
                           }
                         </td>
                         <td className="p-3 text-center flex justify-center gap-2">
                           <button onClick={() => alternarStatus(c)} disabled={salvando === c.id} className={`text-xs font-bold px-3 py-1.5 rounded shadow-sm flex-1 transition-colors ${c.ativo !== false ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                             {salvando === c.id ? '...' : c.ativo !== false ? 'Desativar' : 'Reativar'}
                           </button>
                           <button onClick={() => deletarColaborador(c)} disabled={salvando === c.id} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded shadow-sm transition-colors text-xs font-bold border border-red-100" title="Excluir Definitivamente">
                             🗑️
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {aba === 'equipe' && (
            <div className="space-y-4">
              <div className="bg-teal-50 text-teal-800 p-3 rounded-xl text-xs md:text-sm font-medium border border-teal-200 shadow-sm flex items-center justify-between mb-4">
                <span>Defina os e-mails e permissões apenas para a equipa <b>ativa</b>. Cadastre novos profissionais abaixo.</span>
              </div>

              <form onSubmit={adicionarProfissional} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-4 mb-6">
                 <div className="flex flex-wrap md:flex-nowrap gap-4">
                   <div className="flex-1 min-w-[150px]">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Apelido (Exibido no Sistema)</label>
                     <input type="text" required placeholder="Ex: Mari" value={novoProfissional.nome} onChange={e => setNovoProfissional({...novoProfissional, nome: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                   </div>
                   <div className="w-32">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comissão (%)</label>
                     <input type="number" required placeholder="Ex: 50" value={novoProfissional.percentual_comissao} onChange={e => setNovoProfissional({...novoProfissional, percentual_comissao: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                   </div>
                 </div>

                 <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                   <div className="flex-[2] min-w-[200px]">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                     <input type="text" required placeholder="Ex: Maria Santos Oliveira" value={novoProfissional.nome_completo || ''} onChange={e => setNovoProfissional({...novoProfissional, nome_completo: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                   </div>
                   <div className="flex-1 min-w-[150px]">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chave PIX</label>
                     <input type="text" required placeholder="Ex: 123.456.789-00" value={novoProfissional.chave_pix || ''} onChange={e => setNovoProfissional({...novoProfissional, chave_pix: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                   </div>
                   <button type="submit" disabled={salvando === 'novo_profissional'} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 h-[38px] whitespace-nowrap">
                     + Cadastrar
                   </button>
                 </div>
              </form>

              <div className="flex justify-between items-center mb-4">
                <span className="text-xs md:text-sm font-medium text-teal-800">Defina os e-mails e permissões apenas para a equipa ativa.</span>
                <button onClick={exportarPlanilhaEquipe} className="bg-teal-100 text-teal-700 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-teal-200 transition-colors">
                  📥 Baixar Planilha Mestra
                </button>
              </div>
              
              {equipeAtiva.map(c => (
                <div key={c.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-800 text-lg">{c.nome_completo || c.nome}</span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        Visor do Caixa: <strong className="text-gray-500">{c.nome}</strong> | PIX: {c.chave_pix || 'Não informado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">E-mail de Login</label>
                      <input type="email" value={c.email || ''} onChange={(e) => handleChange(c.id, 'email', e.target.value.toLowerCase())} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trocar Senha</label>
                      <input type="text" placeholder="Deixe em branco p/ manter" value={c.novaSenha || ''} onChange={(e) => handleChange(c.id, 'novaSenha', e.target.value)} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nível de Permissão</label>
                     <select value={c.perfil || 'profissional'} onChange={(e) => handleChange(c.id, 'perfil', e.target.value)} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none">
                        <option value="profissional">Profissional (Apenas Visão Própria)</option>
                        <option value="caixa">Caixa (Fila e Recebimentos)</option>
                        <option value="admin">Administrador (Acesso Total)</option>
                        <option value="dono">Dono (Admin + Atende Clientes)</option>
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-4 mt-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Dias de Folga (Pode marcar vários)</label>
                      <div className="flex flex-wrap gap-4 bg-white border-2 border-gray-100 rounded-lg p-3">
                        {[{id:0, n:'Dom'}, {id:1, n:'Seg'}, {id:2, n:'Ter'}, {id:3, n:'Qua'}, {id:4, n:'Qui'}, {id:5, n:'Sex'}, {id:6, n:'Sáb'}].map(d => {
                          const valorSeguro = c.dia_folga !== null && c.dia_folga !== undefined ? String(c.dia_folga) : '';
                          const diasSelecionados = valorSeguro === '-1' ? [] : valorSeguro.split(',').filter(Boolean);
                          const taMarcado = diasSelecionados.includes(String(d.id));

                          return (
                            <label key={d.id} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer hover:text-teal-600 transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-teal-500 cursor-pointer"
                                checked={taMarcado}
                                onChange={(e) => {
                                  let novoArray = [...diasSelecionados];
                                  if (e.target.checked) {
                                      if (!novoArray.includes(String(d.id))) novoArray.push(String(d.id));
                                  } else {
                                      novoArray = novoArray.filter(dia => dia !== String(d.id));
                                  }
                                  handleChange(c.id, 'dia_folga', novoArray.length > 0 ? novoArray.join(',') : '');
                                }} 
                              />
                              {d.n}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => salvarAcesso(c)} disabled={salvando === c.id} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 rounded-xl text-sm mt-1 transition-colors w-full md:w-auto self-end px-6 shadow-md disabled:opacity-50">
                    Salvar Alterações
                  </button>
                </div>
              ))}
            </div>
          )}

          {aba === 'servicos' && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-200 rounded-xl w-fit">
                <button 
                  onClick={() => setAbaProduto('servico')} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${abaProduto === 'servico' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  💆‍♀️ Serviços de Cadeira
                </button>
                <button 
                  onClick={() => setAbaProduto('produto')} 
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${abaProduto === 'produto' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  🛍️ Produtos e Estoque
                </button>
              </div>

              <div className={`p-3 rounded-xl text-xs md:text-sm font-medium border shadow-sm ${abaProduto === 'servico' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                {abaProduto === 'servico' 
                  ? 'Cadastre os serviços oferecidos. O tempo de duração será usado para desenhar a Linha do Tempo e prever atrasos.' 
                  : 'Cadastre os produtos vendidos no balcão. Produtos não possuem tempo de duração e não afetam a fila de espera.'}
              </div>
              
              <form onSubmit={adicionarServico} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                 <div className="flex-1 min-w-[200px]">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                     {abaProduto === 'servico' ? 'Nome do Serviço' : 'Nome do Produto'}
                   </label>
                   <input type="text" required placeholder={abaProduto === 'servico' ? "Ex: Corte Feminino" : "Ex: Kit Shampoo"} value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                 </div>
                 <div className="w-24">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Preço (R$)</label>
                   <input type="number" step="0.01" required placeholder="150.00" value={novoServico.preco} onChange={e => setNovoServico({...novoServico, preco: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                 </div>
                 
                 {abaProduto === 'servico' && (
                   <div className="w-28 animate-fade-in">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duração (Min)</label>
                     <input type="number" required placeholder="60" value={novoServico.duracao} onChange={e => setNovoServico({...novoServico, duracao: e.target.value})} className="w-full border-2 border-gray-100 rounded-lg p-2 text-sm bg-gray-50 focus:border-teal-500 outline-none"/>
                   </div>
                 )}

                <div className="flex gap-2">
                   {novoServico.id && (
                     <button type="button" onClick={cancelarEdicaoServico} className="font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm bg-gray-200 hover:bg-gray-300 text-gray-700 h-[38px] whitespace-nowrap">
                       Cancelar
                     </button>
                   )}
                   <button type="submit" disabled={salvando === 'novo_servico'} className={`font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 h-[38px] whitespace-nowrap text-white ${abaProduto === 'servico' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                     {novoServico.id ? '💾 Salvar' : '+ Adicionar'}
                   </button>
                 </div>
              </form>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="p-3 font-bold">{abaProduto === 'servico' ? 'Serviço' : 'Produto'}</th>
                      <th className="p-3 font-bold">Preço Base</th>
                      {abaProduto === 'servico' && <th className="p-3 font-bold">Duração Estimada</th>}
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                     {(abaProduto === 'servico' ? listaServicos : listaProdutos).length === 0 ? (
                       <tr><td colSpan="4" className="p-4 text-center text-gray-400">Nenhum item cadastrado nesta categoria.</td></tr>
                     ) : (abaProduto === 'servico' ? listaServicos : listaProdutos).map(s => (
                       <tr key={s.id} className="hover:bg-gray-50">
                         <td className="p-3 font-medium text-gray-800">{s.nome}</td>
                         <td className="p-3 font-bold text-teal-600">R$ {Number(s.preco).toFixed(2)}</td>
                         {abaProduto === 'servico' && <td className="p-3 text-gray-500">{s.duracao} minutos</td>}
                         <td className="p-3 text-center flex justify-center gap-2">
                           <button onClick={() => prepararEdicaoServico(s)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 w-8 h-8 rounded-lg font-bold transition-colors" title="Editar Preço">✏️</button>
                           <button onClick={() => deletarServico(s.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 w-8 h-8 rounded-lg font-bold transition-colors" title="Apagar">X</button>
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === 'comissoes' && (
            <div className="space-y-4">
              <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-xs md:text-sm font-medium border border-orange-200 shadow-sm">
                Defina a comissão padrão de cada profissional, e adicione exceções para serviços específicos (Ex: Ganha 50% em tudo, mas 40% na Progressiva).
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipeAtiva.map(c => {
                  const regrasDoColab = comissoesEsp.filter(regra => regra.prof === c.nome);
                  const formRegra = novaRegra[c.id] || { servico_id: '', percentual: '' };

                  return (
                    <div key={c.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                        <span className="font-black text-gray-800 text-lg">{c.nome}</span>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comissão Padrão (Geral) %</label>
                        <div className="flex gap-2">
                          <input type="number" value={c.percentual_comissao || 0} onChange={(e) => handleChange(c.id, 'percentual_comissao', e.target.value)} className="w-full border-2 border-gray-100 rounded-lg p-2 text-base font-bold bg-gray-50 focus:border-teal-500 outline-none" />
                          <button onClick={() => salvarComissaoPadrao(c)} disabled={salvando === c.id} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors whitespace-nowrap shadow-sm disabled:opacity-50">
                            Salvar Padrão
                          </button>
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                         <h4 className="text-[10px] font-bold text-orange-800 uppercase mb-3 border-b border-orange-200 pb-1 flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                           Regras Específicas
                         </h4>
                         
                         {regrasDoColab.length > 0 && (
                           <ul className="mb-3 space-y-1.5">
                             {regrasDoColab.map(r => (
                               <li key={r.id} className="flex justify-between items-center text-xs bg-white px-2.5 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                                 <span className="font-bold text-gray-700 truncate mr-2">{r.serv}</span>
                                 <div className="flex items-center gap-2">
                                   <span className="font-black text-orange-600 bg-orange-100 px-2 rounded-md">{r.percentual}%</span>
                                   <button onClick={() => deletarRegraEspecifica(r.id)} className="text-red-400 hover:text-red-600 font-bold px-1.5 text-sm" title="Remover Regra">X</button>
                                 </div>
                               </li>
                             ))}
                           </ul>
                         )}

                         <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <select value={formRegra.servico_id} onChange={e => handleRegra(c.id, 'servico_id', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:border-orange-400 outline-none shadow-sm font-medium text-gray-700">
                                <option value="">Escolher item...</option>
                                <optgroup label="💆‍♀️ Serviços de Cadeira">
                                  {listaServicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                </optgroup>
                                <optgroup label="🛍️ Produtos de Prateleira">
                                  {listaProdutos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </optgroup>
                              </select>
                            </div>
                            <div className="w-16">
                              <input type="number" placeholder="%" value={formRegra.percentual} onChange={e => handleRegra(c.id, 'percentual', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold text-center bg-white focus:border-orange-400 outline-none shadow-sm" />
                            </div>
                            <button onClick={() => adicionarRegraEspecifica(c.id)} disabled={salvando === 'regra_'+c.id} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 h-[34px]">
                              + Regra
                            </button>
                         </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {aba === 'assinatura' && (
            <div className="space-y-4">
              
              <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-6 rounded-2xl text-white shadow-sm border border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Licença GestãoGold</p>
                  <h2 className="text-2xl font-black flex flex-col md:flex-row items-center gap-2">
                    Plano Profissional <span className="bg-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-1 md:mt-0">Ativo</span>
                  </h2>
                  <p className="text-xs text-indigo-200 mt-2 md:mt-1">Válida até 10/08/2026.</p>
                </div>
                <div className="bg-white/10 px-6 py-4 rounded-xl border border-white/10 text-center w-full md:w-auto min-w-[200px]">
                   <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Mensalidade</p>
                   <p className="text-2xl font-black">R$ 47,00<span className="text-sm font-normal opacity-70">/mês</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                      <span className="text-lg">💸</span>
                      <h4 className="font-bold text-gray-700 uppercase text-sm">Pagamento via PIX</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Realize o pagamento via PIX para a <strong>GestãoGold</strong>:</p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Chave PIX</p>
                      <p className="text-sm md:text-base font-black text-gray-800 select-all" title="Copiar PIX">pagamentos@gestaogold.com.br</p>
                    </div>
                  </div>
                  <button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md">
                    Copiar Chave PIX
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                      <span className="text-lg">🤝</span>
                      <h4 className="font-bold text-gray-700 uppercase text-sm">Suporte GestãoGold</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      O sistema GestãoGold foi criado para facilitar o seu dia a dia. Precisa de ajuda, quer treinar a sua equipa ou sugerir uma novidade?
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 mt-auto">
                    <a href="https://wa.me/5515999999999" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-xs md:text-sm shadow-sm transition-colors">
                      💬 Falar no WhatsApp
                    </a>
                    <a href="https://instagram.com/gestaogold" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-bold py-3 rounded-xl text-xs md:text-sm shadow-sm transition-colors">
                      📸 Acompanhar no Instagram
                    </a>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
        
        {confirmacao.aberto && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 rounded-3xl animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up border border-gray-100">
              <div className="bg-red-500 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-red-600 opacity-20 transform -skew-y-12 scale-150 origin-top-left"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 text-3xl shadow-lg relative z-10">⚠️</div>
                <h3 className="text-xl font-black text-white relative z-10">{confirmacao.titulo}</h3>
              </div>
              <div className="p-6 text-center text-gray-600 font-medium text-sm">
                <p>{confirmacao.mensagem}</p>
              </div>
              <div className="p-5 bg-gray-50 flex gap-3 border-t border-gray-100">
                <button onClick={() => setConfirmacao({ ...confirmacao, aberto: false })} className="flex-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm transition-colors">Cancelar</button>
                <button onClick={() => { confirmacao.onConfirm(); setConfirmacao({ ...confirmacao, aberto: false }); }} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}