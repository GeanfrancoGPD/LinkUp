"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const LinkSocket_js_1 = __importDefault(require("../module/LinkSocket.js"));
const DBComponent_js_1 = __importDefault(require("../components/DBComponent.js"));
dotenv_1.default.config();
class SocketServer {
    db;
    io = null;
    constructor() {
        this.db = new DBComponent_js_1.default();
    }
    init(httpServer) {
        const isProduction = process.env.NODE_ENV === "production";
        this.io = new socket_io_1.Server(httpServer, {
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
        this.io.use(async (socket, next) => {
            try {
                const sid = socket.handshake.auth?.sid;
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
            }
            catch (error) {
                console.error("Error en middleware de socket:", error);
                next(new Error("UNAUTHORIZED"));
            }
        });
        this.io.on("connection", (socket) => {
            console.log(`Socket conectado: ${socket.id} | Usuario: ${socket.user?.nombre} (ID: ${socket.user?.id})`);
            LinkSocket_js_1.default.registrarHandlers(socket, this.io);
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
    async validateSession(sid) {
        const result = await this.db.executeQuery(`SELECT sess, expire FROM "session" WHERE sid = $1 AND expire > NOW()`, [sid]);
        if (!result || result.length === 0)
            return null;
        return result[0].sess;
    }
    getIO() {
        return this.io;
    }
}
exports.default = new SocketServer();
//# sourceMappingURL=socket.js.map