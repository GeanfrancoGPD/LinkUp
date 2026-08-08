import http from "http";
import app from "./utils/middleware.js";
import LinkRouter from "./module/LinkRouter.js";
import SocketServer from "./components/socket.js";

// Rutas REST
app.use("/api/link", LinkRouter);

const port: number = Number(process.env.PORT) || 5000;

// Crear servidor HTTP (compartido por Express y Socket.IO)
const httpServer = http.createServer(app);

// Inicializar Socket.IO sobre el mismo servidor
SocketServer.init(httpServer);

// Arrancar servidor
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Servidor HTTP + Socket ejecutandose en puerto ${port}`);
});
