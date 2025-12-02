"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/_context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { login } = useAuth();

  const initialMode = useMemo(() => {
    const m = (search.get("mode") || "register").toLowerCase();
    return m === "login" ? "login" : "register";
  }, [search]);

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => setMode(initialMode), [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    // 🔐 VALIDACIONES SOLO PARA CREAR CUENTA
    if (mode === "register") {
      // 1) Validar nombre: solo letras y espacios
      const nameTrimmed = name.trim();
      const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

      if (!nameTrimmed || !nameRegex.test(nameTrimmed)) {
        const msg = "El nombre solo puede contener letras y espacios.";
        setErr(msg);
        toast.error(msg);
        return;
      }

      // 2) Validar correo: solo gmail/hotmail/outlook
      const emailRegex =
        /^[^\s@]+@(gmail\.com|hotmail\.com|outlook\.com)$/i;

      if (!emailRegex.test(email)) {
        const msg =
          "El correo debe terminar en @gmail.com, @hotmail.com o @outlook.com.";
        setErr(msg);
        toast.error(msg);
        return;
      }

      // 3) Validar contraseña:
      //    - mínimo 8 caracteres visibles (ignorando espacios)
      //    - al menos 1 número
      const passwordVisible = password.replace(/\s/g, ""); // quita espacios y espacios invisibles

      if (passwordVisible.length < 8) {
        const msg =
          "La contraseña debe tener al menos 8 caracteres (sin contar espacios).";
        setErr(msg);
        toast.error(msg);
        return;
      }

      if (!/\d/.test(passwordVisible)) {
        const msg = "La contraseña debe incluir al menos un número.";
        setErr(msg);
        toast.error(msg);
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload =
        mode === "register"
          ? { name, email, password }
          : { email, password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error);
        toast.error(data.error);
        return;
      }

      // Guardar usuario global
      login(data.user, data.accessToken);

      toast.success(
        mode === "login"
          ? "Sesión iniciada correctamente"
          : "Cuenta creada 🎉"
      );

      router.push("/");
    } catch {
      toast.error("Error de conexión al servidor");
      setErr("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = () =>
    (window.location.href = `${API}/api/auth/google`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center text-green-600">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        {err && (
          <div className="mt-4 bg-red-100 text-red-700 text-sm rounded-md p-3">
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded-md p-2"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded-md p-2"
              required
            />
            {mode === "register" && (
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 8 caracteres visibles y al menos un número.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-semibold text-white ${
              loading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs text-gray-500">o</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <button
          onClick={loginGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-2 rounded-md hover:bg-gray-50"
        >
          <img src="/google-icon.svg" className="w-5 h-5" />
          <span>Iniciar con Google</span>
        </button>

        <p className="text-sm text-gray-600 mt-5 text-center">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            className="text-green-600 font-semibold hover:underline"
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
