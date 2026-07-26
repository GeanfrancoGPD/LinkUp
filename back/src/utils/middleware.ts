import session from "express-session";
import express from "express";
import cors from "cors";

const app = express();

// --- CORS global ---

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://localhost", // Agregado para Capacitor Android
      "capacitor://localhost", // Agregado para Capacitor IOS
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// JSON
app.use(express.json());

app.use(
  session({
    secret: "mi-clave-secreta",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: true, // OBLIGATORIO para móviles en producción (requiere HTTPS)
      sameSite: "none",
      maxAge: 1000 * 60 * 60,
    },
  }),
);

export default app;
