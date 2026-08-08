export interface Chat {
  id_chat: number;

  tipo_chat: "Privado" | "Grupal";

  fecha_creacion: Date;
}

export type CrearChatDTO = {
  tipo_chat?: "Privado" | "Grupal"; // Opcional porque tiene DEFAULT 'Privado' en la BD
};

export type ActualizarChatDTO = {
  tipo_chat?: "Privado" | "Grupal";
};

export type EliminarChatDTO = {
  id_chat: number;
};
