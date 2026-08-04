export interface Mensaje {
  id_mensaje: number;
  id_chat: number;
  id_usuario: number;
  contenido: string;
  tipo: "Texto" | "Imagen";
  leido: boolean;
  fecha_envio: Date;
}
