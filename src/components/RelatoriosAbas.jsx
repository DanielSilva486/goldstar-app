import React, { useState, useEffect } from 'react';
import ModalNovaDespesa from './ModalNovaDespesa';
import ModalNovoVale from './ModalNovoVale';
import LinhaDoTempo from './LinhaDoTempo';

export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo, usuario }) {
  const isAdmin = usuario?.perfil === 'admin';
  const isCaixa = usuario?.perfil === 'caixa' || usuario?.nome === 'Raquel Patroa'; 
  const isProfissional = usuario?.perfil === 'profissional';
  const podeVerCaixa = isAdmin || isCaixa;

  const [abaAtiva, setAbaAtiva] = useState(podeVerCaixa ? 0 : 1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [pagamentosDb, setPagamentosDb] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [vales, setVales] = useState([]);
  
  const [mostrarNovaDespesa, setMostrarNovaDespesa] = useState(false);
  const [mostrarNovoVale, setMostrarNovoVale] = useState(false);
  const [confirmacao, setConfirmacao] = useState({ aberto: false, titulo: '', mensagem: '', onConfirm: null });

  const pedirConfirmacao = (titulo, mensagem, acao) => setConfirmacao({ aberto: true, titulo, mensagem, onConfirm: acao });

  const nomeLimpoUsuario = String(usuario?.nome || '').trim().toLowerCase();
  const historicoGeral = dados?.historico || [];
  const historico = isProfissional ? historicoGeral.filter(h => String(h.profissional).trim().toLowerCase() === nomeLimpoUsuario) : historicoGeral;
  const comissoesGerais = dados?.comissoes || [];
  const comissoesMensais = isProfissional ? comissoesGerais.filter(c => String(c.profissional).trim().toLowerCase() === nomeLimpoUsuario) : comissoesGerais;
  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = Number(valores.total_despesas || 0); 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;
  const comissaoDona = Number(comissoesGerais.find(c => String(c.profissional).toLowerCase().includes('raquel'))?.total_comissao || 0);
  const lucroOperacional = lucroLiquido + comissaoDona;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarTempo = (minutosTotal) => {
    const horas = Math.floor(minutosTotal / 60);
    const min = minutosTotal % 60;
    return horas > 0 ? `${horas}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  const carregarDadosExtras = async () => {
    try {
      const resPagamentos = await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes');
      const jsonPagamentos = await resPagamentos.json();
      if(jsonPagamentos.sucesso) setPagamentosDb(jsonPagamentos.dados);
      const resVales = await fetch('https://goldstar-backend-9m2p.onrender.com/api/vales');
      const jsonVales = await resVales.json();
      if(jsonVales.sucesso) setVales(jsonVales.dados);
      if (isAdmin) {
        const resDespesas = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas?mes=${mes}&ano=${ano}`);
        const jsonDespesas = await resDespesas.json();
        if(jsonDespesas.sucesso) setDespesas(jsonDespesas.dados);
      }
      if (podeVerCaixa) {
        const resColab = await fetch('https://goldstar-backend-9m2p.onrender.com/api/colaboradores');
        const jsonColab = await resColab.json();
        if(jsonColab.sucesso) setColaboradores(jsonColab.dados);
      }
    } catch (e) {}
  };

  useEffect(() => { carregarDadosExtras(); }, [mes, ano, isAdmin]);

  const apagarHistorico = (id) => pedirConfirmacao("Apagar Atendimento", "Deseja realmente apagar este serviço do Histórico Geral?", async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comandas/${id}`, { method: 'DELETE' });
      if (res.ok) recarregarTudo();
    } catch(e) {}
  });

  const sinalizarErroAtendimento = (id) => pedirConfirmacao("Sinalizar Erro", "Deseja marcar este atendimento como 'ERRO'?", async () => {
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/atendimentos/${id}/sinalizar-erro`, { method: 'PUT' });
      if (res.ok) recarregarTudo();
    } catch(e) {}
  });

  const comandasAgrupadas = comandas.reduce((grupos, item) => {
    if (!grupos[item.cliente_nome]) grupos[item.cliente_nome] = [];
    grupos[item.cliente_nome].push(item);
    return grupos;
  }, {});
  const totalClientesNaFila = Object.keys(comandasAgrupadas).length;
  const filaPorProfissional = comandas.reduce((acc, item) => {
    if (!acc[item.profissional]) acc[item.profissional] = 0;
    acc[item.profissional] += (item.duracao || 30);
    return acc;
  }, {});

  const BotaoAba = ({ id, titulo, destaque }) => (
    <button onClick={() => setAbaAtiva(id)} className={`relative whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === id ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {titulo}
      {destaque > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{destaque}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-24 pt-4">
      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide pt-2">
        {podeVerCaixa && <BotaoAba id={0} titulo="🛒 Fila / Caixa" destaque={totalClientesNaFila} />}
        <BotaoAba id={1} titulo={isProfissional ? "1. Meus Serviços" : "1. Histórico Geral"} />
        <BotaoAba id={2} titulo={isProfissional ? "2. Minha Comissão" : "2. Comissões da Equipe"} />
        {podeVerCaixa && <BotaoAba id={3} titulo="3. Visual da Agenda" />}
        {isAdmin && <> <BotaoAba id={4} titulo="4. Top 10" /> <BotaoAba id={5} titulo="5. DRE (Finanças)" /> <BotaoAba id={6} titulo="6. Despesas" /> </>}
      </div>

      {abaAtiva === 0 && podeVerCaixa && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 bg-gray-50 pt-2 pb-2">
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 overflow-x-auto scrollbar-hide items-center">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-2">Disponibilidade:</span>
               {colaboradores.map(c => {
                  const tempo = filaPorProfissional[c.nome] || 0;
                  const livre = tempo === 0;
                  return (
                    <div key={c.id} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${livre ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                       <div className={`w-2 h-2 rounded-full ${livre ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                       <div>
                         <p className="text-xs font-bold text-gray-700">{c.nome}</p>
                         <p className={`text-[10px] font-bold ${livre ? 'text-green-600' : 'text-orange-600'}`}>{livre ? 'Livre agora' : `Fila: ${formatarTempo(tempo)}`}</p>
                       </div>
                    </div>
                  )
               })}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
             {/* O conteúdo da fila vai aqui */}
          </div>
        </div>
      )}

      {abaAtiva === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Serviço</th>{!isProfissional && <th className="p-3">Profissional</th>}<th className="p-3 text-right">Valor</th><th className="p-3 text-center">Ações</th></tr>
            </thead>
            <tbody>
              {historico.map(item => {
                const temErro = item.cliente_nome.includes('⚠️ ERRO');
                return (
                  <tr key={item.id} className={temErro ? 'bg-red-50' : ''}>
                    <td className="p-3">{item.data}</td>
                    <td className="p-3">{item.cliente_nome}</td>
                    <td className="p-3">{item.servico}</td>
                    {!isProfissional && <td className="p-3">{item.profissional}</td>}
                    <td className="p-3 text-right">{formatarMoeda(item.valor_total)}</td>
                    <td className="p-3 flex gap-2 justify-center">
                       {isCaixa && !temErro && <button onClick={() => sinalizarErroAtendimento(item.id)}>🚩</button>}
                       <button onClick={() => apagarHistorico(item.id)}>🗑️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Adicione aqui as outras abas (2, 3, 4, 5, 6) que você já tinha no arquivo original */}

      {confirmacao.aberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl">
             <h3>{confirmacao.titulo}</h3>
             <p>{confirmacao.mensagem}</p>
             <button onClick={() => setConfirmacao({...confirmacao, aberto: false})}>Cancelar</button>
             <button onClick={() => { confirmacao.onConfirm(); setConfirmacao({...confirmacao, aberto: false}); }}>Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
}