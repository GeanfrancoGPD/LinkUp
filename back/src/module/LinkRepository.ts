import DB from "../components/DBComponent";
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
} from "../interfaces/usuario.interface";

export interface Session {
  id_usuario: number;
  token: string;
  fecha_creacion?: Date;
}

class UserRepository {
  constructor(private readonly db = new DB()) {}

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

  async getSugerenciasUsuarios(id_usuario: number): Promise<Usuario[]> {
    const result = await this.db.excecuteNameQuery("getSugerenciasUsuarios", { id_usuario });
    return result || [];
  }

  async actualizarContrasena(id_usuario: number, contrasena: string) {
    const result = await this.db.excecuteNameQuery("actualizarContrasena", { contrasena, id_usuario });
    return result;
  }

  async actualizarFotoPerfil(id_usuario: number, foto_perfil: string) {
    const result = await this.db.excecuteNameQuery("actualizarFotoPerfil", { foto_perfil, id_usuario });
    return result;
  }
}

export default new UserRepository();
