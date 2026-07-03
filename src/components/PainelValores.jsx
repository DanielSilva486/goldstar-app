import React, { useState } from 'react';

export default function PainelValores({ valores, comissoes }) {
  const [mostrarValores, setMostrarValores] = useState(false);

  const bruto = Number(valores?.faturamento_bruto || 0);
  const totalComissoes = Number(valores?.total_comissoes || 0);
  const despesas = Number(valores?.total_despesas || 0); 
  const atendimentos = Number(valores?.total_atendimentos || 0);
  
  const liquido = bruto - totalComissoes - despesas;

  // 🚀 A MÁGICA ACONTECE AQUI: Em vez do nome, usamos o perfil 'dono'
  const comissoesDonaArray = comissoes?.filter(c => c.perfil === 'dono') || [];
  const comissaoDona = comissoesDonaArray.reduce((acc, curr) => acc + Number(curr.total_comissao), 0);

  const lucroOperacional = liquido + comissaoDona;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const pctLucro = bruto > 0 ? (lucroOperacional / bruto) * 100 : 0;
  const pctDespesas = bruto > 0 ? (despesas / bruto) * 100 : 0;
  const pctComissoes = bruto > 0 ? ((totalComissoes - comissaoDona) / bruto) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
            {mostrarValores ? formatarMoeda(bruto) : 'R$ *****'}
          </h2>
          <p className="text-gray-400 text-sm font-medium mt-1">Faturamento Bruto (Mês)</p>
        </div>
        
        <button onClick={() => setMostrarValores(!mostrarValores)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-teal-600 transition-colors shadow-sm border border-gray-100" title={mostrarValores ? "Ocultar valores" : "Mostrar valores"}>
          {mostrarValores ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          )}
        </button>
      </div>

      <div className="flex w-full h-3 rounded-full overflow-hidden gap-1 bg-gray-100">
        <div style={{ width: `${Math.max(pctLucro, 0)}%` }} className="bg-teal-500 h-full rounded-full transition-all duration-500"></div>
        <div style={{ width: `${pctDespesas}%` }} className="bg-red-400 h-full rounded-full transition-all duration-500"></div>
        <div style={{ width: `${pctComissoes}%` }} className="bg-orange-400 h-full rounded-full transition-all duration-500"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-50 rounded-2xl p-3 flex gap-3 items-center border border-teal-100/50">
          <div className="w-1.5 h-10 bg-teal-500 rounded-full"></div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Lucro Operacional</p>
            <p className="text-sm font-black text-gray-800">{mostrarValores ? formatarMoeda(lucroOperacional) : 'R$ *****'}</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 flex gap-3 items-center border border-red-100/50">
          <div className="w-1.5 h-10 bg-red-400 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Despesas</p>
            <p className="text-sm font-black text-gray-800">{mostrarValores ? formatarMoeda(despesas) : 'R$ *****'}</p>
          </div>
        </div>
        <div className="bg-orange-50 rounded-2xl p-3 flex gap-3 items-center border border-orange-100/50">
          <div className="w-1.5 h-10 bg-orange-400 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Comissões</p>
            <p className="text-sm font-black text-gray-800">{mostrarValores ? formatarMoeda(totalComissoes) : 'R$ *****'}</p>
          </div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-3 flex gap-3 items-center border border-purple-100/50">
          <div className="w-1.5 h-10 bg-purple-400 rounded-full"></div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase font-bold">Atendimentos</p>
            <p className="text-sm font-black text-gray-800">{mostrarValores ? atendimentos : '***'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}