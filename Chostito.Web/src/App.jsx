import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Login from './components/Login'
import ListaEventos from './components/ListaEventos'
import './App.css'

function App() {
    const [count, setCount] = useState(0)
    // Estado único para el login
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false); 
        // No es necesario recargar la página si usas el estado de React
    };

    return (
        <>
            <section id="center">
                <div className="hero">
                    <img src={heroImg} className="base" width="170" height="179" alt="" />
                    <img src={reactLogo} className="framework" alt="React logo" />
                    <img src={viteLogo} className="vite" alt="Vite logo" />
                </div>
                <div>
                    <h1>Chostito App</h1>
                    <p>Contador de prueba: {count}</p>
                </div>
                <button type="button" className="counter" onClick={() => setCount(count + 1)}>
                    Aumentar: {count}
                </button>
            </section>

            <section id="next-steps">
                {!isLoggedIn ? (
                    /* Pasamos la función para actualizar el estado al hijo */
                    <Login onLoginSuccess={() => setIsLoggedIn(true)} />
                ) : (
                    <>
                        <div style={{ textAlign: 'right', padding: '10px' }}>
                            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
                        </div>
                        <ListaEventos />
                    </>
                )}
            </section>

            {/* Resto de tu HTML de documentación... */}
        </>
    )
}

export default App;