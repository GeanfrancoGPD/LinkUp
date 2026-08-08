import { Request, Response } from "express";
import LinkRepository from "./LinkRepository.js";
import {
  GuardarMensajeDTO,
  ProcesarMensajeInput,
  ResultadoMensaje,
} from "../interfaces/mensaje.interface";

class LinkBO {
  constructor(private readonly repository = LinkRepository) {}

  /**
   * Resuelve el ID del usuario autenticado desde la sesión.
   * Lanza un error con sentinel "NO_AUTHENTICATED" si no hay sesión válida.
   */
  private resolveSessionUserId(req: Request): number {
    const rawId = req.session?.user?.id;
    if (rawId === undefined || rawId === null) {
      throw new Error("NO_AUTHENTICATED");
    }
    const userId = Number(rawId);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error("NO_AUTHENTICATED");
    }
    return userId;
  }

  // ==========================================
  // SOLICITUDES DE AMISTAD
  // ==========================================

  async enviarSolicitud(req: Request, res: Response): Promise<Response> {
    try {
      const id_usuario_envia = this.resolveSessionUserId(req);
      const { id_usuario_recibe } = req.body;

      // Validación de input
      if (
        id_usuario_recibe === undefined ||
        id_usuario_recibe === null ||
        typeof id_usuario_recibe !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "El campo id_usuario_recibe es obligatorio y debe ser numérico",
        });
      }

      // Regla de negocio: no autorequest
      if (id_usuario_envia === id_usuario_recibe) {
        return res.status(400).json({
          success: false,
          message: "No puedes enviarte una solicitud de amistad a ti mismo",
        });
      }

      const result = await this.repository.setSolicitud({
        id_usuario_envia,
        id_usuario_recibe,
      });

      return res.status(201).json({
        success: true,
        message: "Solicitud de amistad enviada correctamente",
        data: result,
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      // Postgres unique_violation (23505) cuando ya existe la solicitud
      if (error?.code === "23505" || error?.message?.includes("duplicate")) {
        return res.status(409).json({
          success: false,
          message: "Ya existe una solicitud entre estos usuarios",
        });
      }
      // FK violation (23503) cuando el usuario destino no existe
      if (error?.code === "23503") {
        return res.status(404).json({
          success: false,
          message: "El usuario receptor no existe",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al enviar la solicitud",
      });
    }
  }

  async aceptarSolicitud(req: Request, res: Response): Promise<Response> {
    try {
      this.resolveSessionUserId(req);
      const { id_solicitud } = req.body;

      if (
        id_solicitud === undefined ||
        id_solicitud === null ||
        typeof id_solicitud !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "id_solicitud es obligatorio y debe ser numérico",
        });
      }

      await this.repository.aceptarSolicitud(id_solicitud);

      return res.json({
        success: true,
        message: "Solicitud aceptada correctamente",
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al aceptar la solicitud",
      });
    }
  }

  async rechazarSolicitud(req: Request, res: Response): Promise<Response> {
    try {
      this.resolveSessionUserId(req);
      const { id_solicitud } = req.body;

      if (
        id_solicitud === undefined ||
        id_solicitud === null ||
        typeof id_solicitud !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "id_solicitud es obligatorio y debe ser numérico",
        });
      }

      await this.repository.rechazarSolicitud(id_solicitud);

      return res.json({
        success: true,
        message: "Solicitud rechazada correctamente",
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al rechazar la solicitud",
      });
    }
  }

  async cancelarSolicitud(req: Request, res: Response): Promise<Response> {
    try {
      const id_usuario_envia = this.resolveSessionUserId(req);
      const { id_solicitud } = req.body;

      if (
        id_solicitud === undefined ||
        id_solicitud === null ||
        typeof id_solicitud !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message: "id_solicitud es obligatorio y debe ser numérico",
        });
      }

      await this.repository.cancelarSolicitud(id_solicitud, id_usuario_envia);

      return res.json({
        success: true,
        message: "Solicitud cancelada correctamente",
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al cancelar la solicitud",
      });
    }
  }

  async listarSolicitudesPendientes(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const id_usuario_recibe = this.resolveSessionUserId(req);
      console.log("[LinkBO] listarSolicitudesPendientes para usuario:", id_usuario_recibe);

      const solicitudes =
        await this.repository.getSolicitudesPendientes(id_usuario_recibe);
      console.log("[LinkBO] solicitudes encontradas:", solicitudes);

      return res.json({
        success: true,
        data: solicitudes,
        total: solicitudes.length,
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener las solicitudes",
      });
    }
  }

  async listarSugerencias(req: Request, res: Response): Promise<Response> {
    try {
      const id_usuario = this.resolveSessionUserId(req);
      const suggestions = await this.repository.getSuggestedUsuarios(id_usuario);

      return res.json({
        success: true,
        data: suggestions,
        total: suggestions.length,
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener las sugerencias",
      });
    }
  }

  // ==========================================
  // Chat y Mensajería
  // ==========================================

  async createChat(req: Request, res: Response): Promise<Response> {
    try {
      const id_usuario = this.resolveSessionUserId(req);
      const { id_usuario_destino } = req.body;

      if (
        id_usuario_destino === undefined ||
        id_usuario_destino === null ||
        typeof id_usuario_destino !== "number"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "El campo id_usuario_destino es obligatorio y debe ser numérico",
        });
      }

      if (id_usuario === id_usuario_destino) {
        return res.status(400).json({
          success: false,
          message: "No puedes crear un chat contigo mismo",
        });
      }

      const existingChat =
        await this.repository.obtenerChatPrivadoEntreUsuarios(
          id_usuario,
          id_usuario_destino,
        );

      if (existingChat) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un chat privado entre estos usuarios",
          data: existingChat,
        });
      }

      const chat = await this.repository.createChat({
        tipo_chat: "Privado",
      });

      await Promise.all([
        this.repository.agregarParticipante({
          id_chat: chat.id_chat,
          id_usuario: id_usuario,
        }),
        this.repository.agregarParticipante({
          id_chat: chat.id_chat,
          id_usuario: id_usuario_destino,
        }),
      ]);

      return res.status(201).json({
        success: true,
        message: "Chat creado correctamente",
        data: chat,
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al crear el chat",
      });
    }
  }

  async getChatsPorUsuario(req: Request, res: Response): Promise<Response> {
    try {
      const id_usuario = this.resolveSessionUserId(req);

      const chats = await this.repository.getChatsPorUsuario(id_usuario);

      return res.json({
        success: true,
        data: chats,
        total: chats.length,
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener los chats",
      });
    }
  }

  async eliminarChat(req: Request, res: Response): Promise<Response> {
    try {
      this.resolveSessionUserId(req);
      const id_chat = Number(req.params.id_chat);

      if (!Number.isFinite(id_chat) || id_chat <= 0) {
        return res.status(400).json({
          success: false,
          message: "id_chat debe ser un número válido",
        });
      }

      const chatExists = await this.repository.obtenerChatUsuario(
        this.resolveSessionUserId(req),
        id_chat,
      );

      if (!chatExists) {
        return res.status(404).json({
          success: false,
          message: "El chat no existe o no tienes permiso para eliminarlo",
        });
      }

      await this.repository.eliminarChat(id_chat);

      return res.json({
        success: true,
        message: "Chat eliminado correctamente",
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error interno al eliminar el chat",
      });
    }
  }

  async guardarMensaje(datos: GuardarMensajeDTO): Promise<number> {
    const id_mensaje = await this.repository.guardarMensaje(datos);
    return Number(id_mensaje);
  }

  // ==========================================
  // HISTORIAL DE MENSAJES (REST)
  // ==========================================

  async obtenerHistorialMensajes(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const id_usuario = this.resolveSessionUserId(req);
      const id_chat = Number(req.params.id_chat);
      const limit = Number(req.query.limit) || 50;
      const before_id = req.query.before_id
        ? Number(req.query.before_id)
        : null;

      if (!Number.isFinite(id_chat) || id_chat <= 0) {
        return res.status(400).json({
          success: false,
          message: "id_chat debe ser un número válido",
        });
      }

      const esParticipante = await this.repository.esParticipanteChat(
        id_chat,
        id_usuario,
      );
      if (!esParticipante) {
        return res.status(403).json({
          success: false,
          message: "No tienes acceso a este chat",
        });
      }

      const mensajes = await this.repository.getMensajesChatPaginados(
        id_chat,
        before_id,
        limit,
      );

      return res.json({
        success: true,
        data: mensajes,
        total: mensajes.length,
        hasMore: mensajes.length === limit,
      });
    } catch (error: any) {
      if (error?.message === "NO_AUTHENTICATED") {
        return res.status(401).json({
          success: false,
          message: "No estás autenticado",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error al obtener el historial de mensajes",
      });
    }
  }

  // ==========================================
  // METODOS REUTILIZABLES (REST + Socket)
  // ==========================================

  async procesarMensaje(
    input: ProcesarMensajeInput,
  ): Promise<ResultadoMensaje> {
    try {
      const esParticipante = await this.repository.esParticipanteChat(
        input.id_chat,
        input.id_usuario,
      );
      if (!esParticipante) {
        return {
          success: false,
          message: "No eres participante de este chat",
        };
      }

      const tipo: "Texto" | "Imagen" = input.tipo ?? "Texto";
      const mensajeCreado = await this.repository.guardarMensaje({
        id_chat: input.id_chat,
        id_usuario: input.id_usuario,
        contenido: input.contenido,
        tipo,
      });
      const id_mensaje = mensajeCreado.id_mensaje;

      let ruta_imagen: string | undefined;
      if (tipo === "Imagen" && input.ruta_imagen) {
        await this.repository.guardarImagen({
          id_mensaje,
          ruta_imagen: input.ruta_imagen,
          nombre_archivo: input.nombre_archivo,
          tamano_kb: input.tamano_kb,
        });
        ruta_imagen = input.ruta_imagen;
      }

      const usuario = await this.repository.getUsuarioPorId(input.id_usuario);
      const nombreCompleto = usuario
        ? `${usuario.nombres} ${usuario.apellidos}`
        : "Usuario";

      return {
        success: true,
        mensaje: {
          id_mensaje,
          id_chat: input.id_chat,
          id_usuario: input.id_usuario,
          usuario: nombreCompleto,
          contenido: input.contenido,
          tipo,
          ruta_imagen,
          fecha_envio: new Date(),
        },
      };
    } catch (error) {
      console.error("Error en procesarMensaje:", error);
      return { success: false, message: "Error al procesar el mensaje" };
    }
  }

  async validarParticipante(
    id_chat: number,
    id_usuario: number,
  ): Promise<boolean> {
    return await this.repository.esParticipanteChat(id_chat, id_usuario);
  }
}

export default new LinkBO();
