import express from "express";
import { authMiddleware } from "./LinkMiddleware.js";
import LinkAuth from "./LinkAuth.js";
import LinkBO from "./LinkBO.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  await LinkAuth.login(req, res);
});

router.post("/register", async (req, res) => {
  await LinkAuth.register(req, res);
});

router.put("/profile", authMiddleware, async (req, res) => {
  await LinkAuth.updateUser(req, res);
});

router.query?.("/hola", async (req, res) => {
  return res.status(200).json({ message: "Hola desde el router!" });
});

// router.put("/profile", authMiddleware, async (req, res) => {
//   await LinkAuth.updateProfile(req, res);
// });

// router.delete("/profile", authMiddleware, async (req, res) => {
//   await LinkAuth.deleteProfile(req, res);
// });

export default router;
