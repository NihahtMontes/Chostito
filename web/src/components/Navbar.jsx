import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const TICKET_ICON = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
    <rect width="32" height="32" rx="10" fill="url(#grad)"/>
    <defs><linearGradient id="grad" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#9F7AFF"/><stop offset="1" stopColor="#6C47FF"/></linearGradient></defs>
    <path d="M8 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4v-1z" fill="white" opacity="0.9"/>
    <line x1="16" y1="10" x2="16" y2="22" stroke="#6C47FF" strokeWidth="1.5" strokeDasharray="2 2"/>
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path) => location.pathname === path

  const navLink = (to, label) => (
    <Link
      key={to}
      to={to}
      className={`relative px-4 py-2 text-sm font-600 rounded-xl transition-all duration-300 ${
        isActive(to)
          ? 'text-white'
          : 'text-text-secondary hover:text-white'
      }`}
    >
      {isActive(to) && (
        <span className="absolute inset-0 rounded-xl bg-white/10 border border-white/10" />
      )}
      <span className="relative">{label}</span>
    </Link>
  )

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'glass-strong border-b border-white/08'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link to={user?.rol === 'Admin' || user?.rol === 'Organizador' ? '/admin' : '/'} className="flex items-center gap-2.5 group">
            <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              {TICKET_ICON}
            </div>
            <span className="text-xl font-800 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>
              Chostito
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                {navLink('/', 'Explorar')}
                <div className="w-px h-5 bg-white/10 mx-2" />
                <Link to="/login" className="btn-secondary text-sm py-2 px-5">Iniciar sesión</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5 ml-1 relative z-10">Registrarse</Link>
              </>
            ) : user.rol === 'Cliente' ? (
              <>
                {navLink('/', 'Explorar')}
                {navLink('/mis-reservas', 'Mis Reservas')}
                {navLink('/favoritos', 'Favoritos')}
              </>
            ) : (
              <>
                {navLink('/admin', 'Dashboard')}
                {navLink('/admin/eventos', 'Eventos')}
                {navLink('/admin/escanear', 'Escanear QR')}
                {user.rol === 'Admin' && navLink('/admin/ganancias', 'Ganancias')}
              </>
            )}

            {user && (
              <div className="relative ml-3">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/06 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-xs font-700 text-white ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all">
                    {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-600 text-text max-w-[120px] truncate hidden lg:block">{user.nombre}</span>
                  <svg className={`w-4 h-4 text-text-light transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 glass-strong rounded-2xl shadow-2xl border border-white/10 py-2 animate-scale-in"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/06">
                      <p className="text-sm font-700 text-white">{user.nombre}</p>
                      <p className="text-xs text-text-light truncate mt-0.5">{user.email}</p>
                      <span className="badge badge-primary mt-1.5 text-xs">{user.rol}</span>
                    </div>
                    <Link to="/perfil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setProfileOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Mi Perfil
                    </Link>
                    {user.rol === 'Cliente' && (
                      <Link to="/mis-reservas" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setProfileOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        Mis Reservas
                      </Link>
                    )}
                    <div className="h-px bg-white/06 mx-3 my-1" />
                    <button
                      onClick={() => { logout(); setProfileOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-light/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu btn */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/06 transition-all"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-strong border-t border-white/06 px-4 py-4 space-y-1 animate-fade-in">
          {!user ? (
            <>
              <Link to="/" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Explorar</Link>
              <Link to="/login" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
              <Link to="/register" className="block px-4 py-3 rounded-xl text-sm font-700 text-primary hover:bg-primary/10 transition-all" onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </>
          ) : user.rol === 'Cliente' ? (
            <>
              <Link to="/" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Explorar</Link>
              <Link to="/mis-reservas" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Mis Reservas</Link>
              <Link to="/favoritos" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Favoritos</Link>
            </>
          ) : (
            <>
              <Link to="/admin" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/eventos" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Mis Eventos</Link>
              <Link to="/admin/escanear" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Escanear QR</Link>
            </>
          )}
          {user && (
            <>
              <div className="h-px bg-white/06 my-2" />
              <Link to="/perfil" className="block px-4 py-3 rounded-xl text-sm font-600 text-text-secondary hover:text-white hover:bg-white/05 transition-all" onClick={() => setMenuOpen(false)}>Mi Perfil</Link>
              <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-600 text-error hover:bg-error-light/20 transition-all">Cerrar sesión</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
