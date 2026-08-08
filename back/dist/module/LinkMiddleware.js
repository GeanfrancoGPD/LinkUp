"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
function authMiddleware(req, res, next) {
    console.log("[AuthMiddleware] request a ruta protegida, session:", req.session?.user);
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "No autorizado",
        });
    }
    next();
}
//# sourceMappingURL=LinkMiddleware.js.map