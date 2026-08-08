export interface SolicitudAmistad {
  id_solicitud: number;
  id_usuario_envia: number;
  id_usuario_recibe: number;
  estado: "Pendiente" | "Aceptada" | "Rechazada";
  fecha_solicitud: Date;
}

// Omitimos el ID generado y la fecha auto-asignada por Postgres.
// Hacemos 'estado' opcional por si decides enviarlo o dejar que la BD use el DEFAULT 'Pendiente'.
export type CreateSolicitud = Omit<
  SolicitudAmistad,
  "id_solicitud" | "fecha_solicitud" | "estado"
> & {
  estado?: "Pendiente" | "Aceptada" | "Rechazada";
};

// Para listar solicitudes con información del usuario emisor (JOIN con usuarios).
// Usado por getSolicitudesPendientes.
export interface SolicitudConUsuario extends SolicitudAmistad {
  nombre_usuario_envia: string;
}

// Para operaciones que solo necesitan id_solicitud + estado (aceptar/rechazar).
export type ActualizarEstadoSolicitud = Pick<
  SolicitudAmistad,
  "id_solicitud" | "estado"
>;

// Para cancelar solicitudes: requiere id + quien la envía (autorización).
export interface CancelarSolicitud {
  id_solicitud: number;
  id_usuario_envia: number;
}
