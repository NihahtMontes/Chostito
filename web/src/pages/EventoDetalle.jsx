import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventosApi } from '../api/eventos'
import { favoritosApi } from '../api/favoritos'
import { useAuth } from '../hooks/useAuth'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5027/api').replace('/api', '')

// ── Seat map component ───────────────────────────────────────────────────────
function SeatMap({ secciones, selectedIds, onToggle }) {
  if (!secciones || secciones.length === 0) return null
  return (
    <div className="space-y-8">
      {/* Stage */}
      <div className="relative">
        <div className="h-10 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-2xl flex items-center justify-center">
          <span className="text-xs font-800 text-primary-light tracking-[6px] uppercase">Escenario</span>
        </div>
        <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {secciones.map((sec, si) => (
        <div key={si}>
          <p className="text-xs font-700 text-text-secondary text-center mb-4 tracking-widest uppercase">{sec.seccion}</p>
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex flex-col gap-2 min-w-full items-center">
              {Array.from({ length: Math.ceil(sec.asientos.length / 8) }).map((_, fi) => {
                const filaSeats = sec.asientos.slice(fi * 8, (fi + 1) * 8)
                return (
                  <div key={fi} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-700 text-text-light text-right flex-shrink-0">
                      {String.fromCharCode(65 + fi)}
                    </span>
                    {filaSeats.map(ast => {
                      const ocupado = ast.estado !== 'Activa'
                      const seleccionado = selectedIds.includes(ast.id)
                      const num = ast.numero.split('-')[1] || ast.numero
                      return (
                        <button
                          key={ast.id}
                          onClick={() => !ocupado && onToggle(ast.id)}
                          disabled={ocupado}
                          className={`seat ${ocupado ? 'seat-occupied' : ''} ${seleccionado && !ocupado ? 'seat-selected' : ''}`}
                          title={ocupado ? 'Ocupado' : `Asiento ${ast.numero}`}
                        >
                          {num}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2">
        {[
          { cls: 'seat', label: 'Disponible' },
          { cls: 'seat seat-selected', label: 'Seleccionado' },
          { cls: 'seat seat-occupied', label: 'Ocupado' },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cls} style={{ cursor: 'default', pointerEvents: 'none', width: 22, height: 22, fontSize: 8 }} />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EventoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [entradas, setEntradas] = useState([])
  const [cantidades, setCantidades] = useState({})
  const [asientos, setAsientos] = useState([])
  const [selectedAsientos, setSelectedAsientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [ev, ent] = await Promise.all([eventosApi.getById(id), eventosApi.getEntradas(id)])
        setEvento(ev)
        setEntradas(ent)
        const init = {}; ent.forEach(e => init[e.tipo] = 0); setCantidades(init)
        if (user) {
          try { const favs = await favoritosApi.getAll(); setIsFav(favs.some(f => f.evento.id === Number(id))) } catch {}
        }
        if (ent.some(e => e.tipo === 'VIP')) {
          try { setAsientos(await eventosApi.getAsientos(id)) } catch {}
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [id])

  const updateC = (tipo, d) => setCantidades(p => {
    const e = entradas.find(en => en.tipo === tipo)
    const max = e ? e.cantidadDisponible : 0
    return { ...p, [tipo]: Math.max(0, Math.min(max, (p[tipo] || 0) + d)) }
  })

  const toggleAsiento = (aid) => setSelectedAsientos(p => p.includes(aid) ? p.filter(a => a !== aid) : [...p, aid])

  const toggleFav = async () => {
    if (!user) return
    setFavLoading(true)
    try {
      if (isFav) { await favoritosApi.eliminar(id); setIsFav(false) }
      else { await favoritosApi.agregar(id); setIsFav(true) }
    } catch {} finally { setFavLoading(false) }
  }

  const vipEntrada = entradas.find(e => e.tipo === 'VIP')
  const totalNormal = entradas.filter(e => e.tipo !== 'VIP').reduce((s, e) => s + (cantidades[e.tipo] || 0), 0)
  const totalItems = totalNormal + selectedAsientos.length
  const total = entradas.reduce((s, e) => {
    if (e.tipo === 'VIP') return s + e.precio * selectedAsientos.length
    return s + e.precio * (cantidades[e.tipo] || 0)
  }, 0)

  const handleComprar = () => {
    if (!user) { navigate('/login'); return }
    const items = entradas.filter(e => e.tipo !== 'VIP' && cantidades[e.tipo] > 0)
      .map(e => ({ idEvento: evento.id, tipo: e.tipo, cantidad: cantidades[e.tipo], precio: e.precio }))
    const currentVipPrice = vipEntrada ? vipEntrada.precio : 0;
    navigate('/checkout', { state: { items, evento, selectedAsientos, vipPrice: currentVipPrice } })
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="skeleton h-64 rounded-3xl mb-8" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  )
  if (!evento) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-light">
      <p className="text-xl font-700">Evento no encontrado</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-4 px-6 py-2.5 text-sm">Volver al inicio</button>
    </div>
  )

  const imgSrc = evento.imagenUrl
    ? (evento.imagenUrl.startsWith('http') ? evento.imagenUrl : `${API_BASE}${evento.imagenUrl}`)
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Hero image */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden mb-8 shadow-2xl">
        {imgSrc ? (
          <img src={imgSrc} alt={evento.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-bg-card to-secondary/10 flex items-center justify-center">
            <svg className="w-24 h-24 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 via-transparent to-transparent" />

        {/* Top controls */}
        <div className="absolute top-5 left-5 right-5 flex justify-between">
          <button onClick={() => navigate(-1)} className="p-2.5 glass rounded-full text-white hover:bg-white/20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {user && (
            <button onClick={toggleFav} disabled={favLoading} className="p-2.5 glass rounded-full hover:bg-white/20 transition-all">
              <svg className={`w-5 h-5 transition-all duration-300 ${isFav ? 'text-red-400 fill-red-400 scale-110' : 'text-white'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom badges */}
        <div className="absolute bottom-5 left-5 flex gap-2">
          <span className="badge badge-primary">{evento.categoria}</span>
          {evento.estado === 'Publicado' && (
            <span className="badge badge-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Disponible
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-900 text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>{evento.titulo}</h1>
            <p className="text-text-secondary italic">{evento.eslogan}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📅', label: 'Fecha', val: new Date(evento.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) },
              { icon: '🕐', label: 'Hora', val: (evento.hora || '').substring(0, 5) + ' hs' },
              { icon: '📍', label: 'Lugar', val: evento.lugar },
              { icon: '🌍', label: 'Ciudad', val: `${evento.ciudad}, ${evento.pais}` },
            ].map(({ icon, label, val }, i) => (
              <div key={i} className="card p-4 hover:border-primary/20">
                <span className="text-xl">{icon}</span>
                <p className="text-xs text-text-light mt-2">{label}</p>
                <p className="text-sm font-700 text-white mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-800 text-white mb-3">Acerca del evento</h2>
            <p className="text-text-secondary leading-relaxed">{evento.descripcion}</p>
          </div>

          {/* Map */}
          <div>
            <h2 className="text-xl font-800 text-white mb-3">Ubicación</h2>
            <div className="card overflow-hidden h-64 sm:h-80 relative">
              <iframe
                title="Mapa de ubicación"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_MAPS_API_KEY || ''}&q=${encodeURIComponent(`${evento.lugar}, ${evento.ciudad}, ${evento.pais}`)}`}
                className="absolute inset-0 grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              />
              {!import.meta.env.VITE_MAPS_API_KEY && (
                <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <svg className="w-12 h-12 text-primary mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-white font-700">Ver en Google Maps</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${evento.lugar}, ${evento.ciudad}, ${evento.pais}`)}`} target="_blank" rel="noreferrer" className="btn-secondary mt-3 py-2 px-4 text-sm">Abrir mapa</a>
                </div>
              )}
            </div>
          </div>

          {/* Seat map (VIP) */}
          {asientos.length > 0 && (
            <div>
              <h2 className="text-xl font-800 text-white mb-5">
                Mapa de asientos VIP
                {selectedAsientos.length > 0 && (
                  <span className="ml-3 badge badge-primary">{selectedAsientos.length} seleccionado{selectedAsientos.length !== 1 ? 's' : ''}</span>
                )}
              </h2>
              <div className="card p-6">
                <SeatMap secciones={asientos} selectedIds={selectedAsientos} onToggle={toggleAsiento} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Tickets */}
        <div className="space-y-4">
          <h2 className="text-xl font-800 text-white">Entradas</h2>

          {entradas.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-text-light">No hay entradas disponibles</p>
            </div>
          ) : (
            entradas.map((ent, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="badge badge-primary mb-2">{ent.tipo}</span>
                    <p className="text-2xl font-900 gradient-text-primary">Bs {ent.precio.toFixed(2)}</p>
                    <p className="text-xs text-text-light mt-1">{ent.cantidadDisponible} disponibles</p>
                  </div>
                </div>

                {ent.tipo === 'VIP' ? (
                  <div className="text-xs text-text-secondary glass rounded-xl p-3">
                    {asientos.length > 0
                      ? `👆 Selecciona tus asientos en el mapa. ${selectedAsientos.length} seleccionado(s)`
                      : 'Cargando mapa de asientos...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateC(ent.tipo, -1)}
                      disabled={!cantidades[ent.tipo]}
                      className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center font-700 hover:border-primary/50 disabled:opacity-30 transition-all"
                    >−</button>
                    <span className="w-10 text-center text-lg font-800 text-white">{cantidades[ent.tipo] || 0}</span>
                    <button
                      onClick={() => updateC(ent.tipo, 1)}
                      disabled={cantidades[ent.tipo] >= ent.cantidadDisponible}
                      className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center font-700 hover:border-primary/50 disabled:opacity-30 transition-all"
                    >+</button>
                    <button
                      onClick={() => setCantidades(p => ({ ...p, [ent.tipo]: ent.cantidadDisponible }))}
                      className="ml-auto text-xs font-700 text-primary hover:text-primary-light transition-colors"
                    >MAX</button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Total + Buy */}
          <div className="card p-5 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-text-light">Total</p>
                <p className="text-3xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Bs {total.toFixed(2)}</p>
                <p className="text-xs text-text-light">{totalItems} entrada{totalItems !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={handleComprar}
              disabled={totalItems === 0}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {user ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Comprar ahora
                </>
              ) : 'Iniciar sesión para comprar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
