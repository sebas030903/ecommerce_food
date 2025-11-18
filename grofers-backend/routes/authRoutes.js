import express from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import User from "../models/User.js";
import passport from "passport";
import "../utils/passportGoogle.js";
import { handleValidation } from "../middleware/validate.js";

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
====================================================== */
router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 2 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ error: "Correo ya registrado" });

      const user = await User.create({ name, email, password });

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      user.refreshTokens = [refreshToken];
      await user.save();

      setRefreshCookie(res, refreshToken);
      const { password: pwd, refreshTokens, ...safeUser } = user._doc;

      return res.json({ user: safeUser, accessToken });
    } catch (err) {
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
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    const { password: pwd, refreshTokens, ...safeUser } = user._doc;

    return res.json({ user: safeUser, accessToken });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
});

/* ======================================================
   ME
====================================================== */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.json({ user: null });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    return res.json({ user });
  } catch {
    return res.json({ user: null });
  }
});

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
