export interface Mensaje {
  id_mensaje: number;
  id_chat: number;
  id_usuario: number;
  contenido: string;
  tipo: "Texto" | "Imagen";
  leido: boolean;
  fecha_envio: Date;
}

export type GuardarMensajeDTO = Omit<
  Mensaje,
  "id_mensaje" | "leido" | "fecha_envio"
> & {
  tipo?: "Texto" | "Imagen";
};

// ==========================================
// RESPUESTAS DE DOMINIO (agnósticas al transporte)
// ==========================================

/**
 * Respuesta al enviar un mensaje. Válida para REST y Socket.
 */
export interface ResultadoMensaje {
  success: boolean;
  message?: string;
  mensaje?: {
    id_mensaje: number;
    id_chat: number;
    id_usuario: number;
    usuario: string;
    contenido: string;
    tipo: "Texto" | "Imagen";
    ruta_imagen?: string;
    fecha_envio: Date;
  };
}

/**
 * Input para procesar un mensaje desde el BO (sin req/res).
 * Reutilizable por REST (LinkBO.enviarMensajeREST) y Socket (LinkSocket).
 */
export interface ProcesarMensajeInput {
  id_chat: number;
  id_usuario: number;
  contenido: string;
  tipo?: "Texto" | "Imagen";
  ruta_imagen?: string;
  nombre_archivo?: string;
  tamano_kb?: number;
}

/**
 * Query params para paginación de historial (tipo WhatsApp).
 */
export interface HistorialMensajesQuery {
  limit?: number; // cantidad de mensajes a traer (default 50)
  before_id?: number; // traer mensajes con id_mensaje < before_id (carga inicial: vacío)
}

/**
 * Mensaje enriquecido con el nombre del usuario (JOIN).
 * Es lo que retorna el Repository para mostrar en el chat.
 */
export interface MensajeConUsuario {
  id_mensaje: number;
  id_chat: number;
  id_usuario: number;
  usuario: string;
  contenido: string;
  tipo: "Texto" | "Imagen";
  ruta_imagen?: string;
  fecha_envio: Date;
}
