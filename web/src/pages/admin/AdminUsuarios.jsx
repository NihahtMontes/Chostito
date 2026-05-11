import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const RC = { Admin: 'bg-info-light text-info', Organizador: 'bg-warning-light text-warning', Cliente: 'bg-success-light text-success' }

export default function AdminUsuarios() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/usuarios', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(setUsers).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-extrabold text-text">Usuarios</h1><p className="text-text-secondary text-sm">{users.length} registrados</p></div>
        <Link to="/admin/usuarios/nuevo" className="px-5 py-2.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all">+ Nuevo</Link>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div> :
        <div className="space-y-3">
          {users.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between card p-5 hover:-translate-y-1 transition-all animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary-light flex items-center justify-center font-900 text-lg">{u.nombre?.charAt(0)?.toUpperCase() || '?'}</div>
                <div><p className="font-800 text-white">{u.nombre}</p><p className="text-sm text-text-light">{u.email}</p></div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-800 shadow-sm ${RC[u.rol] || 'bg-white/10 text-text-secondary'}`}>{u.rol}</span>
            </div>
          ))}
        </div>}
    </div>
  )
}
