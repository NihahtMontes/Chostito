import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { dashboardApi } from '../../api/dashboard'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5027/api').replace('/api', '')

const QUICK_ACTIONS = [
  { to: '/admin/categorias', icon: '📂', label: 'Categorías', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20' },
  { to: '/admin/lugares', icon: '🏢', label: 'Lugares', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20' },
  { to: '/admin/usuarios', icon: '👥', label: 'Usuarios', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20' },
  { to: '/admin/usuarios/nuevo', icon: '➕', label: 'Registrar', color: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/20' },
  { to: '/admin/todos-eventos', icon: '👁️', label: 'Ver todos', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20' },
  { to: '/admin/ganancias', icon: '📊', label: 'Ganancias', color: 'from-teal-500/20 to-teal-600/10', border: 'border-teal-500/20' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      user?.rol === 'Admin' ? dashboardApi.getStats().catch(() => null) : Promise.resolve(null),
      dashboardApi.misVentas().catch(() => []),
    ]).then(([s, v]) => { setStats(s); setVentas(v || []) }).finally(() => setLoading(false))
  }, [])

  const fmtBs = (v) => v ? `Bs ${Number(v).toLocaleString('es-ES', { maximumFractionDigits: 0 })}` : 'Bs 0'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-light text-sm font-600 mb-1">Panel de control</p>
          <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>
            Hola, {user?.nombre?.split(' ')[0]}
          </h1>
          <p className="text-text-secondary mt-1">{user?.rol === 'Admin' ? 'Administrador' : 'Organizador'}</p>
        </div>
        <Link to="/admin/eventos/nuevo" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Nuevo evento
        </Link>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '🎪', val: stats.totalEventos, label: 'Eventos totales', color: 'from-violet-500', change: '+12%' },
            { icon: '🎫', val: stats.entradasVendidas, label: 'Entradas vendidas', color: 'from-emerald-500', change: '+8%' },
            { icon: '👥', val: stats.totalUsuarios, label: 'Usuarios registrados', color: 'from-cyan-500', change: '+5%' },
            { icon: '💰', val: fmtBs(stats.totalRecaudado), label: 'Total recaudado', color: 'from-amber-500', change: '+22%' },
          ].map((s, i) => (
            <div key={i} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color}/20 to-transparent flex items-center justify-center text-xl mb-3`}>
                {s.icon}
              </div>
              <p className="text-2xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>{s.val}</p>
              <p className="text-xs text-text-light mt-1">{s.label}</p>
              <div className="flex items-center gap-1 mt-2">
                <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                <span className="text-xs font-700 text-success">{s.change}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions (Admin only) */}
      {user?.rol === 'Admin' && (
        <div>
          <h2 className="text-lg font-800 text-white mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className={`bg-gradient-to-br ${a.color} border ${a.border} rounded-2xl p-4 text-center hover:-translate-y-1 transition-all duration-300 group`}
              >
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-300">{a.icon}</span>
                <p className="text-xs font-700 text-text-secondary group-hover:text-white transition-colors">{a.label}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Eventos / Ventas */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-800 text-white">Tus eventos</h2>
          <Link to="/admin/eventos" className="text-sm font-600 text-primary hover:text-primary-light transition-colors">Ver todos →</Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : ventas.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🎪</div>
            <p className="text-lg font-700 text-white">Sin eventos aún</p>
            <p className="text-text-secondary text-sm mt-1 mb-5">Crea tu primer evento y empieza a vender entradas</p>
            <Link to="/admin/eventos/nuevo" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              Crear evento
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ventas.map((v, i) => {
              const imgSrc = v.imagenUrl
                ? (v.imagenUrl.startsWith('http') ? v.imagenUrl : `${API_BASE}${v.imagenUrl}`)
                : null
              const pct = v.entradasTotales > 0 ? (v.entradasVendidas / v.entradasTotales) * 100 : 0
              return (
                <div key={v.id} className="card overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="relative h-32 bg-gradient-to-br from-primary/15 to-secondary/10">
                    {imgSrc && <img src={imgSrc} alt={v.titulo} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className={`badge text-xs ${v.estado === 'Publicado' ? 'badge-success' : v.estado === 'Borrador' ? 'badge-warning' : 'badge-error'}`}>
                        {v.estado}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-700 text-white truncate mb-1">{v.titulo}</h3>
                    <p className="text-xs text-text-light mb-4">{new Date(v.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'long' })}</p>

                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      {[
                        { l: 'Vendidas', v: v.entradasVendidas || 0, c: 'text-primary-light' },
                        { l: 'Total', v: v.entradasTotales || 0, c: 'text-text-secondary' },
                        { l: 'Bs', v: Number(v.totalRecaudado || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 }), c: 'text-success' }
                      ].map((s, j) => (
                        <div key={j}>
                          <p className={`text-lg font-800 ${s.c}`}>{s.v}</p>
                          <p className="text-xs text-text-light">{s.l}</p>
                        </div>
                      ))}
                    </div>

                    <div className="progress-track mb-3">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-text-light text-right">{pct.toFixed(1)}% vendido</p>

                    <div className="flex gap-2 mt-4">
                      <Link to={`/admin/eventos/${v.id}/editar`} className="flex-1 py-2 rounded-xl bg-primary/15 text-primary text-xs font-700 text-center hover:bg-primary/25 transition-all">Editar</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
