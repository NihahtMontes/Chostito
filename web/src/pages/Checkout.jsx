import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { reservasApi } from '../api/reservas'
import { pagosApi } from '../api/pagos'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { items = [], evento, selectedAsientos = [], vipPrice = 0 } = location.state || {}
  const [step, setStep] = useState('resumen')
  const [reserva, setReserva] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!items?.length && !selectedAsientos?.length) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-light">
      <p className="text-xl font-700">No hay items para comprar</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-4 px-6 py-2.5 text-sm">Explorar eventos</button>
    </div>
  )

  const totalNormal = items.filter(i => i.tipo !== 'VIP').reduce((s, i) => s + i.precio * i.cantidad, 0)
  const totalVip = selectedAsientos.length * vipPrice
  const total = totalNormal + totalVip
  const totalItems = items.filter(i => i.tipo !== 'VIP').reduce((s, i) => s + i.cantidad, 0) + selectedAsientos.length

  const handleCrearReserva = async () => {
    setLoading(true); setError('')
    try {
      const nonVip = items.filter(i => i.tipo !== 'VIP').map(({ idEvento, tipo, cantidad }) => ({ idEvento, tipo, cantidad }))
      const payload = { items: nonVip }
      if (selectedAsientos.length) payload.idsEntradas = selectedAsientos
      const res = await reservasApi.crearReserva(payload)
      setReserva(res)
      const qr = await pagosApi.generarQR(res.id)
      setQrData(qr)
      setStep('pago')
    } catch (e) { setError(e.response?.data?.message || 'Error al crear reserva') }
    finally { setLoading(false) }
  }

  const handlePagar = async () => {
    setLoading(true); setError('')
    try {
      await pagosApi.simularPago(reserva.id, 'QR')
      setStep('exito')
    } catch (e) { setError(e.response?.data?.message || 'Error al procesar pago') }
    finally { setLoading(false) }
  }

  if (step === 'exito') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-scale-in">
          {/* Success icon */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-success/40 animate-pulse-glow">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-900 text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>¡Pago exitoso!</h1>
          <p className="text-text-secondary mb-8">Tus entradas han sido confirmadas. ¡Disfruta el evento!</p>

          <div className="card p-6 text-left space-y-3 mb-6">
            {[
              ['Transacción', reserva?.pago?.codigoTransaccion?.substring(0, 14) + '...'],
              ['Evento', evento?.titulo],
              ['Entradas', reserva?.cantidadEntradas],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-text-light">{label}</span>
                <span className="text-sm font-600 text-white">{val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-white/06">
              <span className="text-sm font-700 text-white">Total pagado</span>
              <span className="text-xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {reserva?.total?.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={() => navigate('/mis-reservas')} className="btn-primary w-full py-4 text-base mb-3">
            Ver mis entradas
          </button>
          <button onClick={() => navigate('/')} className="text-sm text-text-light hover:text-text font-600 transition-colors">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  const STEPS = ['resumen', 'pago']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {['Resumen', 'Pago'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-700 transition-all ${
              i <= stepIdx ? 'bg-primary text-white' : 'bg-white/10 text-text-light'
            }`}>{i + 1}</div>
            <span className={`text-sm font-600 ${i <= stepIdx ? 'text-white' : 'text-text-light'}`}>{s}</span>
            {i < 1 && <div className={`flex-1 h-px w-12 transition-all ${stepIdx > i ? 'bg-primary' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="badge badge-primary">🎫 {evento?.titulo}</span>
      </div>

      {/* Items breakdown */}
      <div className="card p-6 mb-4">
        <h2 className="font-800 text-white mb-5">Detalle de entradas</h2>
        <div className="space-y-3">
          {items.filter(i => i.tipo !== 'VIP').map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div>
                  <p className="font-600 text-white text-sm">{item.tipo}</p>
                  <p className="text-xs text-text-light">{item.cantidad} × Bs {item.precio.toFixed(2)}</p>
                </div>
              </div>
              <span className="font-700 text-white">Bs {(item.precio * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
          {selectedAsientos.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-light" />
                <div>
                  <p className="font-600 text-white text-sm">VIP ({selectedAsientos.length} asiento{selectedAsientos.length !== 1 ? 's' : ''})</p>
                  <p className="text-xs text-text-light">{selectedAsientos.length} × Bs {vipPrice.toFixed(2)}</p>
                </div>
              </div>
              <span className="font-700 text-white">Bs {totalVip.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="h-px bg-white/06 my-4" />
        <div className="flex justify-between items-center">
          <span className="font-700 text-white">Total</span>
          <span className="text-2xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {total.toFixed(2)}</span>
        </div>
      </div>

      {/* QR Code (payment step) */}
      {step === 'pago' && qrData && (
        <div className="card p-6 text-center mb-4">
          <h3 className="font-800 text-white mb-4">Código QR de pago</h3>
          <div className="bg-white inline-block p-5 rounded-2xl mb-4 shadow-xl">
            <QRCode value={qrData.qrData} size={180} />
          </div>
          <p className="text-xs text-text-light font-mono mb-2">{qrData.codigoTransaccion}</p>
          <p className="text-3xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {Number(qrData.monto).toFixed(2)}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-error-light/20 border border-error/30 text-error rounded-xl px-4 py-3 text-sm font-600 mb-4 animate-scale-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-light">{totalItems} entrada{totalItems !== 1 ? 's' : ''}</p>
          <p className="text-2xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {total.toFixed(2)}</p>
        </div>
        <button
          onClick={step === 'resumen' ? handleCrearReserva : handlePagar}
          disabled={loading}
          className="btn-primary flex items-center gap-2 px-7 py-4 text-base disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            <>
              {step === 'resumen' ? 'Crear reserva' : 'Confirmar pago'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
