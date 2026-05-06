// src/ListaEventos.jsx
import React from 'react';

function ListaEventos() {
    // Datos de prueba (luego vendrán del backend de tu amigo)
    const eventos = [
        { id: 1, titulo: "Concierto de Rock", eslogan: "¡Vuelve el ruido!" },
        { id: 2, titulo: "Feria Gastronómica", eslogan: "Sabores del mundo" }
    ];

    return (
        <div className="contenedor-eventos">
            <h2>Próximos Eventos en Chostito</h2>
            {eventos.map((evento) => (
                <div key={evento.id} style={{ border: '1px solid #722ed1', padding: '10px', margin: '10px', borderRadius: '8px' }}>
                    <h3>{evento.titulo}</h3>
                    <p><i>{evento.eslogan}</i></p>
                    <button>Ver detalles</button>
                </div>
            ))}
        </div>
    );
}

export default ListaEventos;