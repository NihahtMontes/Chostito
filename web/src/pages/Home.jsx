import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { eventosApi } from '../api/eventos'
import { useAuth } from '../hooks/useAuth'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5027/api').replace('/api', '')

function useIntersection(threshold = 0.15) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function AnimatedSection({ children, delay = 0, className = '' }) {
  const [ref, visible] = useIntersection()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

function EventoCard({ evento, index }) {
  const [ref, visible] = useIntersection()
  const navigate = useNavigate()
  const imgSrc = evento.imagenUrl
    ? (evento.imagenUrl.startsWith('http') ? evento.imagenUrl : `${API_BASE}${evento.imagenUrl}`)
    : null

  return (
    <div
      ref={ref}
      className="card cursor-pointer group overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.96)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`
      }}
      onClick={() => navigate(`/evento/${evento.id}`)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/10">
        {imgSrc ? (
          <img src={imgSrc} alt={evento.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="badge badge-primary text-xs">
            {evento.categoria}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-lg text-xs font-700" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff' }}>
            {new Date(evento.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' })}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-base font-700 text-white mb-1 group-hover:text-primary-light transition-colors line-clamp-1">{evento.titulo}</h3>
        <p className="text-xs text-text-light mb-3 line-clamp-1">{evento.eslogan}</p>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <svg className="w-3.5 h-3.5 text-text-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{evento.lugar}, {evento.ciudad}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-light">Desde</p>
          <p className="text-lg font-800 gradient-text-primary">Bs {evento.precioMinimo ? evento.precioMinimo.toFixed(0) : '0'}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
          <svg className="w-4 h-4 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [filtered, setFiltered] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catSel, setCatSel] = useState('Todos')
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const evs = await eventosApi.getAll({ estado: 'Publicado' })
        setEventos(evs)
        setFiltered(evs)
        const cats = [...new Set(evs.map(e => e.categoria).filter(Boolean))]
        setCategorias(cats)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [])

  useEffect(() => {
    let res = eventos
    if (catSel !== 'Todos') res = res.filter(e => e.categoria === catSel)
    if (search.trim()) res = res.filter(e => e.titulo.toLowerCase().includes(search.toLowerCase()) || e.lugar?.toLowerCase().includes(search.toLowerCase()))
    setFiltered(res)
  }, [catSel, search, eventos])

  const featured = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  return (
    <div className="relative min-h-screen">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob-primary absolute -top-32 -left-32 w-[600px] h-[600px] opacity-40" />
        <div className="blob-primary absolute top-1/2 -right-40 w-[500px] h-[500px] opacity-25" style={{ animationDelay: '3s' }} />
        <div className="blob-primary absolute bottom-0 left-1/3 w-[400px] h-[400px] opacity-20" style={{ animationDelay: '5s', background: 'radial-gradient(circle, rgba(0,212,255,0.12), transparent 70%)' }} />
      </div>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div
          className="max-w-4xl"
          style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(60px)', transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8 animate-float" style={{ animationDuration: '5s' }}>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-600 text-text-secondary">Plataforma de eventos #1 en Bolivia</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-900 leading-none mb-6" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-2px' }}>
            <span className="block text-white">Vive cada</span>
            <span className="block gradient-text animate-gradient">momento</span>
            <span className="block text-white">al máximo</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Descubre conciertos, eventos culturales y espectáculos únicos. 
            Compra tu entrada, elige tu asiento y crea recuerdos inolvidables.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => document.getElementById('eventos-section').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary flex items-center gap-2 px-8 py-4 text-base animate-pulse-glow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              Explorar eventos
            </button>
            {!user && (
              <Link to="/register" className="btn-secondary flex items-center gap-2 px-8 py-4 text-base">
                Crear cuenta gratis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
            )}
          </div>
        </div>

        {/* Floating stat cards */}
        <div
          className="flex gap-4 mt-16 flex-wrap justify-center"
          style={{ opacity: heroVisible ? 1 : 0, transition: 'opacity 1s ease 0.5s' }}
        >
          {[
            { label: 'Eventos activos', val: eventos.length, icon: '🎪' },
            { label: 'Asientos disponibles', val: '10k+', icon: '🎟️' },
            { label: 'Ciudades', val: '5+', icon: '🌎' },
          ].map(({ label, val, icon }, i) => (
            <div key={i} className="glass rounded-2xl px-6 py-4 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>{val}</p>
                <p className="text-xs text-text-light">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <svg className="w-6 h-6 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Eventos section */}
      <section id="eventos-section" className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* Search + Filter */}
        <AnimatedSection className="mb-10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-3xl font-800 text-white" style={{ fontFamily: 'Space Grotesk' }}>
                Eventos disponibles
              </h2>
              <p className="text-text-secondary mt-1">{filtered.length} evento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="relative w-full sm:w-80">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar eventos..."
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {['Todos', ...categorias].map(cat => (
              <button
                key={cat}
                onClick={() => setCatSel(cat)}
                className={`px-4 py-2 rounded-full text-sm font-600 transition-all duration-300 ${
                  catSel === cat
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'glass text-text-secondary hover:text-white hover:border-white/20 border border-white/06'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="skeleton h-48" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-5 animate-float">
              <svg className="w-10 h-10 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-700 text-white">Sin resultados</p>
            <p className="text-text-secondary mt-2">Intenta con otra búsqueda o categoría</p>
            <button onClick={() => { setSearch(''); setCatSel('Todos') }} className="btn-primary mt-6 px-6 py-2.5 text-sm">Limpiar filtros</button>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {featured.map((ev, i) => <EventoCard key={ev.id} evento={ev} index={i} />)}
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <>
                <div className="divider" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {rest.map((ev, i) => <EventoCard key={ev.id} evento={ev} index={i} />)}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
