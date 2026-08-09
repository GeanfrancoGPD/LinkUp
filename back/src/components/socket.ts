import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { createHmac } from "crypto";
import dotenv from "dotenv";
import LinkSocket from "../module/LinkSocket.js";
import DB from "../components/DBComponent.js";

dotenv.config();

// Extendemos el tipo Socket con datos del usuario autenticado
declare module "socket.io" {
  interface Socket {
    user?: {
      id: number;
      nombre: string;
    };
  }
}

class SocketServer {
  private db: DB;
  private io: SocketIOServer | null = null;
  private readonly sessionSecret =
    process.env.SESSION_SECRET || "mi-clave-secreta";

  constructor() {
    this.db = new DB();
  }

  init(httpServer: HttpServer): SocketIOServer {
    const isProduction = process.env.NODE_ENV === "production";

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          "http://localhost:4200",
          "https://localhost",
          "capacitor://localhost",
        ],
        credentials: true,
      },
    });

    // Middleware de autenticación: valida el session ID
    // enviado por el cliente en el handshake (auth.sid)
    this.io.use(async (socket: Socket, next) => {
      try {
        const sid = this.resolveSessionId(socket);

        if (!sid) {
          return next(new Error("UNAUTHORIZED: session ID requerido"));
        }

        // Validar el session ID contra la tabla 'session' de Postgres
        const sessionData = await this.validateSession(sid);

        if (!sessionData?.user?.id) {
          return next(new Error("UNAUTHORIZED: sesion invalida"));
        }

        socket.user = {
          id: Number(sessionData.user.id),
          nombre: String(sessionData.user.nombre || ""),
        };

        next();
      } catch (error) {
        console.error("Error en middleware de socket:", error);
        next(new Error("UNAUTHORIZED"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(
        `Socket conectado: ${socket.id} | Usuario: ${socket.user?.nombre} (ID: ${socket.user?.id})`,
      );

      // =========================================================
      // MEJORA: Unir al socket a su sala personal de usuario
      // =========================================================
      if (socket.user?.id) {
        socket.join(`user_${socket.user.id}`);
      }

      LinkSocket.registrarHandlers(socket, this.io!);

      socket.on("disconnect", (reason) => {
        console.log(`Socket desconectado: ${socket.id} | Razon: ${reason}`);
      });
    });

    console.log("Socket.IO inicializado correctamente");
    return this.io;
  }

  private resolveSessionId(socket: Socket): string | null {
    const authSid = socket.handshake.auth?.sid;
    if (typeof authSid === "string" && authSid.trim() !== "") {
      return authSid.trim();
    }

    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const match = cookieHeader.match(/(?:^|;\s*)connect\.sid=([^;]+)/);
    if (!match?.[1]) {
      return null;
    }

    const decoded = decodeURIComponent(match[1]);
    if (!decoded.startsWith("s:")) {
      return null;
    }

    const signedValue = decoded.slice(2);
    const separatorIndex = signedValue.lastIndexOf(".");
    if (separatorIndex <= 0) {
      return null;
    }

    const rawSid = signedValue.slice(0, separatorIndex);
    const providedSignature = signedValue.slice(separatorIndex + 1);
    const expectedSignature = createHmac("sha256", this.sessionSecret)
      .update(rawSid)
      .digest("base64")
      .replace(/=+$/g, "");

    if (providedSignature !== expectedSignature) {
      return null;
    }

    return rawSid;
  }

  /**
   * Valida el session ID contra la tabla 'session' (connect-pg-simple).
   */
  private async validateSession(sid: string): Promise<any> {
    const result = await this.db.executeQuery(
      `SELECT sess, expire FROM "session" WHERE sid = $1 AND expire > NOW()`,
      [sid],
    );
    if (!result || result.length === 0) return null;
    return result[0].sess;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export default new SocketServer();
