import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { eventosApi } from '../../api/eventos'

const EC = { Publicado: 'bg-success-light text-success', Borrador: 'bg-warning-light text-warning', Cancelado: 'bg-error-light text-error', Finalizado: 'bg-info-light text-info' }

export default function AdminTodosEventos() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => { eventosApi.getTodos().then(setEventos).finally(() => setLoading(false)) }, [])

  const filtrados = filtro ? eventos.filter(e => e.estado === filtro || e.titulo.toLowerCase().includes(filtro.toLowerCase())) : eventos

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-900 text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>Todos los eventos</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFiltro('')} className={`px-4 py-2 rounded-full text-sm font-700 transition-all ${!filtro ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>Todos</button>
        {['Publicado', 'Borrador', 'Cancelado', 'Finalizado'].map(e => <button key={e} onClick={() => setFiltro(e)} className={`px-4 py-2 rounded-full text-sm font-700 transition-all ${filtro === e ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>{e}</button>)}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> :
        <div className="space-y-3">
          {filtrados.map(ev => (
            <Link key={ev.id} to={`/evento/${ev.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between card p-5 hover:-translate-y-1 transition-all group">
              <div className="mb-3 sm:mb-0">
                <p className="font-800 text-white text-lg group-hover:text-primary transition-colors">{ev.titulo}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm font-600 text-text-secondary">{ev.organizador}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-sm text-text-light">{ev.categoria}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-sm text-text-light">{ev.lugar}</span>
                </div>
                <p className="text-xs text-text-light mt-2 bg-white/05 inline-block px-2 py-1 rounded-md">{new Date(ev.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-800 shadow-sm self-start sm:self-center ${EC[ev.estado] || 'bg-white/10 text-text-secondary'}`}>{ev.estado}</span>
            </Link>
          ))}
          {filtrados.length === 0 && (
            <div className="card p-12 text-center">
               <p className="text-text-secondary text-lg">No hay eventos para mostrar.</p>
            </div>
          )}
        </div>}
    </div>
  )
}
