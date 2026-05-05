# 🎫 Chostito — Sistema de Venta de Entradas

> Sistema multiplataforma con arquitectura Cliente-Servidor. Backend en ASP.NET Core Web API, cliente web en React + Vite y cliente móvil en React Native + Expo. Inspirado en plataformas como TodoTix y Ticketek.

---

## 📑 Tabla de Contenidos

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Autenticación JWT](#5-autenticación-jwt)
6. [API REST — Referencia Completa](#6-api-rest--referencia-completa)
7. [Flujos de Negocio](#7-flujos-de-negocio)
8. [Máquinas de Estado](#8-máquinas-de-estado)
9. [Setup del Backend](#9-setup-del-backend)
10. [Credenciales de Prueba](#10-credenciales-de-prueba)
11. [Guía: Cliente Web React + Vite](#11-guía-cliente-web-react--vite)
12. [Guía: Cliente Móvil React Native + Expo](#12-guía-cliente-móvil-react-native--expo)

---

## 1. Resumen del Proyecto

**Chostito** es una plataforma de venta de entradas para eventos que permite:

- **Admin**: gestionar categorías, lugares, usuarios y ver estadísticas globales
- **Organizador**: crear eventos con imagen, eslogan, descripción, configurar tipos de entrada (VIP, General, Platea), ver ventas y escanear QR de entradas
- **Cliente**: explorar eventos, filtrar por categoría/fecha, marcar favoritos, comprar entradas de múltiples eventos en una sola reserva, pagar por QR, ver entradas con código QR

El sistema simula el pago mediante código QR: al crear una reserva se genera un código de transacción, el usuario simula el pago y la reserva se confirma.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | ASP.NET Core Web API | .NET 10 |
| **ORM** | Entity Framework Core | 10.0.7 |
| **Base de datos** | SQL Server | 2022+ |
| **Auth** | JWT Bearer + BCrypt | 10.0.6 / 4.0.3 |
| **Documentación** | OpenAPI (nativo .NET 10) | — |
| **Web** | React + Vite + Tailwind | 19.2 / 8.0 / 3.4 |
| **Web Router** | React Router | 7.14 |
| **Mobile** | React Native + Expo | 0.79 / SDK 55 |
| **Mobile Nav** | React Navigation | 7 |
| **Mobile QR** | expo-camera + react-native-qrcode-svg | — |
| **Mobile Storage** | expo-secure-store | — |

---

## 3. Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────┐
│              BACKEND (ASP.NET Core 10)               │
│                                                      │
│  Controllers  →  Services  →  EF Core  →  SQL Server │
│  (HTTP)          (Lógica)      (DB)       (Datos)    │
│                                                      │
│  JWT Auth + BCrypt + CORS + File Upload              │
└──────────────────────┬───────────────────────────────┘
                       │ REST API (JSON)
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌───────────┐
   │  Web    │   │  Mobile  │   │  Swagger  │
   │ Vite 8  │   │ Expo 55  │   │  /openapi │
   │ React 19│   │ RN 0.79  │   │           │
   └─────────┘   └──────────┘   └───────────┘
```

### Principios de diseño

- **Backend pesado**: toda la lógica de negocio, validaciones y reglas viven en la API
- **Clientes ligeros**: web y mobile solo renderizan UI y consumen la API
- **Código compartido**: las funciones de API, hooks de auth, utilidades y tema visual se comparten entre web y mobile
- **Seguridad en el backend**: JWT con roles, validaciones server-side, hash de passwords con BCrypt

---

## 4. Modelo de Datos

### Diagrama ER

```
CATEGORIA (1) ────→ (N) EVENTO (N) ←──── (1) LUGAR
                         │   │
             FAVORITO ←──┘   │
             (N:M explícita) │
                         │   │
                   (N) ┌─┘   └── (1)
               ENTRADA            USUARIO (organizador)
           (Tipo, Precio)         │
               │                  │
               │ (N)              │ (1) como cliente
               └──→ RESERVA ←─────┘
                     │
                     └──→ PAGO (1:1)
```

### Tabla 1: `Usuarios`

| Columna | Tipo | Nullable | Constraint |
|---------|------|----------|------------|
| Id | INT | No | PK, Identity |
| Nombre | NVARCHAR(100) | No | — |
| Email | NVARCHAR(150) | No | **UNIQUE** |
| PasswordHash | NVARCHAR(MAX) | No | — |
| Telefono | NVARCHAR(50) | Sí | — |
| Rol | NVARCHAR(20) | No | 'Admin', 'Organizador', 'Cliente' |
| FechaRegistro | DATETIME2 | No | DEFAULT GETUTCDATE() |

### Tabla 2: `Categorias`

| Columna | Tipo | Nullable |
|---------|------|----------|
| Id | INT | No, PK |
| Nombre | NVARCHAR(50) | No |
| Descripcion | NVARCHAR(500) | Sí |
| Icono | NVARCHAR(10) | Sí |

### Tabla 3: `Lugares`

| Columna | Tipo | Nullable |
|---------|------|----------|
| Id | INT | No, PK |
| Nombre | NVARCHAR(100) | No |
| Direccion | NVARCHAR(200) | No |
| Pais | NVARCHAR(50) | No |
| Ciudad | NVARCHAR(50) | No |
| Ambiente | NVARCHAR(50) | No |
| CapacidadTotal | INT | No |
| ImagenUrl | NVARCHAR(500) | Sí |

### Tabla 4: `Eventos`

| Columna | Tipo | Nullable | FK |
|---------|------|----------|----|
| Id | INT | No, PK | — |
| Titulo | NVARCHAR(200) | No | — |
| Eslogan | NVARCHAR(300) | No | — |
| Descripcion | NVARCHAR(MAX) | No | — |
| Fecha | DATETIME2 | No | — |
| Hora | TIME | No | — |
| ImagenUrl | NVARCHAR(500) | Sí | — |
| Estado | NVARCHAR(20) | No | 'Borrador', 'Publicado', 'Cancelado', 'Finalizado' |
| FechaCreacion | DATETIME2 | No | — |
| IdCategoria | INT | No | FK → Categorias(Id), Restrict |
| IdOrganizador | INT | No | FK → Usuarios(Id), Restrict |
| IdLugar | INT | No | FK → Lugares(Id), Restrict |

### Tabla 5: `Reservas`

| Columna | Tipo | Nullable | FK |
|---------|------|----------|----|
| Id | INT | No, PK | — |
| FechaReserva | DATETIME2 | No | — |
| Total | DECIMAL(10,2) | No | — |
| CantidadEntradas | INT | No | — |
| Estado | NVARCHAR(20) | No | 'Pendiente', 'Confirmada', 'Cancelada' |
| IdUsuario | INT | No | FK → Usuarios(Id), Cascade |

### Tabla 6: `Entradas`

| Columna | Tipo | Nullable | FK |
|---------|------|----------|----|
| Id | INT | No, PK | — |
| Tipo | NVARCHAR(30) | No | 'VIP', 'General', 'Platea', 'Palco', 'Campo' |
| Precio | DECIMAL(10,2) | No | — |
| CodigoQR | NVARCHAR(36) | No | GUID único |
| Estado | NVARCHAR(20) | No | 'Activa', 'Usada', 'Cancelada' |
| IdReserva | INT | Sí | FK → Reservas(Id), Cascade |
| IdEvento | INT | No | FK → Eventos(Id), Restrict |

### Tabla 7: `Pagos`

| Columna | Tipo | Nullable | FK |
|---------|------|----------|----|
| Id | INT | No, PK | — |
| Monto | DECIMAL(10,2) | No | — |
| MetodoPago | NVARCHAR(30) | No | 'QR', 'Tarjeta', 'Transferencia', 'Efectivo' |
| Estado | NVARCHAR(20) | No | 'Pendiente', 'Completado', 'Rechazado', 'Reembolsado' |
| FechaPago | DATETIME2 | Sí | — |
| CodigoTransaccion | NVARCHAR(36) | No | GUID único |
| IdReserva | INT | No | FK → Reservas(Id), Cascade, **UNIQUE (1:1)** |

### Tabla 8: `Favoritos`

| Columna | Tipo | Nullable | FK |
|---------|------|----------|----|
| Id | INT | No, PK | — |
| IdUsuario | INT | No | FK → Usuarios(Id), Cascade |
| IdEvento | INT | No | FK → Eventos(Id), Cascade |
| FechaAgregado | DATETIME2 | No | — |
| *(IdUsuario, IdEvento)* | — | — | **UNIQUE** |

### Relaciones

| Relación | Tipo | Descripción |
|----------|------|-------------|
| Categoria → Evento | 1:N | Una categoría tiene muchos eventos |
| Lugar → Evento | 1:N | Un lugar aloja muchos eventos |
| Usuario(Org) → Evento | 1:N | Un organizador crea muchos eventos |
| Evento → Entrada | 1:N | Un evento tiene muchas entradas |
| Usuario(Cliente) → Reserva | 1:N | Un cliente hace muchas reservas |
| Reserva → Entrada | 1:N | Una reserva contiene muchas entradas |
| Reserva → Pago | 1:1 | Cada reserva tiene un único pago |
| Usuario ↔ Evento (Favoritos) | N:M | Un usuario puede tener muchos favoritos, un evento puede ser favorito de muchos |

---

## 5. Autenticación JWT

### Flujo completo

```
┌──────────┐                          ┌──────────┐
│  CLIENTE │                          │  BACKEND │
└────┬─────┘                          └────┬─────┘
     │                                     │
     │ POST /api/auth/register             │
     │ {nombre, email, password, rol}     │
     │────────────────────────────────────▶│
     │                                     │ Hash con BCrypt
     │                                     │ Guardar en DB
     │ 200 {token, id, nombre, email, rol} │
     │◀────────────────────────────────────│
     │                                     │
     │ Guardar token en:                   │
     │  Web: localStorage                  │
     │  Mobile: expo-secure-store          │
     │                                     │
     │ ┌─────────────────────────────┐     │
     │ │ Todas las peticiones:       │     │
     │ │ Header: Authorization:      │     │
     │ │   Bearer <token>            │     │
     │ └─────────────────────────────┘     │
     │────────────────────────────────────▶│
     │                                     │
     │                                     │ Validar JWT:
     │                                     │  - Firma (HMAC-SHA256)
     │                                     │  - Expiración (7 días)
     │                                     │  - Issuer / Audience
     │                                     │  - Claims: id, email, rol
     │                                     │
     │ 200 {datos} o 401 No autorizado    │
     │◀────────────────────────────────────│
```

### Claims del JWT

| Claim | Valor | Ejemplo |
|-------|-------|---------|
| `nameid` | ID del usuario | `"3"` |
| `email` | Email del usuario | `"juan@chostito.com"` |
| `name` | Nombre del usuario | `"Juan Perez"` |
| `role` | Rol del usuario | `"Cliente"` |

### Roles y permisos

| Endpoint | Admin | Organizador | Cliente | Público |
|----------|-------|-------------|---------|---------|
| GET /api/categorias | ✅ | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /api/categorias | ✅ | ❌ | ❌ | ❌ |
| GET /api/lugares | ✅ | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /api/lugares | ✅ | ❌ | ❌ | ❌ |
| GET /api/eventos | ✅ | ✅ | ✅ | ✅ |
| POST/PUT/DELETE /api/eventos | ✅ | ✅ (solo propios) | ❌ | ❌ |
| GET /api/eventos/{id}/entradas | ✅ | ✅ | ✅ | ✅ |
| POST /api/eventos/{id}/entradas | ✅ | ✅ (solo propios) | ❌ | ❌ |
| POST /api/reservas | ✅ | ❌ | ✅ | ❌ |
| GET /api/reservas/mis-reservas | ✅ | ❌ | ✅ | ❌ |
| PUT /api/reservas/{id}/cancelar | ✅ | ❌ | ✅ | ❌ |
| POST /api/pagos/{id}/pagar | ✅ | ❌ | ✅ | ❌ |
| GET /api/favoritos | ✅ | ❌ | ✅ | ❌ |
| GET /api/dashboard/stats | ✅ | ❌ | ❌ | ❌ |
| POST /api/dashboard/entradas/escanear | ✅ | ✅ | ❌ | ❌ |

### Configuración JWT (appsettings.json)

```json
{
  "Jwt": {
    "Key": "TuClaveSecretaDeAlMenos32CaracteresAqui123",
    "Issuer": "ChostitoAPI",
    "Audience": "ChostitoClients"
  }
}
```

**Importante**: La clave debe tener al menos 32 caracteres para HMAC-SHA256. En producción, usar variable de entorno.

---

## 6. API REST — Referencia Completa

> Base URL: `http://localhost:5000/api` (o el puerto configurado)

### 6.1 Auth

#### POST `/api/auth/register`

**Body:**
```json
{
  "nombre": "Maria Lopez",
  "email": "maria@chostito.com",
  "password": "mariapass123",
  "telefono": "555-1234",
  "rol": "Cliente"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 4,
  "nombre": "Maria Lopez",
  "email": "maria@chostito.com",
  "rol": "Cliente",
  "fechaRegistro": "2026-05-05T10:30:00Z"
}
```

**Response 400:**
```json
{ "message": "El email ya está registrado" }
```

#### POST `/api/auth/login`

**Body:**
```json
{
  "email": "admin@chostito.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": 1,
  "nombre": "Admin Chostito",
  "email": "admin@chostito.com",
  "rol": "Admin",
  "fechaRegistro": "2026-05-05T00:00:00Z"
}
```

**Response 401:**
```json
{ "message": "Email o contraseña incorrectos" }
```

---

### 6.2 Categorías

#### GET `/api/categorias`
**Auth:** Público
**Response 200:**
```json
[
  { "id": 1, "nombre": "Concierto", "descripcion": "Shows musicales en vivo", "icono": "🎵" },
  { "id": 2, "nombre": "Teatro", "descripcion": "Obras de teatro y musicales", "icono": "🎭" }
]
```

#### POST `/api/categorias` — **Admin**
**Body:**
```json
{ "nombre": "Festival", "descripcion": "Festivales al aire libre", "icono": "🎪" }
```

#### PUT `/api/categorias/{id}` — **Admin**
**Body:** `{ "id": 1, "nombre": "Concierto Rock", "descripcion": "...", "icono": "🎸" }`

#### DELETE `/api/categorias/{id}` — **Admin**

---

### 6.3 Lugares

#### GET `/api/lugares`
**Auth:** Público
**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "Estadio Monumental",
    "direccion": "Av. Figueroa Alcorta 7597",
    "pais": "Argentina",
    "ciudad": "Buenos Aires",
    "ambiente": "Estadio",
    "capacidadTotal": 70000,
    "imagenUrl": null
  }
]
```

#### POST `/api/lugares` — **Admin**
**Body:**
```json
{
  "nombre": "Arena Luna Park",
  "direccion": "Bouchard 145",
  "pais": "Argentina",
  "ciudad": "Buenos Aires",
  "ambiente": "Arena",
  "capacidadTotal": 8000
}
```

#### PUT `/api/lugares/{id}` — **Admin**
#### DELETE `/api/lugares/{id}` — **Admin**

---

### 6.4 Eventos

#### GET `/api/eventos`
**Auth:** Público
**Query params:** `categoriaId`, `fechaDesde`, `fechaHasta`, `busqueda`, `estado`

**Ejemplo:** `GET /api/eventos?categoriaId=1&busqueda=rock&estado=Publicado`

**Response 200:**
```json
[
  {
    "id": 1,
    "titulo": "Rock Fest 2026",
    "eslogan": "La noche mas epica del rock",
    "descripcion": "Las mejores bandas...",
    "fecha": "2026-06-15T00:00:00",
    "hora": "20:00:00",
    "imagenUrl": "/uploads/abc-123.jpg",
    "estado": "Publicado",
    "categoria": "Concierto",
    "organizador": "Productora Rock",
    "lugar": "Estadio Monumental",
    "ciudad": "Buenos Aires",
    "pais": "Argentina"
  }
]
```

#### GET `/api/eventos/{id}`
**Auth:** Público

#### POST `/api/eventos` — **Organizador, Admin**
**Content-Type:** `multipart/form-data`

**Form fields:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| titulo | string | Sí |
| eslogan | string | Sí |
| descripcion | string | Sí |
| fecha | date | Sí |
| hora | time | Sí |
| idCategoria | int | Sí |
| idLugar | int | Sí |
| estado | string | No (default: "Borrador") |
| imagen | file | No |

#### PUT `/api/eventos/{id}` — **Organizador (solo propios), Admin**
**Content-Type:** `multipart/form-data` (campos opcionales, solo los que se quieren actualizar)

#### DELETE `/api/eventos/{id}` — **Organizador (solo propios), Admin**

#### GET `/api/eventos/mis-eventos` — **Organizador, Admin**
Devuelve los eventos del organizador autenticado.

#### GET `/api/eventos/{id}/entradas`
**Auth:** Público

Devuelve los tipos de entrada disponibles agrupados:
```json
[
  { "tipo": "VIP", "precio": 150.00, "cantidadDisponible": 498 },
  { "tipo": "General", "precio": 80.00, "cantidadDisponible": 1999 }
]
```

#### POST `/api/eventos/{id}/entradas` — **Organizador, Admin**
**Body:**
```json
{ "tipo": "VIP", "precio": 150.00, "cantidad": 500 }
```
Crea 500 entradas individuales con QR único cada una.

---

### 6.5 Reservas

#### POST `/api/reservas` — **Cliente**
**Body:**
```json
{
  "items": [
    { "idEvento": 1, "tipo": "VIP", "cantidad": 2 },
    { "idEvento": 1, "tipo": "General", "cantidad": 1 }
  ]
}
```

**Response 200:**
```json
{
  "id": 1,
  "fechaReserva": "2026-05-05T14:30:00Z",
  "total": 380.00,
  "cantidadEntradas": 3,
  "estado": "Pendiente",
  "entradas": [
    { "id": 1, "tipo": "VIP", "precio": 150.00, "codigoQR": "a1b2c3d4-...", "estado": "Activa", "evento": "Rock Fest 2026", "fechaEvento": "2026-06-15" },
    { "id": 2, "tipo": "VIP", "precio": 150.00, "codigoQR": "e5f6g7h8-...", "estado": "Activa", "evento": "Rock Fest 2026", "fechaEvento": "2026-06-15" },
    { "id": 3, "tipo": "General", "precio": 80.00, "codigoQR": "i9j0k1l2-...", "estado": "Activa", "evento": "Rock Fest 2026", "fechaEvento": "2026-06-15" }
  ],
  "pago": {
    "id": 1,
    "monto": 380.00,
    "metodoPago": "QR",
    "estado": "Pendiente",
    "fechaPago": null,
    "codigoTransaccion": "x1y2z3a4-..."
  }
}
```

**Response 400:**
```json
{ "message": "Solo hay 1 entradas de tipo VIP disponibles para Rock Fest 2026" }
```

#### GET `/api/reservas/mis-reservas` — **Autenticado**
Devuelve todas las reservas del usuario autenticado.

#### GET `/api/reservas/{id}` — **Dueño o Admin**

#### PUT `/api/reservas/{id}/cancelar` — **Dueño**
Cancela la reserva, sus entradas y el pago asociado.

#### GET `/api/reservas/evento/{eventoId}` — **Organizador, Admin**
Devuelve todas las reservas de un evento específico.

---

### 6.6 Pagos

#### GET `/api/pagos/reserva/{reservaId}` — **Dueño o Admin**
```json
{
  "id": 1,
  "monto": 380.00,
  "metodoPago": "QR",
  "estado": "Pendiente",
  "fechaPago": null,
  "codigoTransaccion": "x1y2z3a4-..."
}
```

#### POST `/api/pagos/{reservaId}/pagar` — **Dueño**
**Body:**
```json
{ "metodoPago": "QR" }
```
Simula el pago. Cambia estado a "Completado", confirma la reserva y activa las entradas.

**Response 200:**
```json
{
  "message": "Pago completado exitosamente",
  "codigoTransaccion": "x1y2z3a4-..."
}
```

#### POST `/api/pagos/{reservaId}/qr` — **Dueño**
Genera los datos del QR de pago.

**Response 200:**
```json
{
  "codigoTransaccion": "x1y2z3a4-...",
  "monto": 380.00,
  "metodoPago": "QR",
  "estado": "Pendiente",
  "qrData": "CHOSTITO|x1y2z3a4-...|380.00|1"
}
```

#### PUT `/api/pagos/{id}/estado` — **Admin**
**Body:** `"Reembolsado"` o `"Rechazado"`

---

### 6.7 Favoritos

#### GET `/api/favoritos` — **Autenticado**
```json
[
  {
    "id": 1,
    "fechaAgregado": "2026-05-05T12:00:00Z",
    "evento": {
      "id": 1,
      "titulo": "Rock Fest 2026",
      "eslogan": "La noche mas epica del rock",
      "fecha": "2026-06-15T00:00:00",
      "imagenUrl": "/uploads/abc.jpg",
      "estado": "Publicado",
      "categoria": "Concierto",
      "lugar": "Estadio Monumental",
      "ciudad": "Buenos Aires"
    }
  }
]
```

#### POST `/api/favoritos/{eventoId}` — **Autenticado**

#### DELETE `/api/favoritos/{eventoId}` — **Autenticado**

---

### 6.8 Dashboard

#### GET `/api/dashboard/stats` — **Admin**
```json
{
  "totalEventos": 5,
  "totalReservas": 23,
  "totalRecaudado": 15400.00,
  "totalUsuarios": 150,
  "entradasVendidas": 89
}
```

#### GET `/api/dashboard/mis-ventas` — **Organizador, Admin**
```json
[
  {
    "id": 1,
    "titulo": "Rock Fest 2026",
    "fecha": "2026-06-15T00:00:00",
    "estado": "Publicado",
    "entradasVendidas": 450,
    "entradasTotales": 2800,
    "totalRecaudado": 52000.00
  }
]
```

#### POST `/api/dashboard/entradas/escanear` — **Organizador, Admin**
**Body:**
```json
{ "codigoQR": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
```

**Response 200 (éxito):**
```json
{
  "message": "Entrada validada exitosamente",
  "tipo": "VIP",
  "evento": "Rock Fest 2026",
  "fecha": "2026-06-15T00:00:00"
}
```

**Response 400:**
```json
{ "message": "Entrada ya fue utilizada" }
```

---

## 7. Flujos de Negocio

### 7.1 Flujo: Admin crea la infraestructura

```
1. Admin se loguea
2. Crea categorias (Concierto, Teatro, Deporte, etc.)
   POST /api/categorias { nombre, descripcion, icono }
3. Crea lugares (estadios, teatros, auditorios)
   POST /api/lugares { nombre, direccion, pais, ciudad, ambiente, capacidad }
```

### 7.2 Flujo: Organizador crea y publica un evento

```
1. Organizador se loguea
2. Crea evento con imagen
   POST /api/eventos (multipart/form-data)
   → estado: "Borrador"
3. Agrega tipos de entrada
   POST /api/eventos/{id}/entradas { tipo: "VIP", precio: 150, cantidad: 500 }
   POST /api/eventos/{id}/entradas { tipo: "General", precio: 80, cantidad: 2000 }
4. Publica el evento
   PUT /api/eventos/{id} { estado: "Publicado" }
```

### 7.3 Flujo: Cliente compra entradas

```
1. Cliente se registra y loguea
2. Explora eventos (GET /api/eventos)
3. Ve detalle de un evento (GET /api/eventos/{id})
4. Ve tipos de entrada disponibles (GET /api/eventos/{id}/entradas)
5. Selecciona entradas y crea reserva
   POST /api/reservas { items: [{ idEvento: 1, tipo: "VIP", cantidad: 2 }] }
   → Reserva creada con estado "Pendiente"
   → Entradas asignadas a la reserva
   → Pago creado con estado "Pendiente"
6. Genera QR de pago
   POST /api/pagos/{reservaId}/qr
7. Simula el pago
   POST /api/pagos/{reservaId}/pagar { metodoPago: "QR" }
   → Pago → "Completado"
   → Reserva → "Confirmada"
   → Entradas → "Activas"
8. Ve sus entradas con QR (GET /api/reservas/{id})
```

### 7.4 Flujo: Organizador valida entrada en el evento

```
1. Organizador abre pantalla de escaneo
2. Escanea QR de la entrada (camera)
3. Envia codigo al backend
   POST /api/dashboard/entradas/escanear { codigoQR: "..." }
4. Backend valida:
   → Entrada existe? → Sí
   → Estado == "Activa"? → Sí
   → Reserva confirmada? → Sí
   → Marca entrada como "Usada"
5. Muestra resultado: "Entrada válida — VIP — Rock Fest 2026"
```

---

## 8. Máquinas de Estado

### Reserva
```
[Pendiente] ──pago completado──→ [Confirmada]
    │
    └──cancelar──→ [Cancelada]
```

### Pago
```
[Pendiente] ──simular pago──→ [Completado]
    │                              │
    ├──rechazar──→ [Rechazado]     └──reembolsar──→ [Reembolsado]
```

### Entrada
```
[Activa] ──escanear QR──→ [Usada]
   │
   └──reserva cancelada──→ [Cancelada]
```

### Evento
```
[Borrador] ──publicar──→ [Publicado]
   │                         │
   └──cancelar──→ [Cancelado] └──finalizar──→ [Finalizado]
```

---

## 9. Setup del Backend

### Requisitos
- .NET 10 SDK
- SQL Server 2022+ (o SQL Server Express LocalDB)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/NihahtMontes/Chostito.git
cd Chostito/backend

# 2. Restaurar paquetes
dotnet restore

# 3. Configurar la conexión a la base de datos
# Editar appsettings.json y ajustar la connection string:
# "DefaultConnection": "Server=localhost;Database=ChostitoDb;Trusted_Connection=True;TrustServerCertificate=True;"

# 4. Aplicar migraciones (crea la base de datos y tablas)
dotnet ef database update

# 5. Ejecutar la API
dotnet run

# La API estará disponible en:
# HTTPS: https://localhost:5001
# HTTP:  http://localhost:5000
# OpenAPI: http://localhost:5000/openapi/v1.json
```

### Estructura del proyecto backend

```
backend/
├── Controllers/          # 8 controllers (Auth, Categorias, Lugares, Eventos, Reservas, Pagos, Favoritos, Dashboard)
├── Models/               # 8 entidades EF Core
├── DTOs/                 # Request/Response DTOs
├── Services/             # AuthService (JWT + BCrypt)
├── Data/                 # ChostitoDbContext, SeedData, DbContextFactory
├── Migrations/           # Migraciones EF Core
├── wwwroot/uploads/      # Imágenes de eventos
├── Program.cs            # Configuración de la app
└── appsettings.json      # Connection string + JWT config
```

---

## 10. Credenciales de Prueba

El SeedData crea automáticamente estos usuarios al iniciar la API por primera vez:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@chostito.com` | `admin123` |
| Organizador | `org@chostito.com` | `cliente123` |
| Cliente | `juan@chostito.com` | `cliente123` |

También se crean 4 categorías, 3 lugares y 3 eventos de ejemplo.

---

## 11. Guía: Cliente Web React + Vite

### 11.1 Stack del Frontend

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| Vite | 8.0 | Build tool + dev server |
| React | 19.2 | UI library |
| React Router | 7.14 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first CSS |
| Axios | 1.7 | HTTP client |
| vite-plugin-pwa | — | Progressive Web App |

### 11.2 Estructura de Carpetas

```
web/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/
    │   ├── client.js          # Axios instance + JWT interceptor
    │   ├── auth.js            # login(), register()
    │   ├── eventos.js         # CRUD eventos + entradas
    │   ├── reservas.js        # crearReserva(), misReservas(), cancelar()
    │   ├── pagos.js           # simularPago(), generarQR()
    │   ├── categorias.js
    │   ├── lugares.js
    │   └── favoritos.js
    ├── hooks/
    │   └── useAuth.js         # Auth context hook
    ├── context/
    │   └── AuthContext.jsx    # AuthProvider + estado global
    ├── pages/
    │   ├── Home.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── EventoDetalle.jsx
    │   ├── Checkout.jsx
    │   ├── MisReservas.jsx
    │   ├── Favoritos.jsx
    │   ├── Perfil.jsx
    │   ├── AdminDashboard.jsx
    │   ├── AdminMisEventos.jsx
    │   ├── AdminCrearEvento.jsx
    │   ├── AdminEscanearQR.jsx
    │   └── NotFound.jsx
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Footer.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── EventCard.jsx
    │   ├── TicketCard.jsx
    │   ├── SearchBar.jsx
    │   ├── CategoryFilter.jsx
    │   ├── LoadingSpinner.jsx
    │   └── EmptyState.jsx
    └── utils/
        ├── formatters.js
        └── validators.js
```

### 11.3 Configuración Inicial

```bash
# 1. Crear proyecto Vite con React
npm create vite@latest web -- --template react
cd web

# 2. Instalar dependencias
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p

# 3. Configurar Tailwind (tailwind.config.js)
# 4. Configurar Vite (vite.config.js)
# 5. Agregar @tailwind directives en src/index.css
```

#### `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Chostito',
        short_name: 'Chostito',
        theme_color: '#6C5CE7',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'  // Evita CORS en desarrollo
    }
  }
})
```

#### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        secondary: '#00CEC9',
        success: '#00B894',
        danger: '#D63031',
        warning: '#FDCB6E',
        dark: '#2D3436',
        light: '#F8F9FA',
      }
    }
  },
  plugins: []
}
```

### 11.4 Cliente HTTP (`src/api/client.js`)

```js
import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: adjunta JWT a cada request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: maneja errores 401 (token expirado)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
```

### 11.5 Servicios de API

#### `src/api/auth.js`

```js
import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then(r => r.data)

export const register = (data) =>
  client.post('/auth/register', data).then(r => r.data)
```

#### `src/api/eventos.js`

```js
import client from './client'

export const getEventos = (params = {}) =>
  client.get('/eventos', { params }).then(r => r.data)

export const getEvento = (id) =>
  client.get(`/eventos/${id}`).then(r => r.data)

export const getEntradasEvento = (id) =>
  client.get(`/eventos/${id}/entradas`).then(r => r.data)

export const crearEvento = (formData) =>
  client.post('/eventos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

export const actualizarEvento = (id, formData) =>
  client.put(`/eventos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

export const agregarEntradas = (eventoId, data) =>
  client.post(`/eventos/${eventoId}/entradas`, data).then(r => r.data)

export const misEventos = () =>
  client.get('/eventos/mis-eventos').then(r => r.data)
```

#### `src/api/reservas.js`

```js
import client from './client'

export const crearReserva = (items) =>
  client.post('/reservas', { items }).then(r => r.data)

export const misReservas = () =>
  client.get('/reservas/mis-reservas').then(r => r.data)

export const getReserva = (id) =>
  client.get(`/reservas/${id}`).then(r => r.data)

export const cancelarReserva = (id) =>
  client.put(`/reservas/${id}/cancelar`).then(r => r.data)
```

#### `src/api/pagos.js`

```js
import client from './client'

export const simularPago = (reservaId, metodoPago = 'QR') =>
  client.post(`/pagos/${reservaId}/pagar`, { metodoPago }).then(r => r.data)

export const generarQR = (reservaId) =>
  client.post(`/pagos/${reservaId}/qr`).then(r => r.data)

export const getPago = (reservaId) =>
  client.get(`/pagos/reserva/${reservaId}`).then(r => r.data)
```

#### `src/api/favoritos.js`

```js
import client from './client'

export const getFavoritos = () =>
  client.get('/favoritos').then(r => r.data)

export const agregarFavorito = (eventoId) =>
  client.post(`/favoritos/${eventoId}`).then(r => r.data)

export const eliminarFavorito = (eventoId) =>
  client.delete(`/favoritos/${eventoId}`).then(r => r.data)
```

### 11.6 Contexto de Autenticación

#### `src/context/AuthContext.jsx`

```jsx
import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### `src/hooks/useAuth.js`

```js
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}
```

#### `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex justify-center p-8">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />

  return <Outlet />
}
```

### 11.7 Router Principal

#### `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import EventoDetalle from '@/pages/EventoDetalle'
import Checkout from '@/pages/Checkout'
import MisReservas from '@/pages/MisReservas'
import Favoritos from '@/pages/Favoritos'
import Perfil from '@/pages/Perfil'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminMisEventos from '@/pages/AdminMisEventos'
import AdminCrearEvento from '@/pages/AdminCrearEvento'
import AdminEscanearQR from '@/pages/AdminEscanearQR'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="min-h-screen bg-light">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/evento/:id" element={<EventoDetalle />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/mis-reservas" element={<MisReservas />} />
              <Route path="/favoritos" element={<Favoritos />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Admin', 'Organizador']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/eventos" element={<AdminMisEventos />} />
              <Route path="/admin/eventos/nuevo" element={<AdminCrearEvento />} />
              <Route path="/admin/escanear" element={<AdminEscanearQR />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

### 11.8 Pantallas — Guía de Implementación

#### Login (`src/pages/Login.jsx`)

```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as apiLogin } from '@/api/auth'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      login(data, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-dark text-center mb-2">Chostito</h1>
        <p className="text-gray-500 text-center mb-6">Inicia sesión para continuar</p>

        {error && <div className="bg-danger/10 text-danger p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
          className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-primary outline-none" />

        <input type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)} required
          className="w-full p-3 border border-gray-200 rounded-lg mb-6 focus:ring-2 focus:ring-primary outline-none" />

        <button type="submit" disabled={loading}
          className="w-full bg-primary text-white p-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>

        <p className="text-center mt-4 text-sm text-gray-500">
          ¿No tenés cuenta? <Link to="/register" className="text-primary font-semibold">Registrate</Link>
        </p>
      </form>
    </div>
  )
}
```

#### Home (`src/pages/Home.jsx`)

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEventos } from '@/api/eventos'
import { getCategorias } from '@/api/categorias'
import EventCard from '@/components/EventCard'
import SearchBar from '@/components/SearchBar'
import CategoryFilter from '@/components/CategoryFilter'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

export default function Home() {
  const [eventos, setEventos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    Promise.all([getEventos({ estado: 'Publicado' }), getCategorias()])
      .then(([ev, cat]) => { setEventos(ev); setCategorias(cat) })
      .finally(() => setLoading(false))
  }, [])

  const eventosFiltrados = eventos.filter(e => {
    if (filtroCategoria && e.categoria !== filtroCategoria) return false
    if (busqueda && !e.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-dark mb-6">Próximos Eventos</h1>
      <SearchBar value={busqueda} onChange={setBusqueda} />
      <CategoryFilter categorias={categorias} selected={filtroCategoria}
        onSelect={setFiltroCategoria} />

      {eventosFiltrados.length === 0 ? (
        <EmptyState message="No se encontraron eventos" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {eventosFiltrados.map(ev => (
            <Link key={ev.id} to={`/evento/${ev.id}`}>
              <EventCard evento={ev} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Evento Detalle (`src/pages/EventoDetalle.jsx`)

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvento, getEntradasEvento } from '@/api/eventos'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function EventoDetalle() {
  const { id } = useParams()
  const [evento, setEvento] = useState(null)
  const [entradas, setEntradas] = useState([])
  const [cantidades, setCantidades] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([getEvento(id), getEntradasEvento(id)])
      .then(([ev, ent]) => {
        setEvento(ev)
        setEntradas(ent)
        const init = {}
        ent.forEach(e => init[e.tipo] = 0)
        setCantidades(init)
      })
      .finally(() => setLoading(false))
  }, [id])

  const total = entradas.reduce((sum, e) => sum + e.precio * (cantidades[e.tipo] || 0), 0)
  const totalItems = Object.values(cantidades).reduce((s, c) => s + c, 0)

  if (loading) return <LoadingSpinner />
  if (!evento) return <div className="p-8 text-center">Evento no encontrado</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {evento.imagenUrl && (
        <img src={`http://localhost:5000${evento.imagenUrl}`} alt={evento.titulo}
          className="w-full h-64 object-cover rounded-2xl mb-6" />
      )}

      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
        {evento.categoria}
      </span>
      <h1 className="text-3xl font-bold text-dark">{evento.titulo}</h1>
      <p className="text-gray-500 italic mb-4">{evento.eslogan}</p>
      <p className="text-gray-600 mb-4">{evento.descripcion}</p>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div><span className="font-semibold">📅 Fecha:</span> {new Date(evento.fecha).toLocaleDateString()}</div>
        <div><span className="font-semibold">🕐 Hora:</span> {evento.hora.substring(0, 5)}</div>
        <div><span className="font-semibold">📍 Lugar:</span> {evento.lugar}</div>
        <div><span className="font-semibold">🌍 Ciudad:</span> {evento.ciudad}, {evento.pais}</div>
      </div>

      <h2 className="text-xl font-bold text-dark mb-4">Tipos de Entrada</h2>
      <div className="space-y-3 mb-6">
        {entradas.map((e, i) => (
          <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
            <div>
              <span className="font-semibold text-dark">{e.tipo}</span>
              <span className="text-gray-400 ml-2">({e.cantidadDisponible} disponibles)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">${e.precio}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCantidades(p => ({...p, [e.tipo]: Math.max(0, (p[e.tipo]||0) - 1)}))}
                  className="w-8 h-8 rounded-full bg-gray-100 font-bold hover:bg-gray-200">−</button>
                <span className="w-8 text-center font-semibold">{cantidades[e.tipo] || 0}</span>
                <button onClick={() => setCantidades(p => ({...p, [e.tipo]: Math.min(e.cantidadDisponible, (p[e.tipo]||0) + 1)}))}
                  className="w-8 h-8 rounded-full bg-primary text-white font-bold hover:bg-primary/90">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalItems > 0 && user && (
        <button onClick={() => {
          const items = entradas
            .filter(e => cantidades[e.tipo] > 0)
            .map(e => ({ idEvento: evento.id, tipo: e.tipo, cantidad: cantidades[e.tipo] }))
          localStorage.setItem('checkoutItems', JSON.stringify(items))
          navigate('/checkout')
        }} className="w-full bg-primary text-white p-4 rounded-xl font-bold text-lg hover:bg-primary/90">
          Comprar {totalItems} entradas — ${total}
        </button>
      )}

      {!user && (
        <button onClick={() => navigate('/login')}
          className="w-full bg-dark text-white p-4 rounded-xl font-bold hover:bg-dark/90">
          Inicia sesión para comprar
        </button>
      )}
    </div>
  )
}
```

#### Checkout (`src/pages/Checkout.jsx`)

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearReserva } from '@/api/reservas'
import { simularPago, generarQR } from '@/api/pagos'
import QRCode from 'qrcode.react'

export default function Checkout() {
  const [items, setItems] = useState([])
  const [reserva, setReserva] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [pagoCompletado, setPagoCompletado] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('checkoutItems')
    if (stored) setItems(JSON.parse(stored))
    else navigate('/')
  }, [])

  const handleCrearReserva = async () => {
    setLoading(true)
    try {
      const data = await crearReserva(items)
      setReserva(data)
      const qr = await generarQR(data.id)
      setQrData(qr)
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear reserva')
    } finally {
      setLoading(false)
    }
  }

  const handlePagar = async () => {
    setLoading(true)
    try {
      await simularPago(reserva.id, 'QR')
      setPagoCompletado(true)
      localStorage.removeItem('checkoutItems')
    } catch (err) {
      alert(err.response?.data?.message || 'Error al procesar pago')
    } finally {
      setLoading(false)
    }
  }

  if (pagoCompletado) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-success mb-2">¡Pago Exitoso!</h1>
        <p className="text-gray-500 mb-2">Transacción: {reserva.pago.codigoTransaccion}</p>
        <p className="text-gray-500 mb-6">Total: ${reserva.total}</p>
        <button onClick={() => navigate('/mis-reservas')}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
          Ver mis entradas
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-dark mb-6">Resumen de Compra</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>{item.tipo} x{item.cantidad}</span>
            <span className="font-semibold">Evento #{item.idEvento}</span>
          </div>
        ))}
      </div>

      {!reserva ? (
        <button onClick={handleCrearReserva} disabled={loading}
          className="w-full bg-primary text-white p-4 rounded-xl font-bold disabled:opacity-50">
          {loading ? 'Creando reserva...' : 'Crear Reserva'}
        </button>
      ) : !pagoCompletado ? (
        <>
          {qrData && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-4">
              <QRCode value={qrData.qrData} size={200} />
              <p className="text-sm text-gray-500 mt-2">{qrData.codigoTransaccion}</p>
              <p className="text-lg font-bold text-dark mt-1">${qrData.monto}</p>
            </div>
          )}
          <button onClick={handlePagar} disabled={loading}
            className="w-full bg-success text-white p-4 rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Procesando...' : 'Simular Pago QR'}
          </button>
        </>
      ) : null}
    </div>
  )
}
```

#### Mis Reservas (`src/pages/MisReservas.jsx`)

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { misReservas } from '@/api/reservas'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

const tabs = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada']

export default function MisReservas() {
  const [reservas, setReservas] = useState([])
  const [tab, setTab] = useState('Todas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    misReservas().then(setReservas).finally(() => setLoading(false))
  }, [])

  const filtradas = tab === 'Todas' ? reservas : reservas.filter(r => r.estado === tab)

  const badgeColor = { Pendiente: 'bg-warning', Confirmada: 'bg-success', Cancelada: 'bg-danger' }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-dark mb-4">Mis Reservas</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              tab === t ? 'bg-primary text-white' : 'bg-white text-gray-600'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? <EmptyState message="No hay reservas" /> : (
        <div className="space-y-4">
          {filtradas.map(r => (
            <Link key={r.id} to={`/mis-reservas/${r.id}`}
              className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-dark">{r.cantidadEntradas} entradas</p>
                  <p className="text-sm text-gray-500">{new Date(r.fechaReserva).toLocaleDateString()}</p>
                  {r.entradas?.map(e => (
                    <p key={e.id} className="text-sm text-gray-600">• {e.evento} — {e.tipo}</p>
                  ))}
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${badgeColor[r.estado]}`}>
                    {r.estado}
                  </span>
                  <p className="font-bold text-primary mt-1">${r.total}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 11.9 Componentes Reutilizables

#### EventCard (`src/components/EventCard.jsx`)

```jsx
export default function EventCard({ evento }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
      {evento.imagenUrl ? (
        <img src={`http://localhost:5000${evento.imagenUrl}`} alt={evento.titulo}
          className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-4xl">
          🎫
        </div>
      )}
      <div className="p-4">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
          {evento.categoria}
        </span>
        <h3 className="font-bold text-dark mt-2 truncate">{evento.titulo}</h3>
        <p className="text-sm text-gray-500 truncate">{evento.eslogan}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-gray-400">
            {new Date(evento.fecha).toLocaleDateString()}
          </span>
          <span className="text-sm text-gray-400">
            📍 {evento.ciudad}
          </span>
        </div>
      </div>
    </div>
  )
}
```

#### Navbar (`src/components/Navbar.jsx`)

```jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-bold text-primary">🎫 Chostito</Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/" className="text-gray-600 hover:text-primary text-sm">Eventos</Link>
              <Link to="/mis-reservas" className="text-gray-600 hover:text-primary text-sm">Mis Reservas</Link>
              <Link to="/favoritos" className="text-gray-600 hover:text-primary text-sm">Favoritos</Link>
              {(user.rol === 'Admin' || user.rol === 'Organizador') && (
                <Link to="/admin" className="text-gray-600 hover:text-primary text-sm">Admin</Link>
              )}
              <span className="text-sm text-gray-500">{user.nombre}</span>
              <button onClick={handleLogout} className="text-sm text-danger hover:underline">Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-primary text-sm">Iniciar Sesión</Link>
              <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-lg text-sm">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

### 11.10 Utilidades

#### `src/utils/formatters.js`

```js
export const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

export const formatPrecio = (precio) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(precio)

export const formatEstado = (estado) => {
  const map = {
    Pendiente: { label: 'Pendiente', color: 'warning' },
    Confirmada: { label: 'Confirmada', color: 'success' },
    Cancelada: { label: 'Cancelada', color: 'danger' },
    Activa: { label: 'Activa', color: 'success' },
    Usada: { label: 'Usada', color: 'gray' },
    Completado: { label: 'Completado', color: 'success' },
    Reembolsado: { label: 'Reembolsado', color: 'warning' }
  }
  return map[estado] || { label: estado, color: 'gray' }
}
```

#### `src/utils/validators.js`

```js
export const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const validarPassword = (pass) => pass.length >= 6
```

### 11.11 Ejecutar el frontend web

```bash
cd web
npm install
npm run dev
# Abre http://localhost:5173
```

---

## 12. Guía: Cliente Móvil React Native + Expo

### 12.1 Stack Mobile

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| Expo SDK | 55 | Framework React Native |
| React Native | 0.79 | UI nativa |
| React Navigation | 7 | Navegación (Stack + Tabs) |
| Axios | 1.7 | HTTP client (compartido con web) |
| expo-secure-store | — | Almacenamiento seguro de JWT |
| expo-camera | — | Escanear QR de entradas |
| expo-image | — | Renderizado rápido de imágenes |
| expo-image-picker | — | Seleccionar imagen para eventos |
| react-native-qrcode-svg | — | Generar QR de pago y entradas |
| expo-splash-screen | — | Splash screen al iniciar |

### 12.2 Estructura de Carpetas

```
mobile/
├── app.json                       # Config Expo (name, slug, icon, splash)
├── App.jsx                        # Entry point: NavigationContainer + AuthProvider
├── babel.config.js                # module-resolver para alias @/
├── metro.config.js                # Alias como en Vite
├── package.json
└── src/
    ├── api/                       ← 90% IDÉNTICO al web/src/api/
    │   ├── client.js              # Axios + SecureStore interceptor
    │   ├── auth.js
    │   ├── eventos.js
    │   ├── reservas.js
    │   ├── pagos.js
    │   ├── categorias.js
    │   ├── lugares.js
    │   └── favoritos.js
    ├── hooks/                     ← IDÉNTICO al web
    │   └── useAuth.js
    ├── context/                   ← IDÉNTICO al web
    │   └── AuthContext.jsx
    ├── navigation/
    │   ├── AppNavigator.jsx       # Stack principal condicionado por auth
    │   ├── AuthStack.jsx          # Login → Register
    │   ├── ClientTabs.jsx         # Home, Favoritos, Reservas, Perfil
    │   └── AdminTabs.jsx          # Dashboard, Eventos, Escanear
    ├── screens/
    │   ├── LoginScreen.jsx
    │   ├── RegisterScreen.jsx
    │   ├── HomeScreen.jsx
    │   ├── EventoDetalleScreen.jsx
    │   ├── CheckoutScreen.jsx
    │   ├── MisReservasScreen.jsx
    │   ├── ReservaDetalleScreen.jsx
    │   ├── FavoritosScreen.jsx
    │   ├── PerfilScreen.jsx
    │   ├── AdminDashboardScreen.jsx
    │   ├── AdminMisEventosScreen.jsx
    │   ├── AdminCrearEventoScreen.jsx
    │   └── AdminEscanearQRScreen.jsx
    ├── components/
    │   ├── EventCard.jsx
    │   ├── TicketCard.jsx
    │   ├── CategoryChip.jsx
    │   ├── SearchBar.jsx
    │   ├── QuantitySelector.jsx
    │   ├── LoadingSpinner.jsx
    │   ├── EmptyState.jsx
    │   └── BadgeEstado.jsx
    └── utils/
        ├── formatters.js          ← IDÉNTICO al web
        ├── validators.js          ← IDÉNTICO al web
        └── storage.js             # Wrapper de expo-secure-store
```

### 12.3 Qué se comparte entre Web y Mobile

| Módulo | Web | Mobile | Mismo código? |
|--------|-----|--------|---------------|
| `api/auth.js` | ✅ | ✅ | ✅ Sí |
| `api/eventos.js` | ✅ | ✅ | ✅ Sí |
| `api/reservas.js` | ✅ | ✅ | ✅ Sí |
| `api/pagos.js` | ✅ | ✅ | ✅ Sí |
| `api/favoritos.js` | ✅ | ✅ | ✅ Sí |
| `hooks/useAuth.js` | ✅ | ✅ | ✅ Sí |
| `context/AuthContext.jsx` | ✅ | ✅ | ✅ Sí |
| `utils/formatters.js` | ✅ | ✅ | ✅ Sí |
| `utils/validators.js` | ✅ | ✅ | ✅ Sí |
| `api/client.js` | localStorage | SecureStore | ⚠️ Similar, cambia storage |
| `components/*` | `<div>`, `<img>` | `<View>`, `<Image>` | ❌ Diferente |
| Navegación | React Router | React Navigation | ❌ Diferente |

### 12.4 Configuración Inicial

```bash
# 1. Crear proyecto Expo
npx create-expo-app@latest chostito-mobile --template blank
cd chostito-mobile

# 2. Instalar dependencias de navegación
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# 3. Instalar utilidades nativas
npx expo install expo-secure-store expo-camera expo-image expo-image-picker expo-splash-screen

# 4. Instalar HTTP
npm install axios

# 5. Instalar QR
npx expo install react-native-svg react-native-qrcode-svg

# 6. Instalar alias module-resolver
npm install --save-dev babel-plugin-module-resolver
```

#### `babel.config.js`

```js
module.exports = function(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: { '@': './src' }
      }]
    ]
  }
}
```

#### `metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.resolver.alias = { '@': './src' }

module.exports = config
```

### 12.5 Cliente HTTP para Mobile (`src/api/client.js`)

```js
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'http://TU_IP_LOCAL:5000/api'  // Cambiar por la IP de tu PC

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('user')
    }
    return Promise.reject(error)
  }
)

export default client
```

> **Nota**: En Expo Go, usa la IP de tu computadora (no localhost). Ejemplo: `http://192.168.1.100:5000/api`. En `app.json` puedes configurar `extra.apiBaseUrl` para no hardcodear.

### 12.6 Storage wrapper (`src/utils/storage.js`)

```js
import * as SecureStore from 'expo-secure-store'

export const setToken = async (token) => {
  await SecureStore.setItemAsync('token', token)
}

export const getToken = async () => {
  return await SecureStore.getItemAsync('token')
}

export const removeToken = async () => {
  await SecureStore.deleteItemAsync('token')
}

export const setUser = async (user) => {
  await SecureStore.setItemAsync('user', JSON.stringify(user))
}

export const getUser = async () => {
  const data = await SecureStore.getItemAsync('user')
  return data ? JSON.parse(data) : null
}

export const clearAuth = async () => {
  await removeToken()
  await SecureStore.deleteItemAsync('user')
}
```

### 12.7 AuthContext para Mobile

```jsx
import { createContext, useState, useEffect } from 'react'
import { getUser, clearAuth, setToken, setUser } from '@/utils/storage'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser().then(u => {
      setUserState(u)
      setLoading(false)
    })
  }, [])

  const login = async (userData, token) => {
    await setToken(token)
    await setUser(userData)
    setUserState(userData)
  }

  const logout = async () => {
    await clearAuth()
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 12.8 Navegación Principal

#### `src/navigation/AppNavigator.jsx`

```jsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '@/hooks/useAuth'
import { ActivityIndicator, View } from 'react-native'

// Importar screens
import LoginScreen from '@/screens/LoginScreen'
import RegisterScreen from '@/screens/RegisterScreen'
import HomeScreen from '@/screens/HomeScreen'
import EventoDetalleScreen from '@/screens/EventoDetalleScreen'
import CheckoutScreen from '@/screens/CheckoutScreen'
import ReservaDetalleScreen from '@/screens/ReservaDetalleScreen'
import MisReservasScreen from '@/screens/MisReservasScreen'
import FavoritosScreen from '@/screens/FavoritosScreen'
import PerfilScreen from '@/screens/PerfilScreen'
import AdminDashboardScreen from '@/screens/AdminDashboardScreen'
import AdminMisEventosScreen from '@/screens/AdminMisEventosScreen'
import AdminCrearEventoScreen from '@/screens/AdminCrearEventoScreen'
import AdminEscanearQRScreen from '@/screens/AdminEscanearQRScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function ClientTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Inicio" component={HomeScreen}
        options={{ tabBarLabel: 'Inicio', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen}
        options={{ tabBarLabel: 'Favoritos', tabBarIcon: () => <Text>❤️</Text> }} />
      <Tab.Screen name="Reservas" component={MisReservasScreen}
        options={{ tabBarLabel: 'Reservas', tabBarIcon: () => <Text>🎫</Text> }} />
      <Tab.Screen name="Perfil" component={PerfilScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: () => <Text>👤</Text> }} />
    </Tab.Navigator>
  )
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text>📊</Text> }} />
      <Tab.Screen name="Eventos" component={AdminMisEventosScreen}
        options={{ tabBarLabel: 'Eventos', tabBarIcon: () => <Text>📅</Text> }} />
      <Tab.Screen name="Escanear" component={AdminEscanearQRScreen}
        options={{ tabBarLabel: 'Escanear', tabBarIcon: () => <Text>📷</Text> }} />
      <Tab.Screen name="Perfil" component={PerfilScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: () => <Text>👤</Text> }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen}
              options={{ headerShown: true, title: 'Crear Cuenta' }} />
          </>
        ) : user.rol === 'Admin' || user.rol === 'Organizador' ? (
          <>
            <Stack.Screen name="Main" component={AdminTabs} />
            <Stack.Screen name="EventoDetalle" component={EventoDetalleScreen}
              options={{ headerShown: true }} />
            <Stack.Screen name="CrearEvento" component={AdminCrearEventoScreen}
              options={{ headerShown: true, title: 'Crear Evento' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={ClientTabs} />
            <Stack.Screen name="EventoDetalle" component={EventoDetalleScreen}
              options={{ headerShown: true }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen}
              options={{ headerShown: true, title: 'Checkout' }} />
            <Stack.Screen name="ReservaDetalle" component={ReservaDetalleScreen}
              options={{ headerShown: true }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### 12.9 Pantallas — Guía de Implementación

#### LoginScreen (`src/screens/LoginScreen.jsx`)

```jsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { login as apiLogin } from '@/api/auth'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()
  const { login } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Completa todos los campos')
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      await login(data, data.token)
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🎫 Chostito</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <TextInput style={styles.input} placeholder="Email" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <TextInput style={styles.input} placeholder="Contraseña" value={password}
          onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tenés cuenta? <Text style={styles.linkBold}>Registrate</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F5' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#2D3436' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#B2BEC3', marginBottom: 32 },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 16, color: '#B2BEC3' },
  linkBold: { color: '#6C5CE7', fontWeight: 'bold' }
})
```

#### HomeScreen (`src/screens/HomeScreen.jsx`)

```jsx
import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { getEventos } from '@/api/eventos'
import { getCategorias } from '@/api/categorias'
import EventCard from '@/components/EventCard'

export default function HomeScreen() {
  const [eventos, setEventos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCat, setFiltroCat] = useState(null)
  const navigation = useNavigation()

  const fetchData = async () => {
    try {
      const [ev, cat] = await Promise.all([
        getEventos({ estado: 'Publicado' }),
        getCategorias()
      ])
      setEventos(ev)
      setCategorias(cat)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onRefresh = () => { setRefreshing(true); fetchData() }

  const filtrados = eventos.filter(e => {
    if (filtroCat && e.categoria !== filtroCat) return false
    if (busqueda && !e.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Próximos Eventos</Text>
      </View>

      <TextInput style={styles.search} placeholder="Buscar eventos..."
        value={busqueda} onChangeText={setBusqueda} />

      <FlatList
        data={categorias}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.chipsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.chip, filtroCat === item.nombre && styles.chipActive]}
            onPress={() => setFiltroCat(filtroCat === item.nombre ? null : item.nombre)}>
            <Text style={[styles.chipText, filtroCat === item.nombre && styles.chipTextActive]}>
              {item.icono} {item.nombre}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtrados}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardWrapper}
            onPress={() => navigation.navigate('EventoDetalle', { id: item.id })}>
            <EventCard evento={item} />
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No se encontraron eventos</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F5' },
  header: { padding: 16, paddingTop: 48 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3436' },
  search: { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: '#FFF', borderRadius: 12, fontSize: 16 },
  chipsContainer: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#6C5CE7' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#FFF' },
  grid: { padding: 8 },
  row: { justifyContent: 'space-between' },
  cardWrapper: { width: '48%', marginBottom: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#B2BEC3', fontSize: 16 }
})
```

#### EventCard Mobile (`src/components/EventCard.jsx`)

```jsx
import { View, Text, Image, StyleSheet } from 'react-native'

const API_URL = 'http://TU_IP_LOCAL:5000'

export default function EventCard({ evento }) {
  return (
    <View style={styles.card}>
      {evento.imagenUrl ? (
        <Image source={{ uri: `${API_URL}${evento.imagenUrl}` }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>🎫</Text></View>
      )}
      <View style={styles.content}>
        <Text style={styles.categoria}>{evento.categoria}</Text>
        <Text style={styles.titulo} numberOfLines={1}>{evento.titulo}</Text>
        <Text style={styles.fecha}>
          {new Date(evento.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
          {'  '}📍 {evento.ciudad}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  image: { width: '100%', height: 120 },
  placeholder: { width: '100%', height: 120, backgroundColor: '#E8E5FF', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 32 },
  content: { padding: 10 },
  categoria: { fontSize: 10, color: '#6C5CE7', fontWeight: '600', backgroundColor: '#6C5CE715', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  titulo: { fontSize: 14, fontWeight: 'bold', color: '#2D3436', marginTop: 6 },
  fecha: { fontSize: 11, color: '#B2BEC3', marginTop: 4 }
})
```

#### EventoDetalleScreen (`src/screens/EventoDetalleScreen.jsx`)

```jsx
import { useState, useEffect, useCallback } from 'react'
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'
import { getEvento, getEntradasEvento } from '@/api/eventos'
import QuantitySelector from '@/components/QuantitySelector'

const API_URL = 'http://TU_IP_LOCAL:5000'

export default function EventoDetalleScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const [evento, setEvento] = useState(null)
  const [entradas, setEntradas] = useState([])
  const [cantidades, setCantidades] = useState({})
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    const fetchData = async () => {
      try {
        const [ev, ent] = await Promise.all([
          getEvento(route.params.id),
          getEntradasEvento(route.params.id)
        ])
        setEvento(ev)
        setEntradas(ent)
        const init = {}
        ent.forEach(e => init[e.tipo] = 0)
        setCantidades(init)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [route.params.id]))

  const total = entradas.reduce((s, e) => s + e.precio * (cantidades[e.tipo] || 0), 0)
  const totalItems = Object.values(cantidades).reduce((s, c) => s + c, 0)

  if (loading || !evento) return <Text style={styles.loading}>Cargando...</Text>

  return (
    <ScrollView style={styles.container}>
      {evento.imagenUrl && (
        <Image source={{ uri: `${API_URL}${evento.imagenUrl}` }} style={styles.hero} />
      )}

      <View style={styles.body}>
        <Text style={styles.categoria}>{evento.categoria}</Text>
        <Text style={styles.titulo}>{evento.titulo}</Text>
        <Text style={styles.eslogan}>{evento.eslogan}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>📅 {new Date(evento.fecha).toLocaleDateString('es-AR')}</Text>
          <Text style={styles.infoText}>🕐 {evento.hora.substring(0, 5)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>📍 {evento.lugar}</Text>
          <Text style={styles.infoText}>🌍 {evento.ciudad}, {evento.pais}</Text>
        </View>

        <Text style={styles.descripcion}>{evento.descripcion}</Text>

        <Text style={styles.sectionTitle}>Tipos de Entrada</Text>
        {entradas.map((e, i) => (
          <View key={i} style={styles.entradaRow}>
            <View>
              <Text style={styles.entradaTipo}>{e.tipo}</Text>
              <Text style={styles.entradaDisp}>{e.cantidadDisponible} disponibles</Text>
            </View>
            <View style={styles.entradaRight}>
              <Text style={styles.entradaPrecio}>${e.precio}</Text>
              <QuantitySelector
                value={cantidades[e.tipo] || 0}
                max={e.cantidadDisponible}
                onChange={(val) => setCantidades(p => ({ ...p, [e.tipo]: val }))}
              />
            </View>
          </View>
        ))}
      </View>

      {totalItems > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.buyButton}
            onPress={() => {
              const items = entradas
                .filter(e => cantidades[e.tipo] > 0)
                .map(e => ({ idEvento: evento.id, tipo: e.tipo, cantidad: cantidades[e.tipo] }))
              navigation.navigate('Checkout', { items })
            }}>
            <Text style={styles.buyText}>Comprar {totalItems} entradas — ${total}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F5' },
  hero: { width: '100%', height: 220 },
  body: { padding: 16, paddingBottom: 100 },
  categoria: { fontSize: 12, color: '#6C5CE7', fontWeight: '600', backgroundColor: '#6C5CE715', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#2D3436', marginTop: 8 },
  eslogan: { fontSize: 14, color: '#B2BEC3', fontStyle: 'italic', marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  infoText: { fontSize: 14, color: '#636E72' },
  descripcion: { fontSize: 14, color: '#636E72', marginTop: 12, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginTop: 20, marginBottom: 12 },
  entradaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 8 },
  entradaTipo: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  entradaDisp: { fontSize: 12, color: '#B2BEC3' },
  entradaRight: { alignItems: 'flex-end' },
  entradaPrecio: { fontSize: 18, fontWeight: 'bold', color: '#6C5CE7' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  buyButton: { backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, alignItems: 'center' },
  buyText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loading: { flex: 1, textAlign: 'center', marginTop: 40, color: '#B2BEC3' }
})
```

#### QuantitySelector (`src/components/QuantitySelector.jsx`)

```jsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function QuantitySelector({ value, max, onChange }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, value === 0 && styles.btnDisabled]}
        onPress={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity style={[styles.btn, value >= max && styles.btnDisabled]}
        onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#DDD' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  value: { fontSize: 16, fontWeight: 'bold', width: 24, textAlign: 'center', color: '#2D3436' }
})
```

#### CheckoutScreen (`src/screens/CheckoutScreen.jsx`)

```jsx
import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { crearReserva } from '@/api/reservas'
import { generarQR, simularPago } from '@/api/pagos'
import QRCode from 'react-native-qrcode-svg'

export default function CheckoutScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { items } = route.params
  const [reserva, setReserva] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [pagado, setPagado] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCrearReserva = async () => {
    setLoading(true)
    try {
      const data = await crearReserva(items)
      setReserva(data)
      const qr = await generarQR(data.id)
      setQrData(qr)
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Error al crear reserva')
    } finally {
      setLoading(false)
    }
  }

  const handlePagar = async () => {
    setLoading(true)
    try {
      await simularPago(reserva.id, 'QR')
      setPagado(true)
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Error al procesar pago')
    } finally {
      setLoading(false)
    }
  }

  if (pagado) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
        <Text style={styles.successDetail}>Transacción: {reserva.pago.codigoTransaccion}</Text>
        <Text style={styles.successAmount}>${reserva.total}</Text>
        <TouchableOpacity style={styles.successButton}
          onPress={() => navigation.navigate('ReservaDetalle', { id: reserva.id })}>
          <Text style={styles.successButtonText}>Ver mis entradas</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen de Compra</Text>

      <View style={styles.summary}>
        {items.map((item, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={styles.summaryText}>{item.tipo} x{item.cantidad}</Text>
            <Text style={styles.summaryText}>Evento #{item.idEvento}</Text>
          </View>
        ))}
      </View>

      {!reserva ? (
        <TouchableOpacity style={styles.button} onPress={handleCrearReserva} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Crear Reserva</Text>}
        </TouchableOpacity>
      ) : (
        <>
          {qrData && (
            <View style={styles.qrContainer}>
              <QRCode value={qrData.qrData} size={200} />
              <Text style={styles.qrCode}>{qrData.codigoTransaccion}</Text>
              <Text style={styles.qrAmount}>${qrData.monto}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.button, styles.payButton]} onPress={handlePagar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Simular Pago QR</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D3436', marginBottom: 16 },
  summary: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryText: { fontSize: 14, color: '#636E72' },
  button: { backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, alignItems: 'center' },
  payButton: { backgroundColor: '#00B894' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  qrContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },
  qrCode: { marginTop: 12, fontSize: 12, color: '#B2BEC3' },
  qrAmount: { fontSize: 20, fontWeight: 'bold', color: '#2D3436', marginTop: 4 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#00B894', marginTop: 16 },
  successDetail: { fontSize: 14, color: '#B2BEC3', marginTop: 8 },
  successAmount: { fontSize: 28, fontWeight: 'bold', color: '#2D3436', marginTop: 8 },
  successButton: { backgroundColor: '#6C5CE7', padding: 16, borderRadius: 12, marginTop: 24 },
  successButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
})
```

#### AdminEscanearQRScreen (`src/screens/AdminEscanearQRScreen.jsx`)

```jsx
import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { Camera, CameraView } from 'expo-camera'
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'http://TU_IP_LOCAL:5000/api'

export default function AdminEscanearQRScreen() {
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState(null)

  const handleBarCodeScanned = async ({ data }) => {
    setScanning(false)
    try {
      const token = await SecureStore.getItemAsync('token')
      const res = await axios.post(`${API_URL}/dashboard/entradas/escanear`,
        { codigoQR: data },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult({ success: true, data: res.data })
      Alert.alert('✅ Válida', `${res.data.tipo} — ${res.data.evento}`)
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Código no válido' })
      Alert.alert('❌ Error', err.response?.data?.message || 'Código no válido')
    }

    setTimeout(() => { setScanning(true); setResult(null) }, 2000)
  }

  return (
    <View style={styles.container}>
      {scanning ? (
        <CameraView style={styles.camera} onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}>
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
            <Text style={styles.scanText}>Apuntá al código QR de la entrada</Text>
          </View>
        </CameraView>
      ) : (
        <View style={styles.resultContainer}>
          {result?.success ? (
            <>
              <Text style={styles.resultIcon}>✅</Text>
              <Text style={styles.resultTitle}>Entrada Válida</Text>
              <Text style={styles.resultDetail}>{result.data.tipo} — {result.data.evento}</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultIcon}>❌</Text>
              <Text style={styles.resultTitle}>Entrada Inválida</Text>
              <Text style={styles.resultDetail}>{result?.message}</Text>
            </>
          )}
          <Text style={styles.resultHint}>Escaneando otra en 2 segundos...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: '#6C5CE7', borderRadius: 20, marginBottom: 20 },
  scanText: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F5' },
  resultIcon: { fontSize: 64 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  resultDetail: { fontSize: 16, color: '#636E72', marginTop: 8 },
  resultHint: { fontSize: 12, color: '#B2BEC3', marginTop: 24 }
})
```

### 12.10 Diferencias clave: Mobile vs Web

| Aspecto | React Native (Mobile) | React (Web) |
|---------|----------------------|-------------|
| **Storage JWT** | `expo-secure-store` (encriptado) | `localStorage` |
| **Navegación** | React Navigation (Stack + Tabs) | React Router (Routes) |
| **Imágenes** | `expo-image` o `<Image>` | `<img>` |
| **QR Scanner** | `expo-camera` (nativo) | No disponible |
| **QR Generator** | `react-native-qrcode-svg` | `qrcode.react` |
| **Image Picker** | `expo-image-picker` | `<input type="file">` |
| **Estilos** | `StyleSheet.create()` | Tailwind / CSS |
| **Layout** | `<View>`, `<Text>`, `<ScrollView>` | `<div>`, `<span>`, CSS Grid |
| **Safe Area** | `SafeAreaView` | `env(safe-area-inset)` |
| **Date Picker** | `@react-native-community/datetimepicker` | `<input type="date">` |
| **Keyboard** | `KeyboardAvoidingView` | Automático |
| **Pull Refresh** | `RefreshControl` (nativo) | Manual |
| **Build** | `eas build` → .apk | `vite build` → dist/ |

### 12.11 Build y Deploy (EAS)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login a Expo
eas login

# 3. Configurar el proyecto
eas build:configure

# 4. Crear build para Android (.apk)
eas build --platform android --profile preview

# 5. Crear build para producción (.aab para Play Store)
eas build --platform android --profile production

# 6. Update OTA (sin pasar por store)
eas update --branch preview --message "fix: corrección en checkout"
```

#### `eas.json`

```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### 12.12 Ejecutar el frontend mobile

```bash
cd mobile

# Instalar dependencias
npm install

# Iniciar Expo
npx expo start

# Opciones:
# - Escaneá el QR con Expo Go (Android) o Camera (iOS)
# - Presioná 'a' para abrir en emulador Android
# - Presioná 'i' para abrir en simulador iOS
```

> **Tip**: Para conectar al backend local, asegurate de que tu celular y tu PC estén en la misma red WiFi. Usa la IP de tu PC (no localhost) en `src/api/client.js`.

---

## Licencia

Proyecto académico — Unidad 3, Desarrollo de Sistemas Multiplataforma.
