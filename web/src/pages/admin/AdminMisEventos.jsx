import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { eventosApi } from '../../api/eventos'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5027/api').replace('/api', '')

const EC = {
  Publicado: 'badge-success',
  Borrador: 'badge-warning',
  Cancelado: 'badge-error',
  Finalizado: 'badge-info',
}

export default function AdminMisEventos() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { eventosApi.misEventos().then(setEventos).finally(() => setLoading(false)) }, [])

  const handleDelete = async (ev) => {
    if (!window.confirm(`¿Eliminar "${ev.titulo}"? Esta acción no se puede deshacer.`)) return
    setDeleting(ev.id)
    try {
      await eventosApi.delete(ev.id)
      setEventos(p => p.filter(e => e.id !== ev.id))
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const handlePublicar = async (id) => {
    try {
      await eventosApi.update(id, { estado: 'Publicado' })
      setEventos(p => p.map(e => e.id === id ? { ...e, estado: 'Publicado' } : e))
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo publicar')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>Mis Eventos</h1>
          <p className="text-text-secondary mt-1">{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/admin/eventos/nuevo" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm self-start">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Nuevo evento
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🎪</div>
          <p className="text-xl font-700 text-white">Sin eventos aún</p>
          <p className="text-text-secondary mt-2 mb-6">Crea tu primer evento y comienza a vender</p>
          <Link to="/admin/eventos/nuevo" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">Crear evento</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventos.map((ev, i) => {
            const imgSrc = ev.imagenUrl
              ? (ev.imagenUrl.startsWith('http') ? ev.imagenUrl : `${API_BASE}${ev.imagenUrl}`)
              : null
            return (
              <div key={ev.id} className="card overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-primary/15 to-secondary/10">
                  {imgSrc ? (
                    <img src={imgSrc} alt={ev.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`badge text-xs ${EC[ev.estado] || 'badge-primary'}`}>{ev.estado}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-700 text-white truncate mb-0.5">{ev.titulo}</h3>
                  <p className="text-xs text-text-light mb-1">{new Date(ev.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}</p>
                  <div className="flex gap-3 text-xs text-text-secondary mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                      {ev.categoria}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {ev.lugar}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/eventos/${ev.id}/editar`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-700 bg-primary/15 text-primary rounded-xl hover:bg-primary/25 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      Editar
                    </Link>
                    {ev.estado === 'Borrador' && (
                      <button
                        onClick={() => handlePublicar(ev.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-700 bg-success-light/20 text-success rounded-xl hover:bg-success/20 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Publicar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ev)}
                      disabled={deleting === ev.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-700 bg-error-light/20 text-error rounded-xl hover:bg-error/20 transition-all disabled:opacity-50"
                    >
                      {deleting === ev.id ? (
                        <span className="w-3 h-3 border-2 border-error border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      )}
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
