import React, { useEffect, useState } from 'react';

export default function LinhaDoTempo({ comandas }) {
  const [horaAtual, setHoraAtual] = useState(new Date());

  // Atualiza a linha vermelha a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const horasGrade = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  // Defina aqui quem NÃO deve aparecer na linha do tempo (pelo nome exato)
  const profissionaisBloqueados = ['Caixa', 'Admin', 'Raquel Patroa', 'Taticaixa']; 

  const agendaPorProfissional = comandas.reduce((acc, item) => {
    // 🚀 O NOVO FILTRO INTELIGENTE: Verifica se é produto ou se tem duração 0
    const ehProduto = item.servico_tipo === 'produto' || item.duracao === 0 || item.duracao === null;
    
    // Só entra na agenda se NÃO estiver bloqueado E NÃO for um produto
    if (!profissionaisBloqueados.includes(item.profissional) && !ehProduto) {
        if (!acc[item.profissional]) acc[item.profissional] = [];
        acc[item.profissional].push(item);
    }
    return acc;
  }, {});

  // MATEMÁTICA CORRIGIDA: Exatamente 12 horas (720 minutos)
  const horaInicioDia = 8;
  const horasTotaisDia = 12; // Das 8h às 20h
  const totalMinutosDia = horasTotaisDia * 60; // 720 minutos

  // Função Universal (Aplica-se à linha vermelha e aos blocos!)
  const calcularPorcentagem = (minutos) => {
    return Math.max(0, Math.min(100, (minutos / totalMinutosDia) * 100));
  };

  const calcularPosicaoEWidth = (horaInicioBase, duracao) => {
    const inicio = new Date(horaInicioBase);
    const minutosDesdeInicio = (inicio.getHours() - horaInicioDia) * 60 + inicio.getMinutes();
    const duracaoReal = duracao || 30;

    return {
      left: `${calcularPorcentagem(minutosDesdeInicio)}%`,
      width: `${calcularPorcentagem(duracaoReal)}%`
    };
  };

  // Posição da Linha Vermelha usando a HORA LOCAL e a mesma fórmula
  const minutosAtuaisDesdeInicio = (horaAtual.getHours() - horaInicioDia) * 60 + horaAtual.getMinutes();
  const linhaVermelhaLeft = `${calcularPorcentagem(minutosAtuaisDesdeInicio)}%`;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden">
      <h3 className="font-black text-gray-800 text-lg mb-6 tracking-tight">Visual da Agenda (Sincronizado)</h3>
      
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        {/* 🚀 O NOVO LAYOUT À PROVA DE FALHAS */}
        <div className="min-w-[800px] flex relative pt-8">
          
          {/* 1. COLUNA ESQUERDA FIXA: Nomes das Profissionais */}
          <div className="w-32 shrink-0 border-r border-gray-200 z-20 bg-white">
            {Object.entries(agendaPorProfissional).map(([profissional, itens]) => (
              <div key={profissional} className="h-20 pr-4 flex items-center justify-end border-b border-gray-100 relative">
                <span className="font-bold text-gray-700 text-xs text-right leading-tight">{profissional}</span>
              </div>
            ))}
            {Object.keys(agendaPorProfissional).length === 0 && (
              <div className="h-20 flex items-center justify-end pr-4 text-xs font-bold text-gray-400">Vazio</div>
            )}
          </div>

          {/* 2. ÁREA DA TIMELINE: Fundo, Linha e Blocos ocupam EXATAMENTE o mesmo espaço */}
          <div className="flex-1 relative">
            
            {/* GRADE DE FUNDO (Horas e marcações verticais precisas) */}
            <div className="absolute inset-0 pointer-events-none">
              {horasGrade.map(hora => {
                const posicaoGrid = ((hora - horaInicioDia) / horasTotaisDia) * 100;
                return (
                  <div key={hora} className="absolute top-0 bottom-0 border-l border-dashed border-gray-200" style={{ left: `${posicaoGrid}%` }}>
                    <span className="absolute -top-6 -left-3 text-[10px] font-bold text-gray-400">
                      {hora.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                );
              })}
            </div>

            {/* A LINHA VERMELHA PERFEITA (Dentro da área útil) */}
            {horaAtual.getHours() >= horaInicioDia && horaAtual.getHours() <= 20 && (
              <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ left: linhaVermelhaLeft }}>
                 <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            )}

            {/* AS PISTAS (Linhas com os blocos das clientes) */}
            {Object.entries(agendaPorProfissional).map(([profissional, itens]) => {
              
              let ultimaHoraOcupada = new Date(); // Base para a Cascata
              
              const blocos = itens.map(item => {
                const estaRodando = item.status_fila === 'em_atendimento';
                let inicioReal;

                if (estaRodando && item.hora_inicio) {
                  inicioReal = new Date(item.hora_inicio);
                  const fimPrevisto = new Date(inicioReal.getTime() + (item.duracao || 30) * 60000);
                  if (fimPrevisto > ultimaHoraOcupada) ultimaHoraOcupada = fimPrevisto;
                } else {
                  inicioReal = new Date(ultimaHoraOcupada);
                  ultimaHoraOcupada = new Date(inicioReal.getTime() + (item.duracao || 30) * 60000);
                }

                const { left, width } = calcularPosicaoEWidth(inicioReal, item.duracao);

                return (
                  <div key={item.id} className={`absolute top-3 bottom-3 rounded-xl border flex flex-col justify-center px-3 overflow-hidden shadow-sm transition-all ${estaRodando ? 'bg-teal-100 border-teal-300 z-10' : 'bg-gray-100 border-gray-300 opacity-80'}`} style={{ left, width, minWidth: '40px' }}>
                    <span className={`text-[11px] font-black truncate leading-tight ${estaRodando ? 'text-teal-900' : 'text-gray-600'}`}>{item.cliente_nome.split(' ')[0]}</span>
                    <span className={`text-[9px] font-bold truncate ${estaRodando ? 'text-teal-700' : 'text-gray-500'}`}>{item.servico}</span>
                  </div>
                );
              });

              return (
                <div key={profissional} className="h-20 relative border-b border-gray-100 last:border-0 hover:bg-gray-50/30 transition-colors">
                  {blocos}
                </div>
              );
            })}
            
            {Object.keys(agendaPorProfissional).length === 0 && (
              <div className="h-20 border-b border-gray-100"></div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}