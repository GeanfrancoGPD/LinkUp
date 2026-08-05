import { Request, Response } from "express";
import LinkRepository from "./LinkRepository.js";

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

      const solicitudes =
        await this.repository.getSolicitudesPendientes(id_usuario_recibe);

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
}

export default new LinkBO();
