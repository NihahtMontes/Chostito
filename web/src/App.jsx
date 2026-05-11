import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import EventoDetalle from './pages/EventoDetalle'
import Checkout from './pages/Checkout'
import MisReservas from './pages/MisReservas'
import FacturaDetalle from './pages/FacturaDetalle'
import Favoritos from './pages/Favoritos'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMisEventos from './pages/admin/AdminMisEventos'
import AdminEventoForm from './pages/admin/AdminEventoForm'
import AdminEscanearQR from './pages/admin/AdminEscanearQR'
import AdminCategorias from './pages/admin/AdminCategorias'
import AdminLugares from './pages/admin/AdminLugares'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminRegistrarUsuario from './pages/admin/AdminRegistrarUsuario'
import AdminTodosEventos from './pages/admin/AdminTodosEventos'
import AdminGanancias from './pages/admin/AdminGanancias'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/evento/:id" element={<EventoDetalle />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/mis-reservas" element={<MisReservas />} />
                <Route path="/mis-reservas/:id/factura" element={<FacturaDetalle />} />
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/perfil" element={<Perfil />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Admin', 'Organizador']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/eventos" element={<AdminMisEventos />} />
                <Route path="/admin/eventos/nuevo" element={<AdminEventoForm />} />
                <Route path="/admin/eventos/:id/editar" element={<AdminEventoForm />} />
                <Route path="/admin/escanear" element={<AdminEscanearQR />} />
                <Route path="/admin/categorias" element={<AdminCategorias />} />
                <Route path="/admin/lugares" element={<AdminLugares />} />
              </Route>

              <Route element={<ProtectedRoute roles={['Admin']} />}>
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/admin/usuarios/nuevo" element={<AdminRegistrarUsuario />} />
                <Route path="/admin/todos-eventos" element={<AdminTodosEventos />} />
                <Route path="/admin/ganancias" element={<AdminGanancias />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
