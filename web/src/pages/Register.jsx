import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Ingresa un correo electrónico válido')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.register({ ...form, rol: 'Cliente' })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const field = (label, type, key, placeholder, extra = {}) => (
    <div>
      <label className="block text-sm font-600 text-text-secondary mb-2">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="input-field"
        {...extra}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-primary absolute -top-40 -right-40 w-96 h-96 opacity-40" />
        <div className="blob-primary absolute -bottom-40 -left-40 w-80 h-80 opacity-30" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30 animate-float" style={{ animationDuration: '4s' }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <path d="M6 10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4v-1z" fill="white" opacity="0.9"/>
              <line x1="16" y1="8" x2="16" y2="20" stroke="#6C47FF" strokeWidth="1.5" strokeDasharray="2 2"/>
            </svg>
          </div>
          <h1 className="text-3xl font-900 text-white" style={{ fontFamily: 'Space Grotesk' }}>Crear cuenta</h1>
          <p className="text-text-secondary mt-2">Únete a Chostito y vive la experiencia</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-white/08 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-error-light/20 border border-error/30 text-error rounded-xl px-4 py-3 text-sm font-600 animate-scale-in">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('Nombre completo', 'text', 'nombre', 'Juan Pérez', { required: true })}
            {field('Correo electrónico', 'email', 'email', 'tu@correo.com', { required: true })}
            {field('Teléfono', 'tel', 'telefono', '+591 700 00000')}
            {field('Contraseña', 'password', 'password', '••••••••', { required: true, minLength: 6 })}

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-text-light">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary hover:text-primary-light font-700 transition-colors">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
