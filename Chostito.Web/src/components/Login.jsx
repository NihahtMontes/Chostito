import { useState } from 'react';
import api from '../services/api'; // Usa tu interceptor de axios

function Login({ onLoginSuccess }) { // Recibimos la función
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            alert('¡Bienvenido!');
            onLoginSuccess(); // <--- Aquí le avisamos a App.jsx
        } catch {
            alert('Error en las credenciales');
        }
    };

    return (
        <div className="login-box">
            <h2>Iniciar Sesión</h2>
            <input type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleLogin}>Entrar</button>
        </div>
    );
}

export default Login;