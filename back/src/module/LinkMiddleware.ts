export function authMiddleware(req: any, res: any, next: any) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "No autorizado",
    });
  }

  next();
}
