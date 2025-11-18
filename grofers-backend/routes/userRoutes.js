import express from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/* =====================================================
   📌 GET - Lista de usuarios (solo ADMIN)
===================================================== */
router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const users = await User.find().sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("❌ Error GET /api/users", err);
    res.status(500).json({ error: "Error al cargar usuarios" });
  }
});


/* =====================================================
   📌 PATCH - Cambiar rol del usuario (solo ADMIN)
===================================================== */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(updated);
  } catch (err) {
    console.error("❌ Error PATCH /api/users/:id", err);
    res.status(500).json({ error: "Error actualizando usuario" });
  }
});


/* =====================================================
   📌 DELETE - Eliminar usuario (solo ADMIN)
===================================================== */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    console.error("❌ Error DELETE /api/users/:id", err);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});

export default router;
