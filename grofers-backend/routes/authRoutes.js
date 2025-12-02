import express from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User.js";
import Order from "../models/Order.js";
import passport from "passport";
import "../utils/passportGoogle.js";
import { handleValidation } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/* ----------------- Helpers ----------------- */
function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "2d" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "30d" }
  );
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

/* ======================================================
   REGISTER
   (nombre solo letras, correo gmail/hotmail/outlook,
    contraseña >=8 visibles y al menos 1 número)
====================================================== */
router.post(
  "/register",
  [
    body("name")
      .isString()
      .trim()
      .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
      .withMessage("El nombre solo puede contener letras y espacios.")
      .isLength({ min: 2 })
      .withMessage("El nombre debe tener al menos 2 caracteres."),
    body("email")
      .isEmail()
      .withMessage("Correo inválido")
      .custom((value) => {
        if (!/@(gmail\.com|hotmail\.com|outlook\.com)$/i.test(value)) {
          throw new Error(
            "El correo debe terminar en @gmail.com, @hotmail.com o @outlook.com."
          );
        }
        return true;
      }),
    body("password").custom((value) => {
      const visible = value.replace(/\s/g, ""); // quita espacios normales e invisibles
      if (visible.length < 8) {
        throw new Error(
          "La contraseña debe tener al menos 8 caracteres (sin contar espacios)."
        );
      }
      if (!/\d/.test(visible)) {
        throw new Error("La contraseña debe incluir al menos un número.");
      }
      return true;
    }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const exists = await User.findOne({ email });
      if (exists)
        return res.status(409).json({ error: "Correo ya registrado" });

      const user = await User.create({ name, email, password });

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      user.refreshTokens = [refreshToken];
      await user.save();

      setRefreshCookie(res, refreshToken);
      const { password: pwd, refreshTokens, ...safeUser } = user._doc;

      return res.json({ user: safeUser, accessToken });
    } catch (err) {
      console.error("❌ Error REGISTER:", err);
      return res.status(500).json({ error: "Error interno" });
    }
  }
);

/* ======================================================
   LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    const { password: pwd, refreshTokens, ...safeUser } = user._doc;

    return res.json({ user: safeUser, accessToken });
  } catch (err) {
    console.error("❌ Error LOGIN:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ======================================================
   ME (perfil del usuario logueado)
====================================================== */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshTokens"
    );
    if (!user) return res.json({ user: null });

    return res.json({ user });
  } catch (err) {
    console.error("❌ Error ME:", err);
    return res.json({ user: null });
  }
});

/* ======================================================
   UPDATE PROFILE (nombre, país, teléfono, direcciones)
   PUT /api/auth/update
====================================================== */
router.put("/update", requireAuth, async (req, res) => {
  try {
    const allowedFields = ["name", "country", "phone", "addresses"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("❌ Error UPDATE PROFILE:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ======================================================
   CHANGE PASSWORD
   PUT /api/auth/change-password
====================================================== */
router.put(
  "/change-password",
  requireAuth,
  [
    body("currentPassword")
      .isLength({ min: 1 })
      .withMessage("La contraseña actual es obligatoria."),
    body("newPassword").custom((value) => {
      const visible = value.replace(/\s/g, "");
      if (visible.length < 8) {
        throw new Error(
          "La nueva contraseña debe tener al menos 8 caracteres (sin contar espacios)."
        );
      }
      if (!/\d/.test(visible)) {
        throw new Error("La nueva contraseña debe incluir al menos un número.");
      }
      return true;
    }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id).select("+password");
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return res
          .status(400)
          .json({ error: "La contraseña actual no es correcta" });
      }

      user.password = newPassword; // el pre-save del modelo se encarga de hashearla
      await user.save();

      return res.json({ message: "Contraseña cambiada correctamente" });
    } catch (err) {
      console.error("❌ Error CHANGE-PASSWORD:", err);
      return res.status(500).json({ error: "Error interno" });
    }
  }
);

/* ======================================================
   LOGOUT
====================================================== */
router.post("/logout", async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.json({ message: "Sesión cerrada correctamente" });
});

/* ======================================================
   DELETE ACCOUNT (usuario se elimina a sí mismo)
   DELETE /api/auth/delete-account
====================================================== */
router.delete("/delete-account", requireAuth, async (req, res) => {
  try {
    // Buscar usuario
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 1. Eliminar pedidos asociados (en Order guardas el email del usuario)
    await Order.deleteMany({ user: user.email });

    // 2. Eliminar el usuario
    await User.findByIdAndDelete(user._id);

    // 3. Limpiar cookie de refresh
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.json({ message: "Cuenta eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error DELETE-ACCOUNT:", err);
    return res
      .status(500)
      .json({ error: "Error al eliminar la cuenta. Inténtalo de nuevo." });
  }
});

/* ======================================================
   GOOGLE LOGIN
====================================================== */

// 1️⃣ Inicia login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// 2️⃣ Callback de Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`,
    session: true,
  }),
  (req, res) => {
    const user = req.user;
    const token = signAccessToken(user);

    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

export default router;
