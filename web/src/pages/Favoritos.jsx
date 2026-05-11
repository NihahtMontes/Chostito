import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { favoritosApi } from '../api/favoritos'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5027/api').replace('/api', '')

export default function Favoritos() {
  const [favs, setFavs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { favoritosApi.getAll().then(setFavs).finally(() => setLoading(false)) }, [])

  const handleRemove = async (id) => {
    await favoritosApi.eliminar(id)
    setFavs(p => p.filter(f => f.evento.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>Favoritos</h1>
        <p className="text-text-secondary mt-1">{favs.length} evento{favs.length !== 1 ? 's' : ''} guardado{favs.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : favs.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3 animate-float">❤️</div>
          <p className="text-xl font-700 text-white">Sin favoritos aún</p>
          <p className="text-text-secondary mt-2 mb-6">Guarda eventos que te interesen para verlos aquí</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">Explorar eventos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favs.map((f, i) => {
            const imgSrc = f.evento.imagenUrl
              ? (f.evento.imagenUrl.startsWith('http') ? f.evento.imagenUrl : `${API_BASE}${f.evento.imagenUrl}`)
              : null
            return (
              <div key={f.id} className="card overflow-hidden group animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="relative h-40 bg-gradient-to-br from-primary/15 to-secondary/10">
                  {imgSrc ? (
                    <img src={imgSrc} alt={f.evento.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🎪</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/60 to-transparent" />
                  <button
                    onClick={() => handleRemove(f.evento.id)}
                    className="absolute top-3 right-3 p-2 glass rounded-full hover:bg-error/20 transition-all group/btn"
                    title="Quitar de favoritos"
                  >
                    <svg className="w-4 h-4 text-error fill-error group-hover/btn:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <Link to={`/evento/${f.evento.id}`} className="block p-5">
                  <h3 className="font-700 text-white group-hover:text-primary-light transition-colors line-clamp-1 mb-1">{f.evento.titulo}</h3>
                  <div className="flex items-center gap-1 text-xs text-text-light mb-3">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {f.evento.lugar}, {f.evento.ciudad}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="badge badge-primary text-xs">{f.evento.categoria}</span>
                    <span className="text-xs text-text-light">{new Date(f.evento.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' })}</span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
