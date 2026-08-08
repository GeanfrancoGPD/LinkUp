"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LinkBO_js_1 = __importDefault(require("./LinkBO.js"));
const socket_events_interface_1 = require("../interfaces/socket-events.interface");
class LinkSocket {
    registrarHandlers(socket, io) {
        socket.on(socket_events_interface_1.EVENTOS.UNIRSE_CHAT, (data) => this.unirseChat(socket, data));
        socket.on(socket_events_interface_1.EVENTOS.SALIR_CHAT, (data) => this.salirChat(socket, data));
        socket.on(socket_events_interface_1.EVENTOS.MENSAJE, (data, ack) => this.enviarMensaje(socket, io, data, ack));
        socket.on(socket_events_interface_1.EVENTOS.TYPING, (data) => this.typing(socket, data));
    }
    async unirseChat(socket, data) {
        try {
            const id_usuario = socket.user?.id;
            if (!id_usuario) {
                socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                    success: false,
                    message: "No autenticado",
                });
                return;
            }
            if (!data?.id_chat || typeof data.id_chat !== "number") {
                socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                    success: false,
                    message: "id_chat invalido",
                });
                return;
            }
            const esParticipante = await LinkBO_js_1.default.validarParticipante(data.id_chat, id_usuario);
            if (!esParticipante) {
                socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                    success: false,
                    message: "No eres participante de este chat",
                });
                return;
            }
            const room = `chat:${data.id_chat}`;
            socket.join(room);
            socket.to(room).emit(socket_events_interface_1.EVENTOS.USUARIO_UNIDO, {
                id_chat: data.id_chat,
                id_usuario,
                nombre_usuario: socket.user?.nombre,
            });
            console.log(`Usuario ${id_usuario} se unio a ${room}`);
        }
        catch (error) {
            console.error("Error en chat:unirse:", error);
            socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                success: false,
                message: "Error al unirse al chat",
            });
        }
    }
    async salirChat(socket, data) {
        const id_usuario = socket.user?.id;
        const nombre_usuario = socket.user?.nombre || "";
        if (!id_usuario || !data?.id_chat)
            return;
        const room = `chat:${data.id_chat}`;
        socket.leave(room);
        socket.to(room).emit(socket_events_interface_1.EVENTOS.USUARIO_SALIO, {
            id_chat: data.id_chat,
            id_usuario,
            nombre_usuario,
        });
    }
    async enviarMensaje(socket, io, data, ack) {
        try {
            const id_usuario = socket.user?.id;
            if (!id_usuario) {
                socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                    success: false,
                    message: "No autenticado",
                });
                ack?.({ success: false, message: "No autenticado" });
                return;
            }
            if (!data?.id_chat || !data?.contenido?.trim()) {
                socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                    success: false,
                    message: "Datos del mensaje incompletos",
                });
                ack?.({ success: false, message: "Datos incompletos" });
                return;
            }
            const resultado = await LinkBO_js_1.default.procesarMensaje({
                id_chat: data.id_chat,
                id_usuario,
                contenido: data.contenido.trim(),
                tipo: data.tipo,
                ruta_imagen: data.ruta_imagen,
                nombre_archivo: data.nombre_archivo,
                tamano_kb: data.tamano_kb,
            });
            if (!resultado.success) {
                socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                    success: false,
                    message: resultado.message,
                });
                ack?.(resultado);
                return;
            }
            const room = `chat:${data.id_chat}`;
            io.to(room).emit(socket_events_interface_1.EVENTOS.NUEVO_MENSAJE, resultado.mensaje);
            ack?.({ success: true, data: resultado.mensaje });
        }
        catch (error) {
            console.error("Error en chat:mensaje:", error);
            socket.emit(socket_events_interface_1.EVENTOS.ERROR, {
                success: false,
                message: "Error al procesar el mensaje",
            });
            ack?.({ success: false, message: "Error interno" });
        }
    }
    typing(socket, data) {
        const id_usuario = socket.user?.id;
        if (!id_usuario || !data?.id_chat)
            return;
        const room = `chat:${data.id_chat}`;
        socket.to(room).emit(socket_events_interface_1.EVENTOS.USUARIO_TYPING, {
            id_chat: data.id_chat,
            id_usuario,
            nombre_usuario: socket.user?.nombre || "",
            escribiendo: data.escribiendo,
        });
    }
}
exports.default = new LinkSocket();
//# sourceMappingURL=LinkSocket.js.map