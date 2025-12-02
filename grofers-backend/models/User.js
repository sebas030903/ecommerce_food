import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    country: { type: String, default: "Perú" },

    phone: {
      type: String,
      validate: {
        validator: function (v) {
          // Permite campo vacío o formato +51 9xxxxxxx
          if (!v) return true;
          return /^\+51\s?9\d{8}$/.test(v);
        },
        message:
          "Teléfono inválido. Debe comenzar con +51 y tener 9 dígitos.",
      },
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        // ⬅️ SOLO obligatorio si NO viene de Google
        return !this.googleId;
      },
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "assistant", "admin"],
      default: "user",
    },

    googleId: {
      type: String,
      default: null,
    },

    // 🏠 Direcciones del usuario (para el perfil)
    addresses: [
      {
        label: { type: String, trim: true },        // "Casa", "Trabajo", "Dirección 1"
        street: { type: String, trim: true },       // Calle, número, referencia
        department: { type: String, trim: true },   // Departamento
        province: { type: String, trim: true },     // Provincia
        district: { type: String, trim: true },     // Distrito
        isPrimary: { type: Boolean, default: false }
      },
    ],

    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

/* ================================================
   🔐 Encriptar contraseña solo si existe y fue modificada
================================================ */
userSchema.pre("save", async function (next) {
  // Si NO hay password (usuario Google), continuar
  if (!this.password) return next();

  // Si el password NO ha sido modificado, continuar
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

/* ================================================
   🔍 Comparar contraseña (solo para usuarios con password)
================================================ */
userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return false; // Google users
  return bcrypt.compare(candidate, this.password);
};

/* ================================================
   🧹 Remover campos sensibles del JSON de respuesta
================================================ */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

export default mongoose.model("User", userSchema);
