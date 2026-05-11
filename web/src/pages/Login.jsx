import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetNewPwd, setResetNewPwd] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      login(data, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMsg('')
    try {
      await authApi.solicitarReset(forgotEmail)
      setResetStep(2)
      setForgotMsg('Se ha enviado un código de verificación a tu correo.')
    } catch {
      setForgotMsg('Error al enviar. Verifica el correo e intenta de nuevo.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (resetNewPwd.length < 6) { setForgotMsg('La contraseña debe tener al menos 6 caracteres'); return }
    setForgotLoading(true)
    setForgotMsg('')
    try {
      await authApi.resetPassword(forgotEmail, resetToken, resetNewPwd)
      alert('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
      setShowForgot(false)
      setResetStep(1)
    } catch (err) {
      setForgotMsg(err.response?.data?.message || 'Código incorrecto o expirado.')
    } finally {
      setForgotLoading(false)
    }
  }

  const TICKET_LOGO = (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
      <rect width="48" height="48" rx="16" fill="url(#gl)"/>
      <defs><linearGradient id="gl" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#9F7AFF"/><stop offset="1" stopColor="#6C47FF"/></linearGradient></defs>
      <path d="M12 18a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v1.5a3 3 0 0 0 0 6V27a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3v-1.5a3 3 0 0 0 0-6V18z" fill="white" opacity="0.9"/>
      <line x1="24" y1="15" x2="24" y2="33" stroke="#6C47FF" strokeWidth="2" strokeDasharray="3 3"/>
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-primary absolute -top-40 -left-40 w-96 h-96 opacity-50" />
        <div className="blob-primary absolute -bottom-40 -right-40 w-80 h-80 opacity-30" style={{ animationDelay: '4s', background: 'radial-gradient(circle, rgba(0,212,255,0.15), transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 animate-float" style={{ animationDuration: '4s' }}>
            {TICKET_LOGO}
          </div>
          <h1 className="text-4xl font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Chostito</h1>
          <p className="text-text-secondary mt-2">{showForgot ? 'Recupera tu contraseña' : 'Bienvenido de vuelta'}</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-white/08">
          {!showForgot ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-error-light/20 border border-error/30 text-error rounded-xl px-4 py-3 text-sm font-600 animate-scale-in">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-600 text-text-secondary mb-2">Correo electrónico</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@correo.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-text-secondary mb-2">Contraseña</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base relative mt-2">
                <span className="relative z-10">{loading ? 'Ingresando...' : 'Iniciar sesión'}</span>
              </button>

              <div className="flex flex-col items-center gap-3 mt-4">
                {error && (
                  <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-primary hover:text-primary-light transition-colors font-700 animate-fade-in">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
                
                <p className="text-sm text-text-light">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-primary hover:text-primary-light font-700 transition-colors">Regístrate gratis</Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={resetStep === 1 ? handleForgot : handleResetPassword} className="space-y-5">
              {forgotMsg && (
                <div className={`flex items-center gap-2 ${forgotMsg.includes('Error') || forgotMsg.includes('incorrecto') ? 'bg-error-light/20 border-error/30 text-error' : 'bg-success-light/20 border-success/30 text-success'} border rounded-xl px-4 py-3 text-sm font-600 animate-scale-in`}>
                  {forgotMsg}
                </div>
              )}
              
              {resetStep === 1 ? (
                <div>
                  <label className="block text-sm font-600 text-text-secondary mb-2">Tu correo electrónico</label>
                  <input
                    type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                    placeholder="tu@correo.com"
                    className="input-field"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-600 text-text-secondary mb-2">Código de verificación</label>
                    <input
                      type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} required
                      placeholder="Ej: 123456"
                      className="input-field text-center tracking-widest font-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-600 text-text-secondary mb-2">Nueva contraseña</label>
                    <input
                      type="password" value={resetNewPwd} onChange={e => setResetNewPwd(e.target.value)} required
                      placeholder="Mínimo 6 caracteres"
                      className="input-field"
                    />
                  </div>
                </>
              )}

              <button type="submit" disabled={forgotLoading} className="btn-primary w-full py-4 text-base">
                {forgotLoading ? 'Procesando...' : (resetStep === 1 ? 'Enviar código' : 'Cambiar contraseña')}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setShowForgot(false); setResetStep(1); setForgotMsg(''); }} 
                className="w-full text-center text-sm text-text-secondary hover:text-text transition-colors"
              >
                ← Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
