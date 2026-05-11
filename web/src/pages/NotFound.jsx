import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-8xl mb-4">🎫</span>
      <h1 className="text-4xl font-extrabold text-text mb-2">404</h1>
      <p className="text-text-secondary mb-6">Página no encontrada</p>
      <Link to="/" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">Volver al inicio</Link>
    </div>
  )
}
