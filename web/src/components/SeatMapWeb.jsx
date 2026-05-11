const SEATS_PER_ROW = 8

function groupIntoRows(asientos) {
  const rows = []
  for (let i = 0; i < asientos.length; i += SEATS_PER_ROW) rows.push(asientos.slice(i, i + SEATS_PER_ROW))
  return rows
}

export default function SeatMapWeb({ secciones, selectedIds, onToggle }) {
  if (!secciones?.length) return <p className="text-text-light text-sm text-center py-4">No hay asientos VIP</p>

  return (
    <div className="space-y-6">
      {secciones.map(sec => {
        const rows = groupIntoRows(sec.asientos)
        return (
          <div key={sec.seccion} className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-text text-center mb-3">{sec.seccion}</h3>
            <div className="bg-primary/5 rounded-xl py-2 mb-4 text-center">
              <span className="text-xs font-bold text-primary-light tracking-[4px] uppercase">Escenario</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              {rows.map((row, ri) => (
                <div key={ri} className="flex items-center gap-1">
                  <span className="w-5 text-xs font-bold text-text-light text-center">{String.fromCharCode(65 + ri)}</span>
                  {row.map(asiento => {
                    const taken = asiento.estado === 'Reservada' || asiento.estado === 'Usada'
                    const sel = selectedIds.includes(asiento.id)
                    let cls = 'w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center justify-center transition-all'
                    if (taken) cls += ' bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    else if (sel) cls += ' bg-primary text-white cursor-pointer border-2 border-primary-dark hover:bg-primary-dark'
                    else cls += ' bg-success-light text-success cursor-pointer border border-success hover:bg-success hover:text-white'
                    return (
                      <button key={asiento.id} className={cls} onClick={() => !taken && onToggle(asiento.id)} disabled={taken}>
                        {asiento.numero.split('-').pop()}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
              {[{ color: 'bg-success', label: 'Libre' }, { color: 'bg-primary', label: 'Seleccionado' }, { color: 'bg-gray-300', label: 'Ocupado' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                  <span className="text-xs text-text-light">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
