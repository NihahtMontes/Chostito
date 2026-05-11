import { useState } from 'react'
import { dashboardApi } from '../../api/dashboard'

export default function AdminEscanearQR() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleScan = async () => {
    if (!codigo.trim()) return
    setLoading(true); setError(''); setResult(null)
    try { const r = await dashboardApi.escanearQR(codigo.trim()); setResult(r) }
    catch (e) { setError(e.response?.data?.message || 'Error al validar') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-text mb-6">Escanear entrada</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <label className="block text-sm font-semibold text-text mb-2">Código QR</label>
        <div className="flex gap-2">
          <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Pega el código QR aquí" className="flex-1 px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
          <button onClick={handleScan} disabled={loading} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50 transition-all">{loading ? '...' : 'Validar'}</button>
        </div>
      </div>

      {error && <div className="bg-error-light text-error rounded-2xl p-5 text-center mb-4"><p className="font-bold text-lg">Entrada inválida</p><p className="text-sm mt-1">{error}</p></div>}

      {result && (
        <div className="bg-success-light rounded-2xl p-6 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h2 className="text-xl font-extrabold text-text mb-4">Entrada válida</h2>
          <div className="bg-white/60 rounded-xl p-4 text-left space-y-2">
            {[{ l: 'Tipo', v: result.tipo }, { l: 'Evento', v: result.evento }, { l: 'Comprador', v: result.comprador }, { l: 'Email', v: result.emailComprador }, { l: 'Transacción', v: result.codigoTransaccion }, { l: 'Fecha', v: result.fecha ? new Date(result.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }) : '-' }].map((r, i) => (
              <div key={i} className="flex justify-between text-sm"><span className="text-text-light">{r.l}</span><span className="font-bold text-text">{r.v}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
