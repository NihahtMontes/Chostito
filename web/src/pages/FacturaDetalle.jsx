import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { reservasApi } from '../api/reservas'

export default function FacturaDetalle() {
  const { id } = useParams()
  const [reserva, setReserva] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { reservasApi.getById(id).then(setReserva).finally(() => setLoading(false)) }, [id])

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!reserva) return <div className="text-center py-20 text-text-light">Reserva no encontrada</div>

  const handlePrint = () => window.print()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="card p-6 sm:p-8 print:bg-white print:text-black print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-primary font-900 text-xl" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs">CH</span>
            Chostito
          </span>
          <h1 className="text-xl font-900 text-white print:text-black mt-4" style={{ fontFamily: 'Space Grotesk' }}>FACTURA ELECTRÓNICA</h1>
          <p className="text-sm text-text-light print:text-gray-600 mt-1">N° {reserva.pago?.codigoTransaccion?.substring(0, 12) || reserva.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-8 bg-surface-alt print:bg-transparent rounded-xl p-5 print:p-0">
          {[
            { l: 'Fecha', v: new Date(reserva.fechaReserva).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }) },
            { l: 'Estado', v: reserva.estado, c: 'text-success font-700' },
            { l: 'Transacción', v: reserva.pago?.codigoTransaccion?.substring(0, 16) || '-' }
          ].map((r, i) => (
            <div key={i}><span className="text-text-light print:text-gray-500 text-xs">{r.l}</span><p className={`font-700 ${r.c || 'text-white print:text-black'}`}>{r.v}</p></div>
          ))}
        </div>

        <h2 className="font-800 text-white print:text-black mb-4">Entradas</h2>
        <div className="space-y-3 mb-8">
          {reserva.entradas?.map((e, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-alt print:bg-gray-50 rounded-xl p-4 border border-white/06 print:border-gray-200">
              <div className="flex items-center gap-4">
                <span className="badge badge-primary text-xs">{e.tipo}</span>
                <div>
                  <p className="text-sm font-700 text-white print:text-black">{e.evento}</p>
                  <p className="text-xs text-text-light print:text-gray-600">{new Date(e.fechaEvento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                  {e.numeroAsiento && <p className="text-xs text-primary-light mt-0.5">Asiento: {e.numeroAsiento}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <p className="font-800 text-white print:text-black">Bs {e.precio.toFixed(2)}</p>
                {e.codigoQR && <div className="bg-white p-1 rounded-lg"><QRCode value={e.codigoQR} size={50} /></div>}
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/10 print:bg-gray-300 mb-4" />
        <div className="flex justify-between items-center mb-8 px-2">
          <span className="text-lg font-900 text-white print:text-black">TOTAL PAGADO</span>
          <span className="text-3xl font-900 gradient-text-primary print:text-black print:!text-black" style={{ fontFamily: 'Space Grotesk' }}>
            Bs {reserva.total.toFixed(2)}
          </span>
        </div>

        <div className="flex gap-3 print:hidden">
          <button onClick={handlePrint} className="flex-1 btn-primary py-3.5 text-base flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Imprimir / Guardar PDF
          </button>
          <button onClick={() => navigator.clipboard.writeText(`Factura Chostito N°${reserva.pago?.codigoTransaccion} - Total: Bs ${reserva.total.toFixed(2)}`)} className="btn-secondary py-3.5 px-6">
            Copiar Info
          </button>
        </div>
      </div>
    </div>
  )
}
