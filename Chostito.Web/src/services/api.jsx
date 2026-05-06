// src/api.jsx
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:5001/api' // La URL del backend de tu amigo
});

// Este "interceptor" se ejecuta ANTES de cada petición
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        // Le pegamos el token al encabezado Authorization
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.reload(); // Redirige al login automáticamente
        }
        return Promise.reject(error);
    }
);

export default api;