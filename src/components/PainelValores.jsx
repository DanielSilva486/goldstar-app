import React from 'react';

export default function PainelValores({ valores }) {
  const bruto = Number(valores?.faturamento_bruto || 0);
  const comissoes = Number(valores?.total_comissoes || 0);
  
  // AQUI: Agora ele puxa o valor real do banco de dados!
  const despesas = Number(valores?.total_despesas || 0); 
  
  const atendimentos = Number(valores?.total_atendimentos || 0);
  const liquido = bruto - comissoes - despesas;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calcula o tamanho das barrinhas coloridas
  const pctLiquido = bruto > 0 ? (liquido / bruto) * 100 : 0;
  const pctDespesas = bruto > 0 ? (despesas / bruto) * 100 : 0;
  const pctComissoes = bruto > 0 ? (comissoes / bruto) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
      <div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">{formatarMoeda(bruto)}</h2>
        <p className="text-gray-400 text-sm font-medium mt-1">Faturamento Bruto (Mês)</p>
      </div>

      <div className="flex w-full h-3 rounded-full overflow-hidden gap-1 bg-gray-100">
        <div style={{ width: `${Math.max(pctLiquido, 0)}%` }} className="bg-teal-500 h-full rounded-full transition-all duration-500"></div>
        <div style={{ width: `${pctDespesas}%` }} className="bg-red-400 h-full rounded-full transition-all duration-500"></div>
        <div style={{ width: `${pctComissoes}%` }} className="bg-orange-400 h-full rounded-full transition-all duration-500"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-50 rounded-2xl p-3 flex gap-3 items-center border border-teal-100/50">
          <div className="w-1.5 h-10 bg-teal-500 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Saldo Líquido</p>
            <p className="text-sm font-black text-gray-800">{formatarMoeda(liquido)}</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-2xl p-3 flex gap-3 items-center border border-red-100/50">
          <div className="w-1.5 h-10 bg-red-400 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Despesas</p>
            <p className="text-sm font-black text-gray-800">{formatarMoeda(despesas)}</p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl p-3 flex gap-3 items-center border border-orange-100/50">
          <div className="w-1.5 h-10 bg-orange-400 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Comissões</p>
            <p className="text-sm font-black text-gray-800">{formatarMoeda(comissoes)}</p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-2xl p-3 flex gap-3 items-center border border-purple-100/50">
          <div className="w-1.5 h-10 bg-purple-400 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Atendimentos</p>
            <p className="text-sm font-black text-gray-800">{atendimentos}</p>
          </div>
        </div>
      </div>
    </div>
  );
}