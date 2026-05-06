import { useState } from 'react';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            // Llamada al backend de tu amigo
            const response = await axios.post('https://localhost:5001/api/auth/login', {
                email,
                password
            });

            // Guardamos el token en la memoria del navegador
            const token = response.data.token;
            localStorage.setItem('token', token);
            alert('¡Bienvenido a Chostito!');
        } catch (error) {
            alert('Error: Credenciales incorrectas');
        }
    };

    return (
        <div>
            <input type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleLogin}>Entrar</button>
        </div>
    );
}