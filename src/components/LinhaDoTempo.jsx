import React, { useState, useEffect } from 'react';

export default function LinhaDoTempo({ comandas }) {
  const [horaAtual, setHoraAtual] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!comandas || comandas.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mt-4">
        <p className="text-gray-400 font-medium text-lg">Ainda não há atendimentos registados hoje. 🍃</p>
      </div>
    );
  }

  const HORA_INICIO = 8;
  const HORA_FIM = 19; 
  const TOTAL_MINUTOS = (HORA_FIM - HORA_INICIO) * 60;

  const agendaPorProfissional = {};
  
  // 🚀 LÓGICA CORRIGIDA: Agrupa por cliente para somar as durações
  const clientesAgrupados = {};
  comandas.forEach(c => {
    if (!clientesAgrupados[c.cliente_nome]) clientesAgrupados[c.cliente_nome] = [];
    clientesAgrupados[c.cliente_nome].push(c);
  });

  Object.values(clientesAgrupados).forEach(itensDoCliente => {
    let acumuladorMinutos = null; // Vamos calcular o início de cada um

    itensDoCliente.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)).forEach(c => {
      if (!agendaPorProfissional[c.profissional]) agendaPorProfissional[c.profissional] = [];
      
      const dataHora = new Date(c.data_hora);
      const minutosBase = (dataHora.getHours() - HORA_INICIO) * 60 + dataHora.getMinutes();
      
      // Se for o primeiro serviço, começa na hora de chegada. Se for o segundo, começa quando o anterior acaba.
      const minutosInicio = acumuladorMinutos === null ? minutosBase : acumuladorMinutos;
      const duracao = Number(c.duracao) || 30;
      
      agendaPorProfissional[c.profissional].push({
        id: c.id,
        cliente: c.cliente_nome,
        servico: c.servico,
        minutosInicio,
        duracao
      });

      acumuladorMinutos = minutosInicio + duracao; // Prepara o início do próximo serviço
    });
  });

  const minutosAtuais = (horaAtual.getHours() - HORA_INICIO) * 60 + horaAtual.getMinutes();
  const posicaoLinhaAtual = Math.max(0, Math.min(100, (minutosAtuais / TOTAL_MINUTOS) * 100));
  const horasGrade = Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-x-auto animate-fade-in-up">
      <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-3">
        <h3 className="text-lg font-black text-gray-800">Visual da Agenda (Sequencial)</h3>
      </div>
      
      <div className="min-w-[900px] relative mt-4">
        <div className="flex border-b-2 border-gray-100 pb-2 mb-4 relative ml-28">
          {horasGrade.map(hora => (
            <div key={hora} className="flex-1 text-[10px] font-black text-gray-400 text-center relative">
              {hora.toString().padStart(2, '0')}:00
              <div className="absolute top-6 left-1/2 w-px h-[400px] bg-gray-50 -translate-x-1/2 -z-10"></div>
            </div>
          ))}
        </div>

        {/* Linha vermelha de tempo atual */}
        {horaAtual.getHours() >= HORA_INICIO && horaAtual.getHours() < HORA_FIM && (
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: `calc(7rem + ${posicaoLinhaAtual}%)` }} />
        )}

        {Object.entries(agendaPorProfissional).map(([profissional, atendimentos]) => (
          <div key={profissional} className="flex items-center mb-6 relative">
            <div className="w-28 shrink-0 pr-4 text-right">
              <span className="font-bold text-sm text-gray-700 block truncate">{profissional}</span>
            </div>

            <div className="flex-1 h-16 bg-gray-50/80 rounded-xl relative border border-gray-200 overflow-hidden shadow-inner">
              {atendimentos.map(atend => {
                const leftPercent = Math.max(0, (atend.minutosInicio / TOTAL_MINUTOS) * 100);
                const widthPercent = Math.min(100 - leftPercent, (atend.duracao / TOTAL_MINUTOS) * 100);
                
                if (leftPercent >= 100) return null;

                return (
                  <div 
                    key={atend.id}
                    className="absolute top-1.5 bottom-1.5 bg-teal-100 border border-teal-300 rounded-lg shadow-sm px-2 py-1 flex flex-col justify-center overflow-hidden hover:bg-teal-200 transition-colors"
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    title={`${atend.cliente} - ${atend.servico}`}
                  >
                    <span className="text-[11px] font-black text-teal-800 truncate">{atend.cliente}</span>
                    <span className="text-[9px] font-medium text-teal-600 truncate">{atend.servico}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}