import DB from "../components/DBComponent";
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
} from "../interfaces/usuario.interface";
import {
  CreateSolicitud,
  SolicitudConUsuario,
} from "../interfaces/solicitud-amistad.interface";
import { CrearChatDTO, Chat } from "../interfaces/chat.interface";
import { AgregarParticipanteDTO } from "../interfaces/participante-chat.interface";
import {
  GuardarMensajeDTO,
  MensajeConUsuario,
} from "../interfaces/mensaje.interface";

export interface Session {
  id_usuario: number;
  token: string;
  fecha_creacion?: Date;
}

// Tipo para el listado de chats del usuario (vista enriquecida)
export interface ChatConDetalles extends Chat {
  ultimo_mensaje?: string;
  fecha_ultimo_mensaje?: Date;
}
class UserRepository {
  constructor(private readonly db = new DB()) {}

  // ==========================================
  // USUARIOS
  // ==========================================

  async getUsuarios(): Promise<Usuario[]> {
    const result = await this.db.excecuteNameQuery("getUsuarios", {});
    return result || [];
  }

  async getUsuarioPorId(id_usuario: number): Promise<Usuario | undefined> {
    const result = await this.db.excecuteNameQuery("getUsuarioPorId", {
      id_usuario,
    });
    return result?.[0];
  }

  async getUsuarioPorNombreUsuario(
    nombre_usuario: string,
  ): Promise<Usuario | undefined> {
    const result = await this.db.excecuteNameQuery(
      "getUsuarioPorNombreUsuario",
      { nombre_usuario },
    );
    return result?.[0];
  }

  async getUsuarioPorCorreo(correo: string): Promise<Usuario | undefined> {
    const result = await this.db.excecuteNameQuery("getUsuarioPorCorreo", {
      correo,
    });
    return result?.[0];
  }

  async getSuggestedUsuarios(id_usuario: number): Promise<Usuario[]> {
    const result = await this.db.excecuteNameQuery("getSuggestedUsuarios", {
      id_usuario,
    });
    return result || [];
  }

  async crearUsuario(datos: CrearUsuarioDTO): Promise<{ id_usuario: number }> {
    const result = await this.db.excecuteNameQuery("crearUsuario", datos);
    return result?.[0] || result;
  }

  async actualizarUsuario(
    id_usuario: number,
    datos: ActualizarUsuarioDTO,
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    const columns: Record<keyof ActualizarUsuarioDTO, string> = {
      nombres: "nombres",
      apellidos: "apellidos",
      nombre_usuario: "nombre_usuario",
      correo: "correo",
      telefono: "telefono",
      fecha_nacimiento: "fecha_nacimiento",
      sexo: "sexo",
      biografia: "biografia",
      foto_perfil: "foto_perfil",
      estado: "estado",
    };

    for (const key of Object.keys(columns) as Array<keyof ActualizarUsuarioDTO>) {
      const value = datos[key];
      if (value !== undefined) {
        fields.push(`${columns[key]}=$${values.length + 1}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id_usuario);
    const query = `UPDATE usuarios SET ${fields.join(", ")} WHERE id_usuario=$${values.length}`;
    await this.db.executeQuery(query, values);
  }

  async actualizarContrasena(
    id_usuario: number,
    contrasena: string,
  ): Promise<void> {
    await this.db.executeQuery(
      "UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2",
      [contrasena, id_usuario],
    );
  }

  async eliminarUsuario(id_usuario: number): Promise<void> {
    await this.db.excecuteNameQuery("eliminarUsuario", { id_usuario });
  }

  // ==========================================
  // SOLICITUDES DE AMISTAD
  // ==========================================

  /**
   * Crea una nueva solicitud de amistad.
   * Retorna el id_solicitud generado por Postgres.
   */
  async setSolicitud(
    datos: CreateSolicitud,
  ): Promise<{ id_solicitud: number }> {
    const result = await this.db.excecuteNameQuery("crearSolicitud", datos);
    return result?.[0] || result;
  }

  /**
   * Cambia el estado de una solicitud a 'Aceptada'.
   */
  async aceptarSolicitud(id_solicitud: number): Promise<void> {
    await this.db.excecuteNameQuery("aceptarSolicitud", { id_solicitud });
  }

  /**
   * Cambia el estado de una solicitud a 'Rechazada'.
   */
  async rechazarSolicitud(id_solicitud: number): Promise<void> {
    await this.db.excecuteNameQuery("rechazarSolicitud", { id_solicitud });
  }

  /**
   * Elimina una solicitud (solo si el emisor coincide).
   * Se valida en SQL con id_usuario_envia para evitar cancelaciones ajenas.
   */
  async cancelarSolicitud(
    id_solicitud: number,
    id_usuario_envia: number,
  ): Promise<void> {
    await this.db.excecuteNameQuery("cancelarSolicitud", {
      id_solicitud,
      id_usuario_envia,
    });
  }

  /**
   * Obtiene las solicitudes pendientes que un usuario ha RECIBIDO.
   * Incluye información del emisor (nombre completo vía JOIN).
   */
  async getSolicitudesPendientes(
    id_usuario_recibe: number,
  ): Promise<SolicitudConUsuario[]> {
    const result = await this.db.excecuteNameQuery<any>(
      "getSolicitudesPendientes",
      { id_usuario: id_usuario_recibe },
    );
    return (result as SolicitudConUsuario[]) || [];
  }

  async getSolicitudPorId(
    id_solicitud: number,
  ): Promise<
    | {
        id_solicitud: number;
        id_usuario_envia: number;
        id_usuario_recibe: number;
        estado: string;
      }
    | undefined
  > {
    const result = await this.db.excecuteNameQuery<{
      id_solicitud: number;
      id_usuario_envia: number;
      id_usuario_recibe: number;
      estado: string;
    }>("getSolicitudPorId", { id_solicitud });
    return result?.[0];
  }

  async createChat(datos: CrearChatDTO): Promise<{ id_chat: number }> {
    const result = await this.db.excecuteNameQuery("crearChat", {
      tipo_chat: datos.tipo_chat || "Privado", // Default to 'Privado' if not provided
    });
    return result?.[0] || result;
  }

  async agregarParticipante(
    datos: AgregarParticipanteDTO,
  ): Promise<{ id_participante: number }> {
    const result = await this.db.excecuteNameQuery("agregarParticipante", {
      id_chat: datos.id_chat,
      id_usuario: datos.id_usuario,
    });
    return result?.[0] || result;
  }

  async obtenerChatPrivadoEntreUsuarios(
    id_usuario_1: number,
    id_usuario_2: number,
  ): Promise<{ id_chat: number } | undefined> {
    const result = await this.db.excecuteNameQuery(
      "obtenerChatPrivadoEntreUsuarios",
      {
        id_usuario_1,
        id_usuario_2,
      },
    );
    return result?.[0];
  }

  async eliminarChat(id_chat: number): Promise<void> {
    await this.db.excecuteNameQuery("eliminarChat", { id_chat });
  }

  async obtenerChatUsuario(
    id_usuario: number,
    id_chat: number,
  ): Promise<
    | {
        id_chat: number;
        tipo_chat: "Privado" | "Grupal";
        fecha_creacion: Date;
      }
    | undefined
  > {
    const result = await this.db.excecuteNameQuery("obtenerChatUsuario", {
      id_usuario,
      id_chat,
    });
    return result?.[0];
  }

  async guardarMensaje(
    mensaje: GuardarMensajeDTO,
  ): Promise<{ id_mensaje: number }> {
    const result = await this.db.excecuteNameQuery("guardarMensaje", {
      ...mensaje,
      tipo: mensaje.tipo || "Texto",
    });
    return result?.[0] || result;
  }

  /**
   * Persiste la referencia a una imagen asociada a un mensaje.
   */
  async guardarImagen(datos: {
    id_mensaje: number;
    ruta_imagen: string;
    nombre_archivo?: string;
    tamano_kb?: number;
  }): Promise<{ id_imagen: number }> {
    const result = await this.db.excecuteNameQuery("guardarImagen", {
      id_mensaje: datos.id_mensaje,
      ruta_imagen: datos.ruta_imagen,
      nombre_archivo: datos.nombre_archivo || "",
      tamano_kb: datos.tamano_kb || 0,
    });
    return result?.[0] || result;
  }

  /**
   * Verifica si un usuario es participante de un chat.
   * Retorna true/false.
   */
  async esParticipanteChat(
    id_chat: number,
    id_usuario: number,
  ): Promise<boolean> {
    const result = await this.db.excecuteNameQuery<{ existe: boolean }>(
      "esParticipanteChat",
      { id_chat, id_usuario },
    );
    return result?.[0]?.existe ?? false;
  }

  /**
   * Lista los chats en los que participa un usuario, con info del último mensaje.
   */
  async getChatsPorUsuario(id_usuario: number): Promise<ChatConDetalles[]> {
    const result = await this.db.excecuteNameQuery<ChatConDetalles>(
      "getChatsUsuario",
      { id_usuario },
    );
    return result || [];
  }

  /**
   * Obtiene el historial completo de mensajes de un chat (ASC).
   */
  async getMensajesChat(id_chat: number): Promise<MensajeConUsuario[]> {
    const result = await this.db.excecuteNameQuery<MensajeConUsuario>(
      "obtenerMensajesChat",
      { id_chat },
    );
    return result || [];
  }

  /**
   * Obtiene mensajes con paginación (tipo WhatsApp: scroll hacia arriba).
   * Si before_id es null, trae los últimos `limit` mensajes.
   * Si before_id tiene valor, trae mensajes con id_mensaje < before_id.
   */
  async getMensajesChatPaginados(
    id_chat: number,
    before_id: number | null,
    limit: number,
  ): Promise<MensajeConUsuario[]> {
    const result = await this.db.excecuteNameQuery<MensajeConUsuario>(
      "obtenerMensajesChatPaginados",
      { id_chat, before_id, limit },
    );
    // Devolvemos ordenados ASC para que el frontend los muestre en orden cronológico
    return (result || []).reverse();
  }
}

export default new UserRepository();
