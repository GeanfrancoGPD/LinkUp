export interface ParticipanteChat {
  id_participante: number;
  id_chat: number;
  id_usuario: number;
  fecha_union: Date;
}

export type AgregarParticipanteDTO = Pick<
  ParticipanteChat,
  "id_chat" | "id_usuario"
>;
