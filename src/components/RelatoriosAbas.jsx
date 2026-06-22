import React, { useState, useEffect } from 'react';

export default function RelatoriosAbas({ dados, mes, ano, comandas, recarregarTudo }) {
  // Aba 0 é a nova aba de Fila/Caixa
  const [abaAtiva, setAbaAtiva] = useState(0);

  const historico = dados?.historico || [];
  const comissoesMensais = dados?.comissoes || [];
  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [buscandoFiltro, setBuscandoFiltro] = useState(false);
  const [pagamentosDb, setPagamentosDb] = useState([]);

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const lucroLiquido = faturamentoBruto - totalComissoes - 150.00;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes')
      .then(res => res.json()).then(j => { if(j.sucesso) setPagamentosDb(j.dados); })
      .catch(e => console.error(e));
  }, [mes, ano]);

  const filtrarComissoesPeriodo = async () => {
    if (!dataInicio || !dataFim) return;
    setBuscandoFiltro(true);
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-periodo?inicio=${dataInicio}&fim=${dataFim}`);
      const json = await res.json();
      if (json.sucesso) setComissoesFiltradas(json.dados);
    } catch (e) {}
    setBuscandoFiltro(false);
  };

  const alternarStatusPagamento = async (profissional, chaveUnica) => {
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes/toggle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profissional, chave_periodo: chaveUnica })
      });
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes');
      const j = await res.json();
      if(j.sucesso) setPagamentosDb(j.dados);
    } catch (e) {}
  };

  // --- FUNÇÃO DO NOVO CAIXA ---
  const cobrarComanda = async (itensDaComanda) => {
    const idsParaPagar = itensDaComanda.map(item => item.id);
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/comandas/pagar', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: idsParaPagar })
      });
      recarregarTudo(); // Atualiza a fila e o Faturamento Geral na hora!
    } catch (erro) { alert('Erro ao finalizar cobrança.'); }
  };

  // Agrupar Comandas por Cliente
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
        <BotaoAba id={0} titulo="🛒 Fila / Caixa" destaque={totalClientesNaFila} />
        <BotaoAba id={1} titulo="1. Geral (Mensal)" />
        <BotaoAba id={2} titulo="2. Comissões" />
        <BotaoAba id={3} titulo="3. Top 10" />
        <BotaoAba id={4} titulo="4. DRE" />
      </div>

      {/* --- ABA 0: NOVO CAIXA / GESTÃO DE FILA --- */}
      {abaAtiva === 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden min-h-[400px]">
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Clientes Aguardando Pagamento</h3>
          </div>
          <div className="p-4 space-y-4">
             {totalClientesNaFila === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                 <p>A fila de espera está vazia. 🎉</p>
               </div>
             ) : (
               Object.entries(comandasAgrupadas).map(([nomeCliente, itens]) => {
                 const totalComanda = itens.reduce((soma, item) => soma + Number(item.valor_total), 0);
                 return (
                   <div key={nomeCliente} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                     <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                       <h4 className="font-bold text-gray-800">Cliente: <span className="text-blue-600">{nomeCliente}</span></h4>
                     </div>
                     <div className="p-4">
                       <ul className="space-y-2 mb-4">
                         {itens.map(item => (
                           <li key={item.id} className="flex justify-between text-sm text-gray-600 items-center">
                             <div className="flex flex-col">
                               <span className="font-medium text-gray-800">{item.servico}</span>
                               <span className="text-[10px] text-gray-400">por {item.profissional} <span className="text-orange-500 font-bold">⏱️ {item.duracao || 30}m</span></span>
                             </div>
                             <span className="font-medium">{formatarMoeda(item.valor_total)}</span>
                           </li>
                         ))}
                       </ul>
                       <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-end">
                         <div>
                           <p className="text-xs text-gray-500 font-bold uppercase">Total a Cobrar</p>
                           <p className="text-xl md:text-2xl font-black text-gray-800">{formatarMoeda(totalComanda)}</p>
                         </div>
                         <button onClick={() => cobrarComanda(itens)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-md">
                           Dar Baixa
                         </button>
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      )}

      {/* ABA 1: HISTÓRICO */}
      {abaAtiva === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Histórico</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Serviço</th><th className="p-3 text-right">Valor</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {historico.length === 0 ? <tr><td colSpan="4" className="p-6 text-center text-gray-400">Vazio.</td></tr> : historico.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{item.data}</td><td className="p-3 font-medium text-gray-800">{item.cliente_nome}</td><td className="p-3 text-gray-600">{item.servico}</td><td className="p-3 font-bold text-teal-600 text-right">{formatarMoeda(item.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: COMISSÕES */}
      {abaAtiva === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col gap-3">
            <div><h3 className="font-bold text-orange-800">Repasses Acumulados</h3></div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border rounded-lg p-1.5 text-xs bg-white" /> <span className="text-xs font-bold">até</span> <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border rounded-lg p-1.5 text-xs bg-white" />
              <button onClick={filtrarComissoesPeriodo} className="bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-lg">Filtrar</button>
              {comissoesFiltradas !== null && <button onClick={limparFiltroPeriodo} className="bg-gray-200 text-xs font-bold px-3 py-2 rounded-lg">Limpar</button>}
            </div>
          </div>
          <div className="p-4">
            {(comissoesFiltradas || comissoesMensais).map((prof, index) => {
              const chaveUnica = comissoesFiltradas ? `P_${prof.profissional}_${dataInicio}_${dataFim}` : `M_${prof.profissional}_${mes}_${ano}`;
              const estaPago = pagamentosDb.find(p => p.chave_periodo === chaveUnica);
              return (
                <div key={index} className="flex justify-between items-center mb-4 border-b pb-4 last:border-0 last:pb-0">
                  <div><p className="font-bold text-gray-800">{prof.profissional}</p><p className="text-xs text-gray-500">{prof.qtd_servicos} serviço(s)</p></div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-bold text-orange-600 text-lg">{formatarMoeda(prof.total_comissao)}</p>
                    <button onClick={() => alternarStatusPagamento(prof.profissional, chaveUnica)} className={`text-[10px] px-4 py-1.5 rounded-md font-bold mt-1 shadow-sm ${estaPago ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{estaPago ? 'PAGO ✅' : 'A RECEBER'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: TOP 10 */}
      {abaAtiva === 3 && (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl border p-4"><h3 className="font-bold text-purple-800 mb-3 border-b pb-2">Top 10 Serviços</h3>
            <ul className="text-sm space-y-3">{topServicos.map((s, i) => <li key={i} className="flex justify-between"><span className="text-gray-600"><span className="font-bold mr-2">{i+1}º</span>{s.nome}</span><span className="font-bold">{formatarMoeda(s.gerado)}</span></li>)}</ul>
          </div>
          <div className="bg-white rounded-2xl border p-4"><h3 className="font-bold text-blue-800 mb-3 border-b pb-2">Top 10 Clientes</h3>
            <ul className="text-sm space-y-3">{topClientes.map((c, i) => <li key={i} className="flex justify-between"><span className="text-gray-600"><span className="font-bold mr-2">{i+1}º</span>{c.nome}</span><span className="font-bold">{formatarMoeda(c.gasto)}</span></li>)}</ul>
          </div>
        </div>
      )}

      {/* ABA 4: DRE */}
      {abaAtiva === 4 && (
        <div className="bg-gray-800 rounded-2xl p-5 text-white">
          <h3 className="font-bold text-gray-200 mb-4 border-b border-gray-600 pb-2">DRE</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Total Entradas</span><span className="font-bold text-green-400">+ {formatarMoeda(faturamentoBruto)}</span></div>
            <div className="flex justify-between border-b border-gray-600 pb-3"><span className="text-gray-400">Repasses</span><span className="font-bold text-orange-400">- {formatarMoeda(totalComissoes)}</span></div>
            <div className="flex justify-between pt-2 text-lg"><span className="font-bold">Lucro Líquido</span><span className={lucroLiquido >= 0 ? 'text-teal-300' : 'text-red-400'}>{formatarMoeda(lucroLiquido)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}