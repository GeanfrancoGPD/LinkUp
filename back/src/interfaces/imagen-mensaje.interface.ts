export interface ImagenMensaje {
  id_imagen: number;
  id_mensaje: number;
  ruta_imagen: string;
  nombre_archivo?: string;
  tamano_kb?: number;
}

export type GuardarImagenMensajeDTO = Omit<ImagenMensaje, "id_imagen">;
