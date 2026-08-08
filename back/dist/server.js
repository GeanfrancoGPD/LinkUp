"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const middleware_js_1 = __importDefault(require("./utils/middleware.js"));
const LinkRouter_js_1 = __importDefault(require("./module/LinkRouter.js"));
const socket_js_1 = __importDefault(require("./components/socket.js"));
// Rutas REST
middleware_js_1.default.use("/api/link", LinkRouter_js_1.default);
const port = Number(process.env.PORT) || 5000;
// Crear servidor HTTP (compartido por Express y Socket.IO)
const httpServer = http_1.default.createServer(middleware_js_1.default);
// Inicializar Socket.IO sobre el mismo servidor
socket_js_1.default.init(httpServer);
// Arrancar servidor
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Servidor HTTP + Socket ejecutandose en puerto ${port}`);
});
//# sourceMappingURL=server.js.map