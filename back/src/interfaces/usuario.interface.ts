// 1. Representación exacta de la tabla en BD (para el Repository)
export interface Usuario {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  nombre_usuario: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  fecha_nacimiento: Date;
  sexo: "Masculino" | "Femenino" | "Otro";
  biografia?: string;
  foto_perfil?: string;
  estado: "Activo" | "Inactivo" | "Bloqueado";
  fecha_registro: Date;
}

// 2. Para crear un usuario (Omitimos id_usuario y fecha_registro que los asigna la BD)
export type CrearUsuarioDTO = Omit<
  Usuario,
  "id_usuario" | "fecha_registro" | "estado"
> & {
  estado?: "Activo" | "Inactivo" | "Bloqueado";
};

// 3. Para actualizar (Omitimos id, contraseña y fecha_registro; el resto es opcional)
export type ActualizarUsuarioDTO = Partial<
  Omit<Usuario, "id_usuario" | "contrasena" | "fecha_registro">
>;

// 4. Para respuestas al frontend (Sin la contraseña)
export type UsuarioSinPassword = Omit<Usuario, "contrasena">;
