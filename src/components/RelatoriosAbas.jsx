import React, { useState, useEffect } from 'react';

// Recebe o mes e ano do App.jsx
export default function RelatoriosAbas({ dados, mes, ano }) {
  const [abaAtiva, setAbaAtiva] = useState(1);

  const historico = dados?.historico || [];
  const comissoesMensais = dados?.comissoes || [];
  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [buscandoFiltro, setBuscandoFiltro] = useState(false);

  // --- O NOVO ESTADO DO BANCO DE DADOS ---
  const [pagamentosDb, setPagamentosDb] = useState([]);

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = 150.00; 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Busca os pagamentos gravados no banco
  const carregarPagamentos = async () => {
    try {
      const res = await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes');
      const json = await res.json();
      if (json.sucesso) setPagamentosDb(json.dados);
    } catch (e) { console.error(e); }
  };

  // Recarrega sempre que mudar de mês
  useEffect(() => { carregarPagamentos(); }, [mes, ano]);

  const filtrarComissoesPeriodo = async () => {
    if (!dataInicio || !dataFim) { alert("Escolha as datas."); return; }
    setBuscandoFiltro(true);
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-periodo?inicio=${dataInicio}&fim=${dataFim}`);
      const json = await res.json();
      if (json.sucesso) setComissoesFiltradas(json.dados);
    } catch (e) { console.error(e); }
    setBuscandoFiltro(false);
  };

  const limparFiltroPeriodo = () => {
    setDataInicio(''); setDataFim(''); setComissoesFiltradas(null);
  };

  const comissoesExibir = comissoesFiltradas !== null ? comissoesFiltradas : comissoesMensais;

  // Envia a ordem de gravar ou apagar do banco
  const alternarStatusPagamento = async (profissional, chaveUnica) => {
    try {
      await fetch('https://goldstar-backend-9m2p.onrender.com/api/pagamentos-comissoes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profissional, chave_periodo: chaveUnica })
      });
      carregarPagamentos(); // Atualiza a tela após salvar
    } catch (e) { alert("Erro ao salvar pagamento."); }
  };

  const exportarPlanilha = () => {
    if (historico.length === 0) { alert("Vazio."); return; }
    let conteudoCSV = "Data,Cliente,Serviço,Profissional,Valor Total (R$),Comissão (R$)\n";
    historico.forEach(item => {
      const c = item.cliente_nome.replace(/,/g, ''); const s = item.servico.replace(/,/g, '');
      const p = item.profissional ? item.profissional.replace(/,/g, '') : '';
      const v = Number(item.valor_total).toFixed(2).replace('.', ','); const com = Number(item.valor_comissao).toFixed(2).replace('.', ',');
      conteudoCSV += `${item.data},${c},${s},${p},"${v}","${com}"\n`;
    });
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = "historico.csv"; link.click();
  };

  return (
    <div className="mt-2 px-4 pb-24">
      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
        <button onClick={() => setAbaAtiva(1)} className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === 1 ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>1. Geral (Mensal)</button>
        <button onClick={() => setAbaAtiva(2)} className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === 2 ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>2. Comissões</button>
        <button onClick={() => setAbaAtiva(3)} className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === 3 ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>3. Top Clientes/Serviços</button>
        <button onClick={() => setAbaAtiva(4)} className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${abaAtiva === 4 ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>4. Relatório DRE</button>
      </div>

      {abaAtiva === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Histórico de Atendimentos</h3>
            <button onClick={exportarPlanilha} className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg">Planilha</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Serviço</th><th className="p-3 text-right">Valor</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-400">Nenhum atendimento.</td></tr>
                ) : (
                  historico.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500">{item.data}</td>
                      <td className="p-3 font-medium text-gray-800">{item.cliente_nome}</td>
                      <td className="p-3 text-gray-600">{item.servico}</td>
                      <td className="p-3 font-bold text-teal-600 text-right">{formatarMoeda(item.valor_total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-orange-800">Repasses Acumulados</h3>
              <p className="text-[10px] text-orange-600 font-medium">
                {comissoesFiltradas !== null ? "📊 Analisando período escolhido" : "📅 Mostrando mês cheio"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border border-orange-200 rounded-lg p-1.5 text-xs outline-none text-gray-700 bg-white" />
              <span className="text-xs text-orange-700 font-bold">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border border-orange-200 rounded-lg p-1.5 text-xs outline-none text-gray-700 bg-white" />
              <button onClick={filtrarComissoesPeriodo} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg">{buscandoFiltro ? "..." : "Filtrar"}</button>
              {comissoesFiltradas !== null && <button onClick={limparFiltroPeriodo} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-2 py-2 rounded-lg">Limpar</button>}
            </div>
          </div>

          <div className="p-4">
            {comissoesExibir.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Nenhuma comissão registrada.</p>
            ) : (
              comissoesExibir.map((prof, index) => {
                
                // MÁGICA AQUI: A chave agora tem o mês e ano amarrados nela!
                const isFiltrado = dataInicio && dataFim && comissoesFiltradas !== null;
                const chaveUnica = isFiltrado 
                  ? `PERIODO_${prof.profissional}_${dataInicio}_${dataFim}` 
                  : `MES_${prof.profissional}_${mes}_${ano}`;

                // Procura se essa chave exata existe no banco
                const pagamentoInfo = pagamentosDb.find(p => p.chave_periodo === chaveUnica);
                const estaPago = !!pagamentoInfo;

                return (
                  <div key={index} className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4 last:border-0 last:mb-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-800 text-base">{prof.profissional}</p>
                      <p className="text-xs text-gray-500">{prof.qtd_servicos} serviço(s) realizado(s)</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-bold text-orange-600 text-lg">{formatarMoeda(prof.total_comissao)}</p>
                      
                      <button 
                        onClick={() => alternarStatusPagamento(prof.profissional, chaveUnica)}
                        className={`text-[10px] px-4 py-1.5 rounded-md font-bold transition-colors mt-1 shadow-sm flex items-center gap-1 ${estaPago ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                      >
                        {estaPago ? (
                          <>
                            PAGO ✅ 
                            <span className="font-normal border-l border-green-400 pl-1 ml-1 text-[9px]">{pagamentoInfo.data_pagto}</span>
                          </>
                        ) : 'A RECEBER'}
                      </button>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {abaAtiva === 3 && (
        <div className="grid gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-purple-800 mb-3 border-b pb-2">Top Serviços (Mais rentáveis)</h3>
            <ul className="text-sm space-y-3">
              {topServicos.map((serv, i) => (
                <li key={i} className="flex justify-between items-center"><span className="text-gray-600"><span className="font-bold mr-2 text-purple-400">{i + 1}º</span>{serv.nome}</span><span className="font-bold text-gray-800">{formatarMoeda(serv.gerado)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {abaAtiva === 4 && (
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-5 text-white">
          <h3 className="font-bold text-gray-200 mb-4 border-b border-gray-600 pb-2">Resumo Financeiro (DRE)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Total Entradas</span><span className="font-bold text-green-400">+ {formatarMoeda(faturamentoBruto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Repasses</span><span className="font-bold text-orange-400">- {formatarMoeda(totalComissoes)}</span></div>
            <div className="flex justify-between pt-2 text-lg border-t border-gray-600"><span className="font-bold text-white">Lucro Líquido</span><span className={`font-bold ${lucroLiquido >= 0 ? 'text-teal-300' : 'text-red-400'}`}>{formatarMoeda(lucroLiquido)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}