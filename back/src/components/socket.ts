import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
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

    // Middleware de autenticacion: valida el session ID
    // enviado por el cliente en el handshake (auth.sid)
    this.io.use(async (socket: Socket, next) => {
      try {
        const sid = socket.handshake.auth?.sid as string | undefined;

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
      LinkSocket.registrarHandlers(socket, this.io!);

      socket.on("disconnect", (reason) => {
        console.log(`Socket desconectado: ${socket.id} | Razon: ${reason}`);
      });
    });

    console.log("Socket.IO inicializado correctamente");
    return this.io;
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
