import React, { useState, useEffect } from 'react';

export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo, usuario }) {
  const isAdmin = usuario?.perfil === 'admin';
  const isCaixa = usuario?.perfil === 'caixa';
  const isProfissional = usuario?.perfil === 'profissional';
  const podeVerCaixa = isAdmin || isCaixa;

  const [abaAtiva, setAbaAtiva] = useState(podeVerCaixa ? 0 : 1);
  const historicoGeral = dados?.historico || [];
  const historico = isProfissional ? historicoGeral.filter(h => h.profissional === usuario.nome) : historicoGeral;
  const comissoesGerais = dados?.comissoes || [];
  const comissoesMensais = isProfissional ? comissoesGerais.filter(c => c.profissional === usuario.nome) : comissoesGerais;
  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [pagamentosDb, setPagamentosDb] = useState([]);
  const [despesas, setDespesas] = useState([]);

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = Number(valores.total_despesas || 0); 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;
  const comissaoDona = Number(comissoesGerais.find(c => c.profissional.toLowerCase().includes('raquel'))?.total_comissao || 0);
  const lucroOperacional = lucroLiquido + comissaoDona;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes')
      .then(r => r.json()).then(j => { if(j.sucesso) setPagamentosDb(j.dados); });
    if (isAdmin) {
      fetch(`https://goldstar-backend-9m2p.onrender.com/api/despesas?mes=${mes}&ano=${ano}`)
        .then(r => r.json()).then(j => { if(j.sucesso) setDespesas(j.dados); });
    }
  }, [mes, ano, isAdmin]);

  const comandasAgrupadas = comandas.reduce((grupos, item) => {
    if (!grupos[item.cliente_nome]) grupos[item.cliente_nome] = [];
    grupos[item.cliente_nome].push(item);
    return grupos;
  }, {});
  const totalClientesNaFila = Object.keys(comandasAgrupadas).length;

  const BotaoAba = ({ id, titulo, destaque }) => (
    <button onClick={() => setAbaAtiva(id)} className={`relative whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === id ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
      {titulo}
      {destaque > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">{destaque}</span>}
    </button>
  );

  return (
    <div className="mt-2 px-4 pb-24">
      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide pt-2">
        {podeVerCaixa && <BotaoAba id={0} titulo="🛒 Fila" destaque={totalClientesNaFila} />}
        <BotaoAba id={1} titulo="1. Histórico" />
        <BotaoAba id={2} titulo="2. Comissões" />
        {isAdmin && <><BotaoAba id={3} titulo="3. Top 10" /><BotaoAba id={4} titulo="4. DRE" /><BotaoAba id={5} titulo="5. Despesas" /></>}
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL SEGURA */}
      {abaAtiva === 0 && podeVerCaixa && (
         <div className="p-4 bg-white rounded-2xl border">Fila de Atendimento...</div>
      )}
      
      {/* Adicione aqui os blocos das abas 1 a 5 da mesma forma... */}
      {abaAtiva === 1 && <div className="p-4 bg-white rounded-2xl border">Histórico...</div>}
      
      {/* ...Restante do código das abas... */}
    </div>
  );
}