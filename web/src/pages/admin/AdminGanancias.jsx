import { useState, useEffect } from 'react'
import { dashboardApi } from '../../api/dashboard'

export default function AdminGanancias() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { dashboardApi.todasGanancias().then(setData).finally(() => setLoading(false)) }, [])

  const total = data.reduce((s, g) => s + (g.totalRecaudado || 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-text mb-6">Ganancias</h1>

      {!loading && data.length > 0 && (
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-center text-white mb-6 shadow-xl">
          <p className="text-sm font-semibold text-white/80">Total global recaudado</p>
          <p className="text-4xl font-black mt-1">Bs {total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> :
        <div className="space-y-3">
          {data.map(d => {
            const pct = d.entradasTotales > 0 ? Math.round((d.entradasVendidas / d.entradasTotales) * 100) : 0
            const barColor = pct > 70 ? 'bg-success' : pct > 30 ? 'bg-warning' : 'bg-error'
            return (
              <div key={d.id} className="card p-5 animate-fade-up">
                <div className="flex justify-between items-start mb-3">
                  <div><p className="font-800 text-white">{d.titulo}</p><p className="text-xs text-text-light">{d.organizador}</p></div>
                  <span className="badge badge-primary">{pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center bg-white/05 rounded-xl p-3">
                  <div><p className="text-xl font-900 text-white">{d.entradasVendidas}</p><p className="text-xs text-text-light">de {d.entradasTotales} vendidas</p></div>
                  <div><p className="text-xl font-900 text-success">Bs {Number(d.totalRecaudado || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p><p className="text-xs text-text-light">recaudado</p></div>
                </div>
              </div>
            )
          })}
        </div>}
    </div>
  )
}
