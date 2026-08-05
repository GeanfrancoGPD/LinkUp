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

export interface Session {
  id_usuario: number;
  token: string;
  fecha_creacion?: Date;
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

  async crearUsuario(datos: CrearUsuarioDTO): Promise<{ id_usuario: number }> {
    const result = await this.db.excecuteNameQuery("crearUsuario", datos);
    return result?.[0] || result;
  }

  async actualizarUsuario(
    id_usuario: number,
    datos: ActualizarUsuarioDTO,
  ): Promise<void> {
    await this.db.excecuteNameQuery("actualizarUsuario", {
      ...datos,
      id_usuario,
    });
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
}

export default new UserRepository();
