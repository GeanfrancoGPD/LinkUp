import { Request, Response } from "express";
import Session from "../components/session.js";
import Validator from "../utils/validator.js";
import LinkRepository from "./LinkRepository.js";
import Bcrypt from "../utils/bcrypt.js";
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  UsuarioSinPassword,
} from "../interfaces/usuario.interface.js";
import { SessionUser } from "../types/express-session";

class LinkAuth {
  constructor(
    private readonly session = Session,
    private readonly validator = Validator,
    private readonly repository = LinkRepository,
    private readonly bcrypt = Bcrypt,
  ) {}

  /**
   * Extrae el ID del usuario desde la sesión, body, query o params.
   */
  async resolveUserId(req: Request): Promise<number | null> {
    const candidate =
      req.session?.user?.id ??
      req.body?.id_usuario ??
      req.body?.usuarioId ??
      req.query?.usuarioId ??
      req.params?.usuarioId;

    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Elimina datos sensibles del usuario antes de retornar la respuesta.
   */
  private sanitizeUser(user: Usuario): UsuarioSinPassword {
    const { contrasena, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { gmail, email, password, username, nombre_usuario } = req.body;
      const normalizedCredential = (
        gmail ?? email ?? username ?? nombre_usuario ?? ""
      ).trim();

      if (!normalizedCredential || !password) {
        return res.status(400).json({
          success: false,
          message: "Credencial y contraseña son requeridos",
        });
      }

      // El login solo necesita que la contraseña llegue presente.
      // La validación fuerte de contraseña pertenece al registro.
      if (typeof password !== "string" || password.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Contraseña requerida",
        });
      }

      // 1. Obtener usuario de la base de datos.
      // Si el identificador es un correo válido, buscar por correo.
      // Si no lo es, asumir nombre de usuario.
      let userBD: Usuario | undefined;

      if (normalizedCredential.includes("@")) {
        const emailValidation =
          await this.validator.validateEmail(normalizedCredential);
        if (!emailValidation.success) {
          return res.status(400).json({
            success: false,
            message: "Correo electrónico inválido",
          });
        }

        userBD = await this.repository.getUsuarioPorCorreo(normalizedCredential);
      } else {
        userBD = await this.repository.getUsuarioPorNombreUsuario(
          normalizedCredential,
        );
      }

      if (!userBD) {
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // 2. Comparar la contraseña encriptada
      const valid = await this.bcrypt.compare(password, userBD.contrasena);

      if (!valid) {
        return res.status(401).json({
          success: false,
          message: "Contraseña incorrecta",
        });
      }

      // 3. Formatear al tipo SessionUser exacto que espera tu Session.ts
      const sessionUser: SessionUser = {
        id: userBD.id_usuario,
        email: userBD.correo,
        nombre: userBD.nombres,
        tipo: userBD.estado, // o el campo que estés mapeando como 'tipo' (ej. rol/estado)
      };

      console.log("Usuario autenticado:", sessionUser.email);

      // 4. Delegar la creación de sesión a Session.ts (que también envía la respuesta)
      await this.session.createSession({ request: req, response: res }, [
        sessionUser,
      ]);

      return res; // createSession ya envió la respuesta; retornamos `res` para mantener la firma.
    } catch (error) {
      // Protección contra doble envío de headers si createSession ya respondió.
      if (res.headersSent) {
        return res;
      }
      return res.status(500).json({
        success: false,
        message: "Error interno en el servidor durante el inicio de sesión",
      });
    }
  }

  async register(req: Request, res: Response): Promise<Response> {
    try {
      const {
        nombres,
        apellidos,
        nombre_usuario,
        correo,
        contrasena,
        telefono,
        fecha_nacimiento,
        sexo,
        biografia,
        foto_perfil,
      } = req.body;

      // Sanitización rápida de cadenas de texto
      const normalizedUsername = (nombre_usuario ?? "").trim();
      const normalizedEmail = (correo ?? "").trim();

      if (
        !nombres ||
        !apellidos ||
        !normalizedUsername ||
        !normalizedEmail ||
        !contrasena
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Los campos nombres, apellidos, nombre_usuario, correo y contrasena son obligatorios",
        });
      }

      // Validaciones básicas de negocio
      const emailValidation =
        await this.validator.validateEmail(normalizedEmail);
      if (!emailValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico inválido",
        });
      }

      const passwordValidation =
        await this.validator.validatePassword(contrasena);
      if (!passwordValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            "La contraseña no cumple con los requisitos mínimos de seguridad",
        });
      }

      // Verificar existencia de usuario por correo o nombre de usuario
      const existingUserByUsername =
        await this.repository.getUsuarioPorNombreUsuario(normalizedUsername);
      const existingUserByEmail =
        await this.repository.getUsuarioPorCorreo(normalizedEmail);

      if (existingUserByUsername || existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: "El nombre de usuario o correo ya está registrado",
        });
      }

      // Encriptar la contraseña
      const hashedPassword = await this.bcrypt.hash(contrasena);

      // Estructurar el DTO de creación
      const newUserPayload: CrearUsuarioDTO = {
        nombres,
        apellidos,
        nombre_usuario: normalizedUsername,
        correo: normalizedEmail,
        contrasena: hashedPassword,
        telefono: telefono ?? null,
        fecha_nacimiento,
        sexo: sexo ?? "Otro",
        biografia: biografia ?? null,
        foto_perfil: foto_perfil ?? null,
      };

      const result = await this.repository.crearUsuario(newUserPayload);

      return res.status(201).json({
        success: true,
        message: "Usuario creado correctamente",
        id_usuario: result.id_usuario,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Ocurrió un error al registrar el usuario",
      });
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    this.session.destroySession({ request: req, response: res });
    return res;
  }

  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = await this.resolveUserId(req);

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido o ausente",
        });
      }

      await this.repository.eliminarUsuario(usuarioId);

      // Destruimos la sesión activa si se eliminó el usuario logueado
      if (req.session) {
        req.session.destroy(() => {});
      }

      return res.json({
        success: true,
        message: "La cuenta de usuario ha sido eliminada exitosamente",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudo eliminar la cuenta de usuario",
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = await this.resolveUserId(req);

      if (!usuarioId) {
        return res
          .status(400)
          .json({ success: false, message: "ID de usuario inválido" });
      }

      const { nombres, apellidos, telefono, biografia, foto_perfil, estado } =
        req.body;

      if (
        !nombres &&
        !apellidos &&
        !telefono &&
        !biografia &&
        !foto_perfil &&
        !estado
      ) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un campo para actualizar",
        });
      }

      // Mapeamos solo los campos enviados usando el DTO
      const updateData: ActualizarUsuarioDTO = {
        nombres: nombres ?? undefined,
        apellidos: apellidos ?? undefined,
        telefono: telefono ?? undefined,
        biografia: biografia ?? undefined,
        foto_perfil: foto_perfil ?? undefined,
        estado: estado ?? undefined,
      };

      await this.repository.actualizarUsuario(usuarioId, updateData);

      return res.json({
        success: true,
        message: "Información de usuario actualizada correctamente",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudo actualizar la cuenta del usuario",
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.repository.getUsuarios();

      // Omitir la contraseña de todos los usuarios de la lista
      const safeUsers = users.map((user) => this.sanitizeUser(user));

      return res.json({
        success: true,
        data: safeUsers,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudieron obtener los usuarios",
      });
    }
  }

  async checkSession(req: Request, res: Response): Promise<Response> {
    const exists = this.session.sessionExist({ request: req, response: res });
    if (exists && req.session?.user) {
      return res.json({
        success: true,
        message: "Usuario autenticado",
        user: req.session.user,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Usuario no autenticado",
    });
  }
}

export default new LinkAuth();
