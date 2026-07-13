import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GraficoFaturamento({ corPrimaria }) {
  // Dados de exemplo para testarmos o visual. Depois ligamos ao seu banco de dados!
  const dadosMock = [
    { nome: 'Semana 1', Servicos: 4000, Produtos: 2400 },
    { nome: 'Semana 2', Servicos: 3000, Produtos: 1398 },
    { nome: 'Semana 3', Servicos: 2000, Produtos: 9800 },
    { nome: 'Semana 4', Servicos: 2780, Produtos: 3908 },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-[300px] w-full flex flex-col">
      <h3 className="font-bold text-gray-700 mb-4 text-sm">Resumo de Faturamento</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dadosMock} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Servicos" stackId="a" fill={corPrimaria || "#14b8a6"} radius={[0, 0, 4, 4]} />
            <Bar dataKey="Produtos" stackId="a" fill="#1f2937" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}