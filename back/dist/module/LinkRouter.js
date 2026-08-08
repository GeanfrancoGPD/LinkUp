"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const LinkMiddleware_js_1 = require("./LinkMiddleware.js");
const LinkAuth_js_1 = __importDefault(require("./LinkAuth.js"));
const LinkBO_js_1 = __importDefault(require("./LinkBO.js"));
const router = express_1.default.Router();
// ==========================================
// AUTENTICACIÓN
// ==========================================
router.post("/login", async (req, res) => {
    await LinkAuth_js_1.default.login(req, res);
});
router.post("/register", async (req, res) => {
    await LinkAuth_js_1.default.register(req, res);
});
router.post("/logout", async (req, res) => {
    await LinkAuth_js_1.default.logout(req, res);
});
// ==========================================
// SOLICITUDES DE AMISTAD (todas protegidas)
// ==========================================
// Crear nueva solicitud de amistad
router.post("/solicitudes", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.enviarSolicitud(req, res);
});
// Listar solicitudes pendientes del usuario autenticado
router.get("/solicitudes/pendientes", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.listarSolicitudesPendientes(req, res);
});
router.get("/sugerencias", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.listarSugerencias(req, res);
});
// Aceptar solicitud
router.put("/solicitudes/aceptar", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.aceptarSolicitud(req, res);
});
// Rechazar solicitud
router.put("/solicitudes/rechazar", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.rechazarSolicitud(req, res);
});
// Cancelar solicitud (solo el emisor puede hacerlo)
router.delete("/solicitudes", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.cancelarSolicitud(req, res);
});
// ==========================================
// CHATS
// ==========================================
router.post("/chats/create", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.createChat(req, res);
});
router.get("/chats", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.getChatsPorUsuario(req, res);
});
router.delete("/chats/:id_chat", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.eliminarChat(req, res);
});
// ==========================================
// PERFIL DE USUARIO
// ==========================================
router.put("/profile", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkAuth_js_1.default.updateUser(req, res);
});
router.delete("/profile", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkAuth_js_1.default.deleteUser(req, res);
});
// ==========================================
// MENSAJES (historial)
// ==========================================
router.get("/chats/:id_chat/mensajes", LinkMiddleware_js_1.authMiddleware, async (req, res) => {
    await LinkBO_js_1.default.obtenerHistorialMensajes(req, res);
});
exports.default = router;
//# sourceMappingURL=LinkRouter.js.map