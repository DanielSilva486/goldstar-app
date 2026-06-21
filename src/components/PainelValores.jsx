import React from 'react';

export default function PainelValores({ valores }) {
  // Se ainda não carregou, usa zero. Convertendo texto para número.
  const faturamento = Number(valores?.faturamento_bruto || 0);
  const comissoes = Number(valores?.total_comissoes || 0);
  const despesas = 150.00; // Custo fixo provisório simulado
  const saldoLiquido = faturamento - comissoes - despesas;
  const atendimentos = valores?.total_atendimentos || 0;

  // Função automática para formatar em Real (R$)
  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="px-4 pb-8">
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-gray-800">{formatarMoeda(faturamento)}</h2>
        <p className="text-gray-500 text-sm">Faturamento Bruto (Mês)</p>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden mb-6 gap-1">
        <div className="bg-teal-500 w-1/2"></div>
        <div className="bg-red-400 w-1/4"></div>
        <div className="bg-orange-400 w-1/4"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-50 rounded-2xl flex items-center p-1 shadow-sm">
          <div className="bg-teal-500 w-2 h-12 rounded-full mr-3 ml-1"></div>
          <div>
            <p className="text-xs text-gray-500">Saldo Líquido</p>
            <p className="font-bold text-gray-800">{formatarMoeda(saldoLiquido)}</p>
          </div>
        </div>

        <div className="bg-red-50 rounded-2xl flex items-center p-1 shadow-sm">
          <div className="bg-red-400 w-2 h-12 rounded-full mr-3 ml-1"></div>
          <div>
            <p className="text-xs text-gray-500">Despesas</p>
            <p className="font-bold text-gray-800">{formatarMoeda(despesas)}</p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl flex items-center p-1 shadow-sm">
          <div className="bg-orange-400 w-2 h-12 rounded-full mr-3 ml-1"></div>
          <div>
            <p className="text-xs text-gray-500">Comissões</p>
            <p className="font-bold text-gray-800">{formatarMoeda(comissoes)}</p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-2xl flex items-center p-1 shadow-sm">
          <div className="bg-purple-400 w-2 h-12 rounded-full mr-3 ml-1"></div>
          <div>
            <p className="text-xs text-gray-500">Atendimentos</p>
            <p className="font-bold text-gray-800">{atendimentos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}