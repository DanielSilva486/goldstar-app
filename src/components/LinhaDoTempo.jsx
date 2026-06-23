import React, { useState, useEffect } from 'react';

export default function LinhaDoTempo({ comandas }) {
  console.log("Comandas recebidas no gráfico:", comandas); // Adicione isto!
  const [horaAtual, setHoraAtual] = useState(new Date());
  // ... resto do código

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!comandas || comandas.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mt-4">
        <p className="text-gray-400 font-medium text-lg">Ainda não há atendimentos registrados hoje. 🍃</p>
      </div>
    );
  }

  const HORA_INICIO = 8;
  const HORA_FIM = 20;
  const TOTAL_MINUTOS = (HORA_FIM - HORA_INICIO) * 60;

  const agendaPorProfissional = {};
  
  comandas.forEach(c => {
    if (!agendaPorProfissional[c.profissional]) {
      agendaPorProfissional[c.profissional] = [];
    }
    
    let dataHora = c.data_hora ? new Date(c.data_hora) : new Date(); 
    const minutosInicio = (dataHora.getHours() - HORA_INICIO) * 60 + dataHora.getMinutes();
    
    // CORREÇÃO: Usa a duração que vem do banco de dados (c.duracao) ou 30 min por segurança
    const duracao = Number(c.duracao) || 30; 
    
    agendaPorProfissional[c.profissional].push({
      id: c.id,
      cliente: c.cliente_nome || 'Cliente',
      servico: c.servico,
      minutosInicio,
      duracao
    });
  });

  const minutosAtuais = (horaAtual.getHours() - HORA_INICIO) * 60 + horaAtual.getMinutes();
  const posicaoLinhaAtual = Math.max(0, Math.min(100, (minutosAtuais / TOTAL_MINUTOS) * 100));
  const horasGrade = Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-x-auto animate-fade-in-up">
      <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-3">
        <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 className="text-lg font-black text-gray-800">Linha do Tempo de Hoje</h3>
      </div>
      
      <div className="min-w-[800px] relative mt-4">
        <div className="flex border-b-2 border-gray-100 pb-2 mb-4 relative ml-24">
          {horasGrade.map(hora => (
            <div key={hora} className="flex-1 text-xs font-black text-gray-400 text-center relative">
              {hora.toString().padStart(2, '0')}:00
              <div className="absolute top-6 left-1/2 w-px h-[400px] bg-gray-50 -translate-x-1/2 -z-10"></div>
            </div>
          ))}
        </div>

        {horaAtual.getHours() >= HORA_INICIO && horaAtual.getHours() <= HORA_FIM && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 flex flex-col items-center transition-all duration-1000"
            style={{ left: `calc(6rem + ${posicaoLinhaAtual}%)` }}
          >
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md -mt-6 shadow-md border border-red-600">
              {horaAtual.getHours().toString().padStart(2, '0')}:{horaAtual.getMinutes().toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {Object.entries(agendaPorProfissional).map(([profissional, atendimentos]) => (
          <div key={profissional} className="flex items-center mb-6 relative">
            <div className="w-24 shrink-0 pr-4 text-right">
              <span className="font-bold text-sm text-gray-700 block truncate">{profissional}</span>
            </div>

            <div className="flex-1 h-14 bg-gray-50/80 rounded-xl relative border border-gray-200 overflow-hidden shadow-inner">
              {atendimentos.map(atend => {
                const leftPercent = Math.max(0, (atend.minutosInicio / TOTAL_MINUTOS) * 100);
                const widthPercent = Math.min(100 - leftPercent, (atend.duracao / TOTAL_MINUTOS) * 100);
                
                if (leftPercent >= 100 || leftPercent + widthPercent <= 0) return null;

                return (
                  <div 
                    key={atend.id}
                    className="absolute top-1 bottom-1 bg-teal-100 border border-teal-300 rounded-lg shadow-sm px-3 py-1 flex flex-col justify-center overflow-hidden hover:bg-teal-200 transition-colors"
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    title={`${atend.cliente} - ${atend.servico}`}
                  >
                    <span className="text-xs font-black text-teal-800 truncate">{atend.cliente}</span>
                    <span className="text-[10px] font-medium text-teal-600 truncate">{atend.servico}</span>
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