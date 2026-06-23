import React from 'react';

export default function LinhaDoTempo({ comandas }) {
  // Blindagem: Se o array de comandas estiver vazio ou indefinido, evita erro
  if (!comandas || comandas.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-400 font-medium">Nenhum atendimento registrado para hoje.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
      <h3 className="text-lg font-black text-gray-800 mb-6">Agenda Visual (Teste)</h3>
      <div className="space-y-4">
        {comandas.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-24 text-xs font-bold text-gray-600 truncate">{c.profissional}</div>
            <div className="flex-1 bg-teal-100 text-teal-800 px-3 py-2 rounded-lg text-xs font-bold">
              {c.cliente_nome} - {c.servico}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}