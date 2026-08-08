// ==========================================
// AUTENTICACIÓN DE SOCKET (handshake)
// ==========================================

export interface SocketAuth {
  sid: string;
}

// ==========================================
// EVENTOS CLIENTE -> SERVIDOR
// ==========================================

export interface ClienteAEmisorUnirseChat {
  id_chat: number;
}

export interface ClienteAEmisorSalirChat {
  id_chat: number;
}

export interface ClienteAEmisorMensaje {
  id_chat: number;
  contenido: string;
  tipo?: 'Texto' | 'Imagen';
  ruta_imagen?: string;
  nombre_archivo?: string;
  tamano_kb?: number;
}

export interface ClienteAEmisorTyping {
  id_chat: number;
  escribiendo: boolean;
}

// ==========================================
// NOMBRES DE EVENTOS (constantes para evitar typos)
// ==========================================

export const EVENTOS = {
  UNIRSE_CHAT: 'chat:unirse',
  SALIR_CHAT: 'chat:salir',
  MENSAJE: 'chat:mensaje',
  TYPING: 'chat:typing',
  NUEVO_MENSAJE: 'chat:mensaje',
  USUARIO_TYPING: 'chat:typing',
  USUARIO_UNIDO: 'chat:union',
  USUARIO_SALIO: 'chat:salida',
  ERROR: 'chat:error',
} as const;
