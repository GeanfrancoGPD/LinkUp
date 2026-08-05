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

export default router;
