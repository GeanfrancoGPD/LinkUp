import { Socket, Server as SocketIOServer } from "socket.io";
import LinkBO from "./LinkBO.js";
import { EVENTOS } from "../interfaces/socket-events.interface";

class LinkSocket {
  registrarHandlers(socket: Socket, io: SocketIOServer): void {
    socket.on(EVENTOS.UNIRSE_CHAT, (data) => this.unirseChat(socket, data));
    socket.on(EVENTOS.SALIR_CHAT, (data) => this.salirChat(socket, data));
    socket.on(EVENTOS.MENSAJE, (data, ack) =>
      this.enviarMensaje(socket, io, data, ack),
    );
    socket.on(EVENTOS.TYPING, (data) => this.typing(socket, data));
  }

  private async unirseChat(
    socket: Socket,
    data: { id_chat: number },
  ): Promise<void> {
    try {
      const id_usuario = socket.user?.id;
      const id_chat = Number(data?.id_chat);

      if (!id_usuario) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "No autenticado",
        });
        return;
      }

      if (!Number.isFinite(id_chat) || id_chat <= 0) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "id_chat inválido",
        });
        return;
      }

      const esParticipante = await LinkBO.validarParticipante(
        id_chat,
        id_usuario,
      );
      if (!esParticipante) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "No eres participante de este chat",
        });
        return;
      }

      const room = `chat:${id_chat}`;
      socket.join(room);

      socket.to(room).emit(EVENTOS.USUARIO_UNIDO, {
        id_chat,
        id_usuario,
        nombre_usuario: socket.user?.nombre,
      });

      console.log(`[Socket] Usuario ${id_usuario} se unió a la sala ${room}`);
    } catch (error) {
      console.error("Error en chat:unirse:", error);
      socket.emit(EVENTOS.ERROR, {
        success: false,
        message: "Error al unirse al chat",
      });
    }
  }

  private async salirChat(
    socket: Socket,
    data: { id_chat: number },
  ): Promise<void> {
    const id_usuario = socket.user?.id;
    const id_chat = Number(data?.id_chat);
    if (!id_usuario || !id_chat) return;

    const room = `chat:${id_chat}`;
    socket.leave(room);

    socket.to(room).emit(EVENTOS.USUARIO_SALIO, {
      id_chat,
      id_usuario,
      nombre_usuario: socket.user?.nombre || "",
    });
  }

  private async enviarMensaje(
    socket: Socket,
    io: SocketIOServer,
    data: {
      id_chat: number;
      contenido: string;
      tipo?: "Texto" | "Imagen";
      ruta_imagen?: string;
      nombre_archivo?: string;
      tamano_kb?: number;
    },
    ack?: (resp: any) => void,
  ): Promise<void> {
    try {
      const id_usuario = socket.user?.id;
      const id_chat = Number(data?.id_chat);

      if (!id_usuario) {
        const err = { success: false, message: "No autenticado" };
        socket.emit(EVENTOS.ERROR, err);
        ack?.(err);
        return;
      }

      if (
        !Number.isFinite(id_chat) ||
        id_chat <= 0 ||
        !data?.contenido?.trim()
      ) {
        const err = {
          success: false,
          message: "Datos del mensaje incompletos o inválidos",
        };
        socket.emit(EVENTOS.ERROR, err);
        ack?.(err);
        return;
      }

      // Validación del flujo: Requerir que la conexión esté unida a la sala del chat
      const room = `chat:${id_chat}`;
      if (!socket.rooms.has(room)) {
        const err = {
          success: false,
          message: "Debes unirte al chat primero (chat:unirse)",
        };
        socket.emit(EVENTOS.ERROR, err);
        ack?.(err);
        return;
      }

      const resultado = await LinkBO.procesarMensaje({
        id_chat,
        id_usuario,
        contenido: data.contenido.trim(),
        tipo: data.tipo,
        ruta_imagen: data.ruta_imagen,
        nombre_archivo: data.nombre_archivo,
        tamano_kb: data.tamano_kb,
      });

      if (!resultado.success) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: resultado.message,
        });
        ack?.(resultado);
        return;
      }

      io.to(room).emit(EVENTOS.NUEVO_MENSAJE, resultado.mensaje);
      ack?.({ success: true, data: resultado.mensaje });
    } catch (error) {
      console.error("Error en chat:mensaje:", error);
      const err = { success: false, message: "Error al procesar el mensaje" };
      socket.emit(EVENTOS.ERROR, err);
      ack?.(err);
    }
  }

  private typing(
    socket: Socket,
    data: { id_chat: number; escribiendo: boolean },
  ): void {
    const id_usuario = socket.user?.id;
    const id_chat = Number(data?.id_chat);
    if (!id_usuario || !id_chat) return;

    const room = `chat:${id_chat}`;
    socket.to(room).emit(EVENTOS.USUARIO_TYPING, {
      id_chat,
      id_usuario,
      nombre_usuario: socket.user?.nombre || "",
      escribiendo: data.escribiendo,
    });
  }
}

export default new LinkSocket();
