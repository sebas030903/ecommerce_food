import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ✅ Verifica token y trae datos actuales desde MongoDB
export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("email role name");
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });
    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Error en requireAuth:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ✅ Verificar si el usuario tiene alguno de los roles indicados
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };
}

// ✅ Nuevo: permitir solo a admin o assistant
export function requireAdminOrAssistant(req, res, next) {
  if (!req.user || !["admin", "assistant"].includes(req.user.role)) {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  next();
}
