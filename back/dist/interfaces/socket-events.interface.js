"use strict";
// ==========================================
// AUTENTICACIÓN DE SOCKET (handshake)
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTOS = void 0;
// ==========================================
// NOMBRES DE EVENTOS (constantes para evitar typos)
// ==========================================
exports.EVENTOS = {
    UNIRSE_CHAT: "chat:unirse",
    SALIR_CHAT: "chat:salir",
    MENSAJE: "chat:mensaje",
    TYPING: "chat:typing",
    NUEVO_MENSAJE: "chat:mensaje",
    USUARIO_TYPING: "chat:typing",
    USUARIO_UNIDO: "chat:union",
    USUARIO_SALIO: "chat:salida",
    ERROR: "chat:error",
};
//# sourceMappingURL=socket-events.interface.js.map