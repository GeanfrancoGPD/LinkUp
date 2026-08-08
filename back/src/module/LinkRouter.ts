import express from "express";
import { authMiddleware } from "./LinkMiddleware.js";
import LinkAuth from "./LinkAuth.js";
import LinkBO from "./LinkBO.js";

const router = express.Router();

// ==========================================
// AUTENTICACIÓN
// ==========================================

router.post("/login", async (req, res) => {
  await LinkAuth.login(req, res);
});

router.post("/register", async (req, res) => {
  await LinkAuth.register(req, res);
});

router.post("/logout", async (req, res) => {
  await LinkAuth.logout(req, res);
});

// ==========================================
// SOLICITUDES DE AMISTAD (todas protegidas)
// ==========================================

// Crear nueva solicitud de amistad
router.post("/solicitudes", authMiddleware, async (req, res) => {
  await LinkBO.enviarSolicitud(req, res);
});

// Listar solicitudes pendientes del usuario autenticado
router.get("/solicitudes/pendientes", authMiddleware, async (req, res) => {
  await LinkBO.listarSolicitudesPendientes(req, res);
});

router.get("/sugerencias", authMiddleware, async (req, res) => {
  await LinkBO.listarSugerencias(req, res);
});

// Aceptar solicitud
router.put("/solicitudes/aceptar", authMiddleware, async (req, res) => {
  await LinkBO.aceptarSolicitud(req, res);
});

// Rechazar solicitud
router.put("/solicitudes/rechazar", authMiddleware, async (req, res) => {
  await LinkBO.rechazarSolicitud(req, res);
});

// Cancelar solicitud (solo el emisor puede hacerlo)
router.delete("/solicitudes", authMiddleware, async (req, res) => {
  await LinkBO.cancelarSolicitud(req, res);
});

// ==========================================
// CHATS
// ==========================================

router.post("/chats/create", authMiddleware, async (req, res) => {
  await LinkBO.createChat(req, res);
});

router.get("/chats", authMiddleware, async (req, res) => {
  await LinkBO.getChatsPorUsuario(req, res);
});

router.delete("/chats/:id_chat", authMiddleware, async (req, res) => {
  await LinkBO.eliminarChat(req, res);
});

// ==========================================
// PERFIL DE USUARIO
// ==========================================

router.put("/profile", authMiddleware, async (req, res) => {
  await LinkAuth.updateUser(req, res);
});

router.delete("/profile", authMiddleware, async (req, res) => {
  await LinkAuth.deleteUser(req, res);
});

// ==========================================
// MENSAJES (historial)
// ==========================================

router.get("/chats/:id_chat/mensajes", authMiddleware, async (req, res) => {
  await LinkBO.obtenerHistorialMensajes(req, res);
});

export default router;
