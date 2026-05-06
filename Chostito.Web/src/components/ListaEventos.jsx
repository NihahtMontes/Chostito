// src/ListaEventos.jsx
import { useState, useEffect } from 'react'; // Agregamos useEffect y useState
import api from '../services/api';

function ListaEventos() {
    // Datos de prueba (luego vendrán del backend de tu amigo)
    const [eventos, setEventos] = useState([
        { id: 1, titulo: "Concierto de Rock", eslogan: "¡Vuelve el ruido!" },
        { id: 2, titulo: "Feria Gastronómica", eslogan: "Sabores del mundo" }
    ]);

    const cargarEventos = async () => {
        try {
            const res = await api.get('/eventos');
            setEventos(res.data); // Ahora sí funcionará porque 'eventos' es un estado
        } catch (error) {
            console.error("Error cargando eventos:", error);
            alert("No se pudo conectar con el backend de tu amigo");
        }
    };
    useEffect(() => {
        //cargarEventos(); // Descomenta esto cuando el backend de tu amigo esté listo
    }, []);

    return (
        <div className="contenedor-eventos">
            <h2>Próximos Eventos en Chostito</h2>
            <button onClick={cargarEventos}>Actualizar Lista</button>
            <div className="grid-eventos">
                {eventos.map((evento) => (
                    <div key={evento.id} style={{ border: '1px solid #722ed1', padding: '10px', margin: '10px', borderRadius: '8px' }}>
                        <h3>{evento.titulo}</h3>
                        <p><i>{evento.eslogan}</i></p>
                        <button>Ver detalles</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ListaEventos;