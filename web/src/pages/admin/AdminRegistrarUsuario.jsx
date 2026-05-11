import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminRegistrarUsuario() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', rol: 'Cliente' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Email inválido'); return }
    setLoading(true); setError('')
    try {
      await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      navigate('/admin/usuarios')
    } catch (e) { setError('Error al crear') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-900 text-white mb-6" style={{ fontFamily: 'Space Grotesk' }}>Registrar usuario</h1>
      {error && (
        <div className="flex items-center gap-2 bg-error-light/20 border border-error/30 text-error rounded-xl px-4 py-3 text-sm font-600 mb-6 animate-scale-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-600 text-text-secondary mb-2">Rol</label>
          <div className="flex gap-2">
            {['Cliente', 'Organizador', 'Admin'].map(r => (
              <button key={r} type="button" onClick={() => setForm({ ...form, rol: r })} className={`flex-1 py-2.5 rounded-xl text-sm font-700 transition-all ${form.rol === r ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-text-secondary hover:text-white border border-white/06'}`}>{r}</button>
            ))}
          </div>
        </div>
        <div><label className="block text-sm font-600 text-text-secondary mb-2">Nombre</label><input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required className="input-field" placeholder="Nombre completo" /></div>
        <div><label className="block text-sm font-600 text-text-secondary mb-2">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="input-field" placeholder="correo@ejemplo.com" /></div>
        <div><label className="block text-sm font-600 text-text-secondary mb-2">Teléfono</label><input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="input-field" placeholder="+591 12345678" /></div>
        <div><label className="block text-sm font-600 text-text-secondary mb-2">Contraseña</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} className="input-field" placeholder="Mínimo 6 caracteres" /></div>
        
        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creando...
            </span>
          ) : 'Crear usuario'}
        </button>
      </form>
    </div>
  )
}
