import { omit } from "zod/mini";

export interface SolicitudAmistad {
  id_solicitud: number;
  id_usuario_envia: number;
  id_usuario_recibe: number;
  estado: "Pendiente" | "Aceptada" | "Rechazada";
  fecha_solicitud: Date;
}

export type CreateSolicitud = Omit<SolicitudAmistad, "id_solicitud">;
