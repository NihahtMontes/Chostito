# 🎟️ Chostito - Plataforma de Gestión de Eventos

Chostito es una solución integral y moderna para la venta de entradas y gestión de eventos, diseñada con una estética de alto nivel y funcionalidades robustas tanto para usuarios finales como para organizadores.

## 🚀 Tecnologías Utilizadas

### Backend
- **C# / .NET 8 Web API**: Potente núcleo de procesamiento y API RESTful.
- **Entity Framework Core**: Gestión eficiente de la base de datos SQL Server.
- **JWT (JSON Web Tokens)**: Seguridad avanzada para autenticación de usuarios.
- **MailKit / SMTP**: Sistema integrado de notificaciones y recuperación de cuentas vía Gmail.
- **Swagger / OpenAPI**: Documentación interactiva de la API para desarrolladores.

### Frontend (Web)
- **React.js**: Biblioteca principal para una interfaz reactiva y rápida.
- **Tailwind CSS**: Estilizado personalizado con un enfoque en *Glassmorphism* y diseño oscuro premium.
- **React Router**: Navegación fluida entre secciones.
- **Axios**: Comunicación eficiente con el Backend.
- **html2canvas**: Generación dinámica de imágenes de facturas para descarga.

### App Móvil
- **React Native / Expo**: Aplicación híbrida de alto rendimiento.
- **Axios & Context API**: Sincronización de estado y datos con la nube.
- **Diseño Innovador**: Adaptación del sistema de diseño oscuro para dispositivos móviles.

## ✨ Características Innovadoras

1.  **Diseño Glassmorphism Premium**: Una interfaz visualmente impactante inspirada en tendencias modernas como las apps de Nike y Apple, utilizando transparencias sutiles, gradientes vibrantes y animaciones fluidas.
2.  **Sistema de Asientos VIP Gráfico**: Los usuarios pueden seleccionar sus asientos específicos en un mapa interactivo. Los organizadores pueden visualizar gráficamente qué asientos están ocupados en tiempo real.
3.  **Facturación Inteligente con Doble Formato**:
    - **Digital**: Facturas HTML enriquecidas enviadas automáticamente al correo tras la compra.
    - **Imagen**: Capacidad de descargar la factura como una imagen estilizada directamente desde la web.
4.  **Recuperación Segura por Token**: Flujo de seguridad basado en códigos de 6 dígitos enviados por correo electrónico para el restablecimiento de contraseñas.
5.  **Dashboard de Ganancias**: Panel administrativo con métricas financieras claras, visualización de ventas por categoría y gestión total de usuarios y lugares.
6.  **Validación de QR**: Cada entrada incluye un código QR único que puede ser escaneado por los organizadores para validar el acceso al evento.

## 🛠️ Cómo abrir Swagger (Documentación de API)

Para ver y probar los endpoints de la API directamente desde el navegador:

1.  Asegúrate de que el backend esté ejecutándose (`dotnet run`).
2.  Abre tu navegador y dirígete a: `http://localhost:5027/swagger`
3.  Desde allí podrás ver todos los controladores de Usuarios, Eventos, Reservas, Pagos, etc., y probar las peticiones en vivo.

---
*Hecho con ♥ por el equipo de Chostito.*
