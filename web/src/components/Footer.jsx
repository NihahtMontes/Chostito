import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/06 glass">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                <rect width="32" height="32" rx="10" fill="url(#fg)"/>
                <defs><linearGradient id="fg" x1="0" y1="0" x2="32" y2="32"><stop stopColor="#9F7AFF"/><stop offset="1" stopColor="#6C47FF"/></linearGradient></defs>
                <path d="M8 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4v-1z" fill="white" opacity="0.9"/>
                <line x1="16" y1="10" x2="16" y2="22" stroke="#6C47FF" strokeWidth="1.5" strokeDasharray="2 2"/>
              </svg>
              <span className="text-lg font-900 gradient-text-primary" style={{ fontFamily: 'Space Grotesk' }}>Chostito</span>
            </div>
            <p className="text-sm text-text-light leading-relaxed">La plataforma líder en venta de entradas para eventos en Bolivia.</p>
          </div>

          {/* Nav */}
          <div>
            <p className="text-sm font-700 text-white mb-3">Plataforma</p>
            <div className="space-y-2">
              {[['/', 'Explorar eventos'], ['/login', 'Iniciar sesión'], ['/register', 'Registrarse']].map(([to, label]) => (
                <Link key={to} to={to} className="block text-sm text-text-light hover:text-primary transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-700 text-white mb-3">Legal</p>
            <div className="space-y-2">
              {['Privacidad', 'Términos de uso', 'Ayuda'].map(l => (
                <a key={l} href="#" className="block text-sm text-text-light hover:text-primary transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="divider" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-light">© {new Date().getFullYear()} Chostito. Todos los derechos reservados.</p>
          <p className="text-xs text-text-light">Hecho con ♥ en Bolivia</p>
        </div>
      </div>
    </footer>
  )
}
