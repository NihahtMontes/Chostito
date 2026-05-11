import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { reservasApi } from '../api/reservas'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/Modal'

const TABS = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada']
const EC = {
  Pendiente: 'badge-warning',
  Confirmada: 'badge-success',
  Cancelada: 'badge-error',
}

export default function MisReservas() {
  const { user } = useAuth()
  const [reservas, setReservas] = useState([])
  const [tab, setTab] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [qrModal, setQrModal] = useState(null)
  const [facturaModal, setFacturaModal] = useState(null)
  const [cancelando, setCancelando] = useState(null)
  const facturaRef = useRef()

  useEffect(() => { reservasApi.misReservas().then(setReservas).finally(() => setLoading(false)) }, [])

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return
    try {
      await reservasApi.cancelar(id)
      setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'Cancelada' } : r))
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo cancelar')
    }
  }

  const handleDescargarFactura = async () => {
    if (!facturaRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(facturaRef.current, { scale: 2, backgroundColor: '#1A1A2E' })
      const link = document.createElement('a')
      link.download = `factura-chostito-${facturaModal?.pago?.codigoTransaccion || facturaModal?.id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('No se pudo generar la imagen. Intenta ver la factura completa.')
    }
  }

  const filtered = tab === 'Todas' ? reservas : reservas.filter(r => r.estado === tab)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>Mis Reservas</h1>
        <p className="text-text-secondary mt-1">{reservas.length} reserva{reservas.length !== 1 ? 's' : ''} en total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-700 whitespace-nowrap transition-all duration-300 ${
              tab === t ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-text-secondary hover:text-white border border-white/06'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">🎫</div>
          <p className="text-xl font-700 text-white">Sin reservas</p>
          <p className="text-text-secondary mt-2 mb-6">Tus reservas aparecerán aquí</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">Explorar eventos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => (
            <div key={r.id} className="card p-6 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-4">
                <span className={`badge ${EC[r.estado] || 'badge-primary'}`}>{r.estado}</span>
                <span className="text-xs text-text-light">
                  {new Date(r.fechaReserva).toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>

              {/* Entradas */}
              <div className="space-y-2 mb-4">
                {r.entradas?.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-surface rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-primary text-xs">{e.tipo}</span>
                      <div>
                        <p className="text-sm font-600 text-white">{e.evento}</p>
                        {e.numeroAsiento && (
                          <p className="text-xs font-700 text-primary mt-0.5">Asiento {e.numeroAsiento}</p>
                        )}
                        <p className="text-xs text-text-light">{new Date(e.fechaEvento).toLocaleDateString('es-ES', { day:'numeric', month:'long' })}</p>
                      </div>
                    </div>
                    {r.estado === 'Confirmada' && e.estado === 'Activa' && (
                      <button
                        onClick={() => setQrModal(e)}
                        className="p-2.5 rounded-xl bg-primary/15 hover:bg-primary/25 transition-all group"
                      >
                        <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m4 0v1m-8-1v1m8-4V7m-4 0v1m0 0v1m0 0v1m0 0v1m-4 0v1m0-4v1m0 0v1m0 0v1m0 0v1m4 0v1"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/06">
                <div>
                  <p className="text-xs text-text-light">{r.cantidadEntradas} entrada{r.cantidadEntradas !== 1 ? 's' : ''}</p>
                  <p className="text-2xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {r.total?.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  {r.estado === 'Confirmada' && (
                    <button
                      onClick={() => setFacturaModal(r)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-700 bg-primary/15 text-primary rounded-xl hover:bg-primary/25 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Factura
                    </button>
                  )}
                  {r.estado === 'Pendiente' && (
                    <button
                      onClick={() => handleCancelar(r.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-700 bg-error-light/20 text-error rounded-xl hover:bg-error/20 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      <Modal open={!!qrModal} onClose={() => setQrModal(null)} size="sm">
        {qrModal && (
          <div className="text-center py-2">
            <h3 className="text-xl font-800 text-white mb-5">Tu Entrada</h3>
            <div className="bg-white inline-block p-5 rounded-2xl mb-5">
              <QRCode value={qrModal.codigoQR} size={160} />
            </div>
            <p className="font-700 text-white">{qrModal.evento}</p>
            <p className="text-sm font-700 text-primary mt-1">{qrModal.tipo}</p>
            {qrModal.numeroAsiento && <p className="text-xs text-text-secondary mt-1">Asiento: {qrModal.numeroAsiento}</p>}
            <p className="text-xs text-text-light mt-1">{new Date(qrModal.fechaEvento).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}</p>
          </div>
        )}
      </Modal>

      {/* Factura Modal */}
      <Modal open={!!facturaModal} onClose={() => setFacturaModal(null)}>
        {facturaModal && (
          <div>
            {/* Card captureable */}
            <div ref={facturaRef} className="bg-surface rounded-2xl p-6 border border-white/10">
              <div className="text-center mb-5">
                <p className="text-xs font-700 text-text-light tracking-[4px] uppercase">Factura Electrónica</p>
                <h2 className="text-2xl font-900 gradient-text-primary mt-1" style={{ fontFamily: 'Space Grotesk' }}>Chostito</h2>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  ['Cliente', user?.nombre || user?.email],
                  ['N° Transacción', facturaModal.pago?.codigoTransaccion?.substring(0, 12) || facturaModal.id],
                  ['Fecha', new Date(facturaModal.fechaReserva).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })],
                  ['Estado', facturaModal.estado],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-text-light">{label}</span>
                    <span className={`font-600 ${label === 'Estado' ? 'text-success' : 'text-white'}`}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />
              <p className="text-sm font-700 text-white mb-3">Entradas</p>
              <div className="space-y-2">
                {facturaModal.entradas?.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 bg-surface-alt rounded-xl p-3">
                    <span className="badge badge-primary text-xs">{e.tipo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-600 text-white truncate">{e.evento}</p>
                      {e.numeroAsiento && <p className="text-xs text-text-light">Asiento {e.numeroAsiento}</p>}
                    </div>
                    <span className="text-xs text-text-light">{new Date(e.fechaEvento).toLocaleDateString('es-ES', { month:'short', day:'numeric' })}</span>
                    <span className="text-sm font-800 text-primary">Bs {e.precio?.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-800 text-white">TOTAL</span>
                <span className="text-2xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {facturaModal.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDescargarFactura}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Descargar imagen
              </button>
              <Link to={`/mis-reservas/${facturaModal.id}/factura`} className="flex-1 btn-secondary text-center py-3 text-sm font-600 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                Ver completa
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
