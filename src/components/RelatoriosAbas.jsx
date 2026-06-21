import React, { useState } from 'react';

export default function RelatoriosAbas({ dados }) {
  const [abaAtiva, setAbaAtiva] = useState(1);

  const historico = dados?.historico || [];
  const comissoesMensais = dados?.comissoes || [];
  const topServicos = dados?.topServicos || [];
  const topClientes = dados?.topClientes || [];
  const valores = dados?.valores || {};

  // Estados: Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [comissoesFiltradas, setComissoesFiltradas] = useState(null);
  const [buscandoFiltro, setBuscandoFiltro] = useState(false);

  // --- NOVO: Estado para controlar os botões de pagamento visualmente ---
  const [statusPagamentos, setStatusPagamentos] = useState({});

  const faturamentoBruto = Number(valores.faturamento_bruto || 0);
  const totalComissoes = Number(valores.total_comissoes || 0);
  const despesasFixas = 150.00; 
  const lucroLiquido = faturamentoBruto - totalComissoes - despesasFixas;

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filtrarComissoesPeriodo = async () => {
    if (!dataInicio || !dataFim) {
      alert("Por favor, escolha a data de início e de fim para análise.");
      return;
    }
    setBuscandoFiltro(true);
    try {
      const res = await fetch(`https://goldstar-backend-9m2p.onrender.com/api/comissoes-periodo?inicio=${dataInicio}&fim=${dataFim}`);
      const json = await res.json();
      if (json.sucesso) setComissoesFiltradas(json.dados);
    } catch (e) {
      console.error(e);
    } finally {
      setBuscandoFiltro(false);
    }
  };

  const limparFiltroPeriodo = () => {
    setDataInicio('');
    setDataFim('');
    setComissoesFiltradas(null);
  };

  const comissoesExibir = comissoesFiltradas !== null ? comissoesFiltradas : comissoesMensais;

  // --- NOVO: Função para alternar entre Pago e A Receber ---
  const alternarStatusPagamento = (nomeProfissional) => {
    setStatusPagamentos(prev => ({
      ...prev,
      [nomeProfissional]: !prev[nomeProfissional]
    }));
  };

  const exportarPlanilha = () => {
    if (historico.length === 0) {
      alert("Não há atendimentos para exportar.");
      return;
    }
    let conteudoCSV = "Data,Cliente,Servico,Profissional,Valor Total (R$),Comissao (R$)\n";
    historico.forEach(item => {
      const clienteLimpo = item.cliente_nome.replace(/,/g, ''); 
      const servicoLimpo = item.servico.replace(/,/g, '');
      const profissionalLimpo = item.profissional ? item.profissional.replace(/,/g, '') : 'Não informado';
      const valorNumerico = Number(item.valor_total).toFixed(2).replace('.', ','); 
      const comissaoNumerica = Number(item.valor_comissao).toFixed(2).replace('.', ',');
      conteudoCSV += `${item.data},${clienteLimpo},${servicoLimpo},${profissionalLimpo},"${valorNumerico}","${comissaoNumerica}"\n`;
    });
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "historico_atendimentos_completo.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const BotaoAba = ({ id, titulo }) => (
    <button
      onClick={() => setAbaAtiva(id)}
      className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
        abaAtiva === id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {titulo}
    </button>
  );

  return (
    <div className="mt-2 px-4 pb-24">
      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
        <BotaoAba id={1} titulo="1. Geral (Mensal)" />
        <BotaoAba id={2} titulo="2. Comissões (Semanal)" />
        <BotaoAba id={3} titulo="3. Top Clientes/Serviços" />
        <BotaoAba id={4} titulo="4. Relatório DRE" />
      </div>

      {abaAtiva === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Histórico de Atendimentos</h3>
            <button onClick={exportarPlanilha} className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1">
              Planilha
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium">Cliente</th>
                  <th className="p-3 font-medium">Serviço</th>
                  <th className="p-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-400">Nenhum atendimento para exibir.</td></tr>
                ) : (
                  historico.map((item) => (
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

      {/* --- ABA 2: COMISSÕES --- */}
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
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border border-orange-200 rounded-lg p-1.5 text-xs outline-none text-gray-700 bg-white font-medium shadow-sm" />
              <span className="text-xs text-orange-700 font-bold">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border border-orange-200 rounded-lg p-1.5 text-xs outline-none text-gray-700 bg-white font-medium shadow-sm" />
              <button onClick={filtrarComissoesPeriodo} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm">
                {buscandoFiltro ? "..." : "Filtrar"}
              </button>
              {comissoesFiltradas !== null && (
                <button onClick={limparFiltroPeriodo} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-2 py-2 rounded-lg transition-colors">Limpar</button>
              )}
            </div>
          </div>

          <div className="p-4">
            {comissoesExibir.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Nenhuma comissão registrada neste período.</p>
            ) : (
              comissoesExibir.map((prof, index) => {
                const estaPago = statusPagamentos[prof.profissional]; // Verifica se está pago
                
                return (
                  <div key={index} className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4 last:border-0 last:mb-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-800 text-base">{prof.profissional}</p>
                      <p className="text-xs text-gray-500">{prof.qtd_servicos} serviço(s) realizado(s)</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-bold text-orange-600 text-lg">{formatarMoeda(prof.total_comissao)}</p>
                      
                      {/* --- BOTÃO ATUALIZADO (VERMELHO/VERDE) --- */}
                      <button 
                        onClick={() => alternarStatusPagamento(prof.profissional)}
                        className={`text-[10px] px-4 py-1.5 rounded-md font-bold transition-colors mt-1 shadow-sm ${
                          estaPago 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {estaPago ? 'PAGO ✅' : 'A RECEBER'}
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
              {topServicos.map((serv, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="text-gray-600"><span className="font-bold mr-2 text-purple-400">{index + 1}º</span>{serv.nome}</span>
                  <span className="font-bold text-gray-800">{formatarMoeda(serv.gerado)} <span className="text-xs text-gray-400 font-normal">({serv.qtd}x)</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-blue-800 mb-3 border-b pb-2">Top Clientes VIP</h3>
            <ul className="text-sm space-y-3">
              {topClientes.map((cliente, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span className="text-gray-600"><span className="font-bold mr-2 text-blue-400">{index + 1}º</span>{cliente.nome}</span>
                  <span className="font-bold text-gray-800">{formatarMoeda(cliente.gasto)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {abaAtiva === 4 && (
        <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-5 text-white">
          <h3 className="font-bold text-gray-200 mb-4 border-b border-gray-600 pb-2">Resumo Financeiro (DRE)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Total Entradas (Serviços)</span><span className="font-bold text-green-400">+ {formatarMoeda(faturamentoBruto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Repasses / Comissões</span><span className="font-bold text-orange-400">- {formatarMoeda(totalComissoes)}</span></div>
            <div className="flex justify-between border-b border-gray-600 pb-3"><span className="text-gray-400">Custos Fixos (Estimativa)</span><span className="font-bold text-red-400">- {formatarMoeda(despesasFixas)}</span></div>
            <div className="flex justify-between pt-2 text-lg"><span className="font-bold text-white">Lucro Líquido</span><span className={`font-bold ${lucroLiquido >= 0 ? 'text-teal-300' : 'text-red-400'}`}>{formatarMoeda(lucroLiquido)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}