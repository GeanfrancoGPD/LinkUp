"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Session {
    async createSession(sessionObject, user) {
        const currentUser = user[0];
        if (!currentUser) {
            sessionObject.response.status(400).json({
                success: false,
                message: "No se proporcionó información de usuario válida",
            });
            return;
        }
        // TypeScript YA RECONOCE session.user automáticamente aquí
        sessionObject.request.session.user = {
            id: currentUser.id,
            email: currentUser.email,
            nombre: currentUser.nombre,
            tipo: String(currentUser.tipo || "")
                .trim()
                .toUpperCase(),
        };
        sessionObject.response.json({
            success: true,
            message: "Se ha iniciado sesión correctamente",
            user: sessionObject.request.session.user,
        });
    }
    sessionExist(sessionObject) {
        return Boolean(sessionObject.request.session.user);
    }
    destroySession(sessionObject) {
        sessionObject.request.session.destroy((error) => {
            if (error) {
                sessionObject.response.status(500).json({
                    success: false,
                    message: "Error al cerrar sesión",
                });
                return;
            }
            sessionObject.response.json({
                success: true,
                message: "Sesión cerrada exitosamente",
            });
        });
    }
}
exports.default = new Session();
//# sourceMappingURL=session.js.map