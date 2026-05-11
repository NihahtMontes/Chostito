import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/auth'

export default function Perfil() {
  const { user, login } = useAuth()
  const [tab, setTab] = useState('info')
  const [msg, setMsg] = useState('')

  const [resetEmail, setResetEmail] = useState(user?.email || '')
  const [resetToken, setResetToken] = useState('')
  const [resetPwd, setResetPwd] = useState('')
  const [resetStep, setResetStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSolicitarReset = async () => {
    setLoading(true)
    try { const r = await authApi.solicitarReset(resetEmail); setResetToken(r.token || ''); setResetStep(2); setMsg('Token generado (revisa consola)') }
    catch (e) { setMsg('Error al enviar') }
    finally { setLoading(false) }
  }

  const handleResetPwd = async () => {
    setLoading(true)
    try { await authApi.resetPassword(resetEmail, resetToken, resetPwd); setMsg('Contraseña actualizada'); setResetStep(1) }
    catch (e) { setMsg(e.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const handleFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await authApi.uploadFoto(reader.result)
        setMsg('Foto actualizada, reinicia sesión para verla')
      } catch { setMsg('Error al subir foto') }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-text mb-6">Mi perfil</h1>

      {msg && <div className="bg-success-light text-success rounded-xl px-4 py-3 text-sm font-semibold mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <label className="cursor-pointer relative group">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold group-hover:opacity-80 transition-opacity">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-lg">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </span>
            <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </label>
          <div>
            <p className="text-xl font-extrabold text-text">{user?.nombre}</p>
            <p className="text-text-secondary">{user?.email}</p>
            {user?.telefono && <p className="text-text-light text-sm">{user?.telefono}</p>}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[{ k: 'info', l: 'Información' }, { k: 'password', l: 'Cambiar contraseña' }, { k: 'privacy', l: 'Privacidad' }, { k: 'help', l: 'Ayuda' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === t.k ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-gray-200'}`}>{t.l}</button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-text-light">Nombre</span><span className="font-semibold text-text">{user?.nombre}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-text-light">Email</span><span className="font-semibold text-text">{user?.email}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-text-light">Teléfono</span><span className="font-semibold text-text">{user?.telefono || '-'}</span></div>
            <div className="flex justify-between py-2"><span className="text-text-light">Miembro desde</span><span className="font-semibold text-text">{user?.fechaRegistro ? new Date(user.fechaRegistro).toLocaleDateString('es-ES') : '-'}</span></div>
          </div>
        )}

        {tab === 'password' && (
          <div className="space-y-3">
            {resetStep === 1 ? (
              <>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Tu correo" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                <button onClick={handleSolicitarReset} disabled={loading} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50 transition-all">{loading ? 'Enviando...' : 'Enviar token'}</button>
              </>
            ) : (
              <>
                <div className="bg-warning-light text-warning p-3 rounded-xl text-sm font-semibold">Token: {resetToken}</div>
                <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Token" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="Nueva contraseña (mín 6)" className="w-full px-4 py-3 bg-surface-alt border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" />
                <button onClick={handleResetPwd} disabled={loading} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark disabled:opacity-50 transition-all">{loading ? 'Cambiando...' : 'Cambiar contraseña'}</button>
              </>
            )}
          </div>
        )}

        {tab === 'privacy' && <p className="text-sm text-text-secondary leading-relaxed">En Chostito nos tomamos muy en serio tu privacidad. Tus datos personales se almacenan de forma segura en nuestros servidores. Nunca compartimos tu información con terceros sin tu consentimiento. Las contraseñas se almacenan encriptadas con BCrypt. Podés solicitar la eliminación de tus datos en cualquier momento a soporte@chostito.com.</p>}

        {tab === 'help' && <div className="text-sm text-text-secondary space-y-2"><p className="font-bold text-text">Contacto: soporte@chostito.com</p><p>Cómo comprar entradas: Explora eventos, selecciona entradas y paga con QR.</p><p>Cómo cancelar: Anda a Mis Reservas y selecciona Cancelar.</p><p>Cómo usar el QR: Presentalo en la entrada del evento.</p><p className="text-text-light mt-3">Horario de atención: Lun-Vie 9:00-18:00</p></div>}
      </div>
    </div>
  )
}
