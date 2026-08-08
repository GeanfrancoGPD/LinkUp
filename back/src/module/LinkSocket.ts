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
      if (!id_usuario) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "No autenticado",
        });
        return;
      }

      if (!data?.id_chat || typeof data.id_chat !== "number") {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "id_chat invalido",
        });
        return;
      }

      const esParticipante = await LinkBO.validarParticipante(
        data.id_chat,
        id_usuario,
      );

      if (!esParticipante) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "No eres participante de este chat",
        });
        return;
      }

      const room = `chat:${data.id_chat}`;
      socket.join(room);

      socket.to(room).emit(EVENTOS.USUARIO_UNIDO, {
        id_chat: data.id_chat,
        id_usuario,
        nombre_usuario: socket.user?.nombre,
      });

      console.log(`Usuario ${id_usuario} se unio a ${room}`);
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
    const nombre_usuario = socket.user?.nombre || "";
    if (!id_usuario || !data?.id_chat) return;

    const room = `chat:${data.id_chat}`;
    socket.leave(room);

    socket.to(room).emit(EVENTOS.USUARIO_SALIO, {
      id_chat: data.id_chat,
      id_usuario,
      nombre_usuario,
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
      if (!id_usuario) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "No autenticado",
        });
        ack?.({ success: false, message: "No autenticado" });
        return;
      }

      if (!data?.id_chat || !data?.contenido?.trim()) {
        socket.emit(EVENTOS.ERROR, {
          success: false,
          message: "Datos del mensaje incompletos",
        });
        ack?.({ success: false, message: "Datos incompletos" });
        return;
      }

      const resultado = await LinkBO.procesarMensaje({
        id_chat: data.id_chat,
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

      const room = `chat:${data.id_chat}`;
      io.to(room).emit(EVENTOS.NUEVO_MENSAJE, resultado.mensaje);
      ack?.({ success: true, data: resultado.mensaje });
    } catch (error) {
      console.error("Error en chat:mensaje:", error);
      socket.emit(EVENTOS.ERROR, {
        success: false,
        message: "Error al procesar el mensaje",
      });
      ack?.({ success: false, message: "Error interno" });
    }
  }

  private typing(
    socket: Socket,
    data: { id_chat: number; escribiendo: boolean },
  ): void {
    const id_usuario = socket.user?.id;
    if (!id_usuario || !data?.id_chat) return;

    const room = `chat:${data.id_chat}`;
    socket.to(room).emit(EVENTOS.USUARIO_TYPING, {
      id_chat: data.id_chat,
      id_usuario,
      nombre_usuario: socket.user?.nombre || "",
      escribiendo: data.escribiendo,
    });
  }
}

export default new LinkSocket();
