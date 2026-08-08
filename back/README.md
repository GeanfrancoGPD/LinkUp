# Link API — Backend

## Descripción

El módulo `Link` gestiona:

- Autenticación de usuarios.
- Solicitudes de amistad.
- Creación y gestión de chats privados.
- Participantes de chats.
- Historial de mensajes.
- Mensajería en tiempo real mediante Socket.IO.

La aplicación utiliza dos mecanismos de comunicación:

- **REST API** → operaciones persistentes y consulta de información.
- **Socket.IO** → comunicación en tiempo real entre los usuarios de un chat.

La ruta base de la API es:

```text
/api/link
```

---

# 1. Arquitectura

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
        ┌───────────────┐             ┌───────────────┐
        │   REST API    │             │   Socket.IO   │
        │ /api/link/... │             │  Real-time    │
        └───────┬───────┘             └───────┬───────┘
                │                             │
                ▼                             ▼
        ┌──────────────────────────────────────────┐
        │                 LinkBO                   │
        │             Business Logic               │
        └────────────────────┬─────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ LinkRepository │
                    └───────┬────────┘
                            │
                            ▼
                       PostgreSQL
```

La lógica de negocio relacionada con mensajes se reutiliza tanto desde REST como desde Socket.IO mediante `procesarMensaje()`.

Esto permite que un mensaje enviado mediante Socket.IO siga el mismo proceso de validación y persistencia que cualquier otra operación del módulo.

---

# 2. Autenticación

La autenticación REST utiliza la sesión de Express.

El usuario autenticado se obtiene mediante:

```text
req.session.user.id
```

El backend valida que exista una sesión válida antes de ejecutar las operaciones protegidas.

Las rutas protegidas utilizan:

```ts
authMiddleware;
```

Además, `LinkBO` vuelve a resolver el usuario autenticado mediante la sesión antes de ejecutar las operaciones de negocio.

Si no existe una sesión válida:

```json
{
  "success": false,
  "message": "No estás autenticado"
}
```

HTTP:

```text
401 Unauthorized
```

---

# 3. Autenticación REST

## POST `/api/link/login`

Inicia sesión.

### Body

La estructura exacta depende de `LinkAuth.login()`.

```json
{
  "gmail": "ejemplo@gmail.com",
  "password": "123456"
}
```

> Para documentar los campos exactos sería necesario revisar `LinkAuth.ts`.

---

## POST `/api/link/register`

Registra un nuevo usuario.

### Body

La estructura exacta depende de `LinkAuth.register()`.

```json
{
  "nombres": "...",
  "apellidos": "...",
  "nombre_usuario": "...",
  "correo": "...",
  "contrasena": "...",
  "telefono": "...",
  "fecha_nacimiento": "...",
  "sexo": "...",
  "biografia": "...",
  "foto_perfil": "..."
}
```

> Para documentar los campos exactos sería necesario revisar `LinkAuth.ts`.

---

## POST `/api/link/logout`

Cierra la sesión actual.

---

# 4. Solicitudes de amistad

Todas las rutas de solicitudes requieren autenticación.

---

## POST `/api/link/solicitudes`

Envía una solicitud de amistad a otro usuario.

### Autenticación

```text
authMiddleware
```

### Body

```json
{
  "id_usuario_recibe": 25
}
```

### Validaciones

- `id_usuario_recibe` es obligatorio.
- Debe ser numérico.
- El usuario no puede enviarse una solicitud a sí mismo.

### Respuesta exitosa

HTTP `201 Created`

```json
{
  "success": true,
  "message": "Solicitud de amistad enviada correctamente",
  "data": {
    "id_solicitud": 123
  }
}
```

### Errores

#### 400 — Datos inválidos

```json
{
  "success": false,
  "message": "El campo id_usuario_recibe es obligatorio y debe ser numérico"
}
```

También se devuelve `400` cuando el usuario intenta enviarse una solicitud a sí mismo.

#### 401 — No autenticado

```json
{
  "success": false,
  "message": "No estás autenticado"
}
```

#### 404 — Usuario inexistente

```json
{
  "success": false,
  "message": "El usuario receptor no existe"
}
```

#### 409 — Solicitud duplicada

```json
{
  "success": false,
  "message": "Ya existe una solicitud entre estos usuarios"
}
```

#### 500 — Error interno

```json
{
  "success": false,
  "message": "Error interno al enviar la solicitud"
}
```

---

## GET `/api/link/solicitudes/pendientes`

Obtiene las solicitudes de amistad pendientes recibidas por el usuario autenticado.

### Respuesta

HTTP `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "...": "..."
    }
  ],
  "total": 1
}
```

El listado incluye información del usuario que envió la solicitud.

---

## PUT `/api/link/solicitudes/aceptar`

Acepta una solicitud de amistad.

### Body

```json
{
  "id_solicitud": 123
}
```

### Respuesta

```json
{
  "success": true,
  "message": "Solicitud aceptada correctamente"
}
```

### Errores

`400` si `id_solicitud` no es numérico.

`401` si el usuario no está autenticado.

`500` si ocurre un error interno.

---

## PUT `/api/link/solicitudes/rechazar`

Rechaza una solicitud de amistad.

### Body

```json
{
  "id_solicitud": 123
}
```

### Respuesta

```json
{
  "success": true,
  "message": "Solicitud rechazada correctamente"
}
```

---

## DELETE `/api/link/solicitudes`

Cancela una solicitud de amistad.

La operación utiliza el usuario autenticado como `id_usuario_envia`, por lo que la cancelación se realiza asociada al emisor de la solicitud.

### Body

```json
{
  "id_solicitud": 123
}
```

### Respuesta

```json
{
  "success": true,
  "message": "Solicitud cancelada correctamente"
}
```

---

# 5. Chats

## POST `/api/link/chats/create`

Crea un chat privado entre el usuario autenticado y otro usuario.

### Body

```json
{
  "id_usuario_destino": 25
}
```

### Funcionamiento

El backend:

1. Obtiene el usuario autenticado.
2. Valida `id_usuario_destino`.
3. Impide crear un chat consigo mismo.
4. Comprueba si ya existe un chat privado entre ambos usuarios.
5. Crea el chat.
6. Añade al usuario autenticado como participante.
7. Añade al usuario destino como participante.

### Respuesta exitosa

HTTP `201 Created`

```json
{
  "success": true,
  "message": "Chat creado correctamente",
  "data": {
    "id_chat": 15
  }
}
```

### Si ya existe

HTTP `409 Conflict`

```json
{
  "success": false,
  "message": "Ya existe un chat privado entre estos usuarios",
  "data": {
    "id_chat": 15
  }
}
```

---

## GET `/api/link/chats`

Obtiene los chats del usuario autenticado.

### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "id_chat": 15,
      "...": "...",
      "ultimo_mensaje": "...",
      "fecha_ultimo_mensaje": "..."
    }
  ],
  "total": 1
}
```

El listado está enriquecido con información del último mensaje disponible.

---

## DELETE `/api/link/chats/:id_chat`

Elimina un chat.

### Ejemplo

```text
DELETE /api/link/chats/15
```

### Validaciones

El `id_chat` debe ser un número válido y mayor que cero.

Además, el backend verifica que el usuario autenticado pertenezca al chat antes de permitir su eliminación.

### Respuesta

```json
{
  "success": true,
  "message": "Chat eliminado correctamente"
}
```

### Si no existe o no tiene permisos

HTTP `404`

```json
{
  "success": false,
  "message": "El chat no existe o no tienes permiso para eliminarlo"
}
```

---

# 6. Historial de mensajes

## GET `/api/link/chats/:id_chat/mensajes`

Obtiene el historial de mensajes de un chat.

### Ejemplo

```text
GET /api/link/chats/15/mensajes
```

### Query parameters

| Parámetro   | Tipo   | Obligatorio | Descripción                           |
| ----------- | ------ | ----------: | ------------------------------------- |
| `limit`     | number |          No | Cantidad máxima de mensajes           |
| `before_id` | number |          No | Obtiene mensajes anteriores a este ID |

Por defecto:

```text
limit = 50
before_id = null
```

### Primera petición

```text
GET /api/link/chats/15/mensajes?limit=50
```

Obtiene los últimos mensajes disponibles.

### Paginación hacia arriba

Supongamos que el mensaje más antiguo cargado tiene:

```text
id_mensaje = 120
```

La siguiente petición puede ser:

```text
GET /api/link/chats/15/mensajes?before_id=120&limit=50
```

Esto permite implementar un scroll hacia arriba similar al funcionamiento de WhatsApp.

### Seguridad

Antes de obtener los mensajes se comprueba que el usuario autenticado sea participante del chat.

Si no pertenece al chat:

HTTP `403 Forbidden`

```json
{
  "success": false,
  "message": "No tienes acceso a este chat"
}
```

### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "id_mensaje": 101,
      "id_chat": 15,
      "id_usuario": 3,
      "usuario": "Juan Pérez",
      "contenido": "Hola",
      "tipo": "Texto",
      "fecha_envio": "2026-08-07T..."
    }
  ],
  "total": 1,
  "hasMore": false
}
```

`hasMore` indica si la respuesta ha alcanzado el límite solicitado.

---

# 7. Socket.IO

Socket.IO funciona sobre el mismo servidor HTTP que Express.

La arquitectura es:

```text
HTTP Server
├── Express
│   └── /api/link/*
│
└── Socket.IO
    └── eventos de chat
```

Esto significa que REST y Socket.IO utilizan el mismo servidor.

---

# 8. Autenticación de Socket.IO

El socket utiliza el `session ID` para autenticarse.

El frontend debe enviar el `sid` durante el handshake:

```ts
const socket = io(SERVER_URL, {
  auth: {
    sid: sessionId,
  },
});
```

El backend recibe:

```ts
socket.handshake.auth?.sid;
```

y valida ese ID contra la tabla:

```text
session
```

La sesión debe existir y no estar expirada.

Una sesión inválida provoca:

```text
UNAUTHORIZED
```

---

# 9. Usuario autenticado en Socket.IO

Una vez validada la sesión, el backend añade el usuario al objeto `socket`:

```ts
socket.user = {
  id: ...,
  nombre: ...
};
```

Por ello, los handlers pueden obtener directamente:

```ts
socket.user?.id;
socket.user?.nombre;
```

El frontend **no debe enviar el `id_usuario` como fuente de autenticación**.

El backend obtiene el usuario desde la sesión autenticada.

---

# 10. Rooms

Cada chat utiliza una room con el siguiente formato:

```text
chat:{id_chat}
```

Por ejemplo:

```text
chat:15
```

Cuando un usuario entra al chat:

```ts
socket.join("chat:15");
```

A partir de ese momento, los mensajes destinados a ese chat pueden enviarse a:

```ts
io.to("chat:15");
```

---

# 11. Eventos Socket.IO

Los eventos principales son:

| Evento           | Dirección          | Función             |
| ---------------- | ------------------ | ------------------- |
| `UNIRSE_CHAT`    | Frontend → Backend | Entrar a un chat    |
| `SALIR_CHAT`     | Frontend → Backend | Salir de un chat    |
| `MENSAJE`        | Frontend → Backend | Enviar mensaje      |
| `TYPING`         | Frontend → Backend | Indicar escritura   |
| `USUARIO_UNIDO`  | Backend → Frontend | Notificar entrada   |
| `USUARIO_SALIO`  | Backend → Frontend | Notificar salida    |
| `NUEVO_MENSAJE`  | Backend → Frontend | Nuevo mensaje       |
| `USUARIO_TYPING` | Backend → Frontend | Usuario escribiendo |
| `ERROR`          | Backend → Frontend | Error               |

Los nombres exactos dependen de las constantes definidas en:

```text
EVENTOS
```

---

# 12. Unirse a un chat

## Evento

```text
UNIRSE_CHAT
```

### Payload

```json
{
  "id_chat": 15
}
```

### Flujo

```text
Frontend
   │
   │ UNIRSE_CHAT
   │ { id_chat: 15 }
   ▼
Backend
   │
   ├── Obtiene usuario autenticado
   │
   ├── Valida que id_chat sea válido
   │
   ├── Comprueba que sea participante
   │
   └── socket.join("chat:15")
```

Si el usuario no pertenece al chat:

```json
{
  "success": false,
  "message": "No eres participante de este chat"
}
```

Si entra correctamente, los demás usuarios de la room reciben:

```text
USUARIO_UNIDO
```

con:

```json
{
  "id_chat": 15,
  "id_usuario": 8,
  "nombre_usuario": "Juan"
}
```

---

# 13. Salir de un chat

## Evento

```text
SALIR_CHAT
```

### Payload

```json
{
  "id_chat": 15
}
```

El socket abandona:

```text
chat:15
```

Los demás usuarios reciben:

```text
USUARIO_SALIO
```

Payload:

```json
{
  "id_chat": 15,
  "id_usuario": 8,
  "nombre_usuario": "Juan"
}
```

---

# 14. Enviar mensaje

## Evento

```text
MENSAJE
```

### Payload

```json
{
  "id_chat": 15,
  "contenido": "Hola, ¿cómo estás?",
  "tipo": "Texto"
}
```

Los tipos soportados son:

```text
Texto
Imagen
```

Para una imagen:

```json
{
  "id_chat": 15,
  "contenido": "Imagen enviada",
  "tipo": "Imagen",
  "ruta_imagen": "/uploads/chat/imagen.jpg",
  "nombre_archivo": "imagen.jpg",
  "tamano_kb": 250
}
```

---

# 15. Flujo interno de un mensaje

Cuando llega el evento `MENSAJE`, el backend:

```text
1. Obtiene usuario desde socket.user
          │
          ▼
2. Valida autenticación
          │
          ▼
3. Valida id_chat y contenido
          │
          ▼
4. LinkBO.procesarMensaje()
          │
          ▼
5. Comprueba participación
          │
          ▼
6. Guarda mensaje en PostgreSQL
          │
          ▼
7. Si es imagen, guarda referencia de imagen
          │
          ▼
8. Obtiene información del usuario
          │
          ▼
9. Construye mensaje
          │
          ▼
10. Emite NUEVO_MENSAJE a la room
```

El método `procesarMensaje()` es especialmente importante porque es compartido por la lógica de mensajería y realiza la validación de participación antes de guardar el mensaje.

---

# 16. Respuesta del envío mediante ACK

El evento `MENSAJE` acepta un callback `ack`.

Si el mensaje se procesa correctamente:

```json
{
  "success": true,
  "data": {
    "id_mensaje": 123,
    "id_chat": 15,
    "id_usuario": 8,
    "usuario": "Juan Pérez",
    "contenido": "Hola",
    "tipo": "Texto",
    "fecha_envio": "2026-08-07T..."
  }
}
```

Esto permite que el frontend sepa si el servidor consiguió procesar el mensaje.

---

# 17. Evento `NUEVO_MENSAJE`

Una vez guardado el mensaje, el backend lo emite a todos los sockets conectados a:

```text
chat:{id_chat}
```

Ejemplo:

```json
{
  "id_mensaje": 123,
  "id_chat": 15,
  "id_usuario": 8,
  "usuario": "Juan Pérez",
  "contenido": "Hola",
  "tipo": "Texto",
  "fecha_envio": "2026-08-07T..."
}
```

Por tanto, el frontend debe escuchar:

```ts
socket.on("NUEVO_MENSAJE", (mensaje) => {
  // Añadir mensaje a la conversación
});
```

---

# 18. Typing

## Evento

```text
TYPING
```

### Payload

```json
{
  "id_chat": 15,
  "escribiendo": true
}
```

Para indicar que dejó de escribir:

```json
{
  "id_chat": 15,
  "escribiendo": false
}
```

El backend envía a los demás usuarios:

```text
USUARIO_TYPING
```

Payload:

```json
{
  "id_chat": 15,
  "id_usuario": 8,
  "nombre_usuario": "Juan",
  "escribiendo": true
}
```

El socket que genera el evento no recibe su propio evento porque se utiliza:

```ts
socket.to(room);
```

---

# 19. Ejemplo de integración Frontend

La conexión básica sería:

```ts
import { io, Socket } from "socket.io-client";

const socket: Socket = io(API_URL, {
  auth: {
    sid: sessionId,
  },
  withCredentials: true,
});
```

---

## Escuchar conexión

```ts
socket.on("connect", () => {
  console.log("Socket conectado:", socket.id);
});
```

## Escuchar errores

```ts
socket.on("connect_error", (error) => {
  console.error("Error de Socket.IO:", error.message);
});
```

---

# 20. Entrar a un chat

```ts
socket.emit("UNIRSE_CHAT", {
  id_chat: 15,
});
```

Después se pueden escuchar los usuarios que entren:

```ts
socket.on("USUARIO_UNIDO", (data) => {
  console.log(`${data.nombre_usuario} se unió al chat`);
});
```

---

# 21. Obtener historial

El historial debe obtenerse mediante REST:

```text
GET /api/link/chats/15/mensajes?limit=50
```

Después de cargar el historial, Socket.IO se utiliza para recibir los mensajes nuevos.

Por tanto:

```text
REST
 │
 └── Carga historial
          │
          ▼
Socket.IO
 │
 └── Recibe mensajes nuevos
```

Esta separación evita tener que recuperar todo el historial mediante Socket.IO.

---

# 22. Enviar mensajes desde el Frontend

```ts
socket.emit(
  "MENSAJE",
  {
    id_chat: 15,
    contenido: "Hola",
    tipo: "Texto",
  },
  (response) => {
    if (response.success) {
      console.log("Mensaje enviado:", response.data);
    } else {
      console.error(response.message);
    }
  },
);
```

---

# 23. Recibir mensajes

```ts
socket.on("NUEVO_MENSAJE", (mensaje) => {
  console.log("Nuevo mensaje:", mensaje);

  // Añadir mensaje a la conversación
});
```

---

# 24. Indicador "escribiendo..."

```ts
socket.emit("TYPING", {
  id_chat: 15,
  escribiendo: true,
});
```

Y para detenerlo:

```ts
socket.emit("TYPING", {
  id_chat: 15,
  escribiendo: false,
});
```

Escuchar:

```ts
socket.on("USUARIO_TYPING", (data) => {
  if (data.escribiendo) {
    console.log(`${data.nombre_usuario} está escribiendo...`);
  }
});
```

---

# 25. Salir del chat

Cuando el usuario cambia de conversación:

```ts
socket.emit("SALIR_CHAT", {
  id_chat: 15,
});
```

Esto es importante para evitar mantener rooms innecesarias.

---

# 26. Flujo recomendado de una conversación

El flujo completo del frontend debería ser:

```text
Usuario abre aplicación
        │
        ▼
Login REST
        │
        ▼
Obtiene sesión
        │
        ▼
Conecta Socket.IO usando sid
        │
        ▼
GET /api/link/chats
        │
        ▼
Usuario selecciona chat
        │
        ├──────────────────────┐
        ▼                      │
GET /chats/:id/mensajes        │
        │                      │
        ▼                      │
Carga historial               │
        │                      │
        ▼                      │
socket.emit(UNIRSE_CHAT) ◄────┘
        │
        ▼
Usuario envía mensaje
        │
        ▼
socket.emit(MENSAJE)
        │
        ▼
Backend valida participante
        │
        ▼
Guarda en PostgreSQL
        │
        ▼
NUEVO_MENSAJE
        │
        ▼
Todos los usuarios del chat
```

---

# 27. REST vs Socket.IO

| Necesidad                      | REST | Socket.IO |
| ------------------------------ | :--: | :-------: |
| Login                          |  ✅  |    ❌     |
| Registro                       |  ✅  |    ❌     |
| Logout                         |  ✅  |    ❌     |
| Solicitudes amistad            |  ✅  |    ❌     |
| Crear chat                     |  ✅  |    ❌     |
| Listar chats                   |  ✅  |    ❌     |
| Cargar historial               |  ✅  |    ❌     |
| Paginación historial           |  ✅  |    ❌     |
| Enviar mensaje                 |  ❌  |    ✅     |
| Recibir mensaje en tiempo real |  ❌  |    ✅     |
| Usuario entra al chat          |  ❌  |    ✅     |
| Usuario sale del chat          |  ❌  |    ✅     |
| Indicador escribiendo          |  ❌  |    ✅     |

---

# 28. Seguridad

Las operaciones REST protegidas requieren autenticación.

Además, las operaciones relacionadas con chats comprueban la pertenencia del usuario.

En particular, para obtener mensajes:

```text
Usuario autenticado
        │
        ▼
¿Es participante del chat?
        │
   ┌────┴────┐
   │         │
  NO        SÍ
   │         │
  403       Datos
```

La misma validación se realiza antes de guardar un mensaje mediante Socket.IO.

Esto evita que un usuario autenticado pueda enviar mensajes a un chat del que no forma parte.

---

# 29. Resumen de endpoints

| Método | Endpoint                            | Auth | Descripción           |
| ------ | ----------------------------------- | :--: | --------------------- |
| POST   | `/api/link/login`                   |  ❌  | Login                 |
| POST   | `/api/link/register`                |  ❌  | Registro              |
| POST   | `/api/link/logout`                  | ❌\* | Logout                |
| POST   | `/api/link/solicitudes`             |  ✅  | Crear solicitud       |
| GET    | `/api/link/solicitudes/pendientes`  |  ✅  | Solicitudes recibidas |
| PUT    | `/api/link/solicitudes/aceptar`     |  ✅  | Aceptar solicitud     |
| PUT    | `/api/link/solicitudes/rechazar`    |  ✅  | Rechazar solicitud    |
| DELETE | `/api/link/solicitudes`             |  ✅  | Cancelar solicitud    |
| POST   | `/api/link/chats/create`            |  ✅  | Crear chat            |
| GET    | `/api/link/chats`                   |  ✅  | Listar chats          |
| DELETE | `/api/link/chats/:id_chat`          |  ✅  | Eliminar chat         |
| GET    | `/api/link/chats/:id_chat/mensajes` |  ✅  | Obtener historial     |

- El endpoint está definido sin `authMiddleware`; el comportamiento exacto depende de `LinkAuth.logout()`.

---

# 30. Eventos Socket.IO

```text
Cliente → Servidor

UNIRSE_CHAT
SALIR_CHAT
MENSAJE
TYPING
```

```text
Servidor → Cliente

USUARIO_UNIDO
USUARIO_SALIO
NUEVO_MENSAJE
USUARIO_TYPING
ERROR
```

---

# 31. Consideraciones para el Frontend

El frontend debería separar:

```text
ChatService
├── REST
│   ├── getChats()
│   ├── createChat()
│   ├── deleteChat()
│   └── getMessages()
│
└── Socket
    ├── connect()
    ├── joinChat()
    ├── leaveChat()
    ├── sendMessage()
    ├── sendTyping()
    └── listeners
```

La recomendación es mantener **una única conexión Socket.IO por sesión/aplicación**, no crear un socket nuevo cada vez que el usuario abre una conversación.

La conversación activa cambia de room mediante:

```text
SALIR_CHAT
     ↓
UNIRSE_CHAT
```

mientras la conexión Socket.IO permanece abierta.

---

# 32. Arquitectura final

```text
                         FRONTEND
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        REST HTTP                    Socket.IO
              │                           │
              │                           │
              ▼                           ▼
        LinkRouter                  LinkSocket
              │                           │
              ▼                           ▼
           LinkBO ◄───────────────────────┘
              │
              ▼
       LinkRepository
              │
              ▼
          PostgreSQL
```

La pieza central de la lógica de negocio es `LinkBO`, mientras que `LinkRepository` se encarga del acceso a datos. Socket.IO reutiliza `LinkBO.procesarMensaje()` para mantener las reglas de negocio y la persistencia centralizadas.
