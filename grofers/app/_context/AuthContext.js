"use client";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  /* ============================
     CARGAR USUARIO AL INICIAR
  ============================ */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const data = await res.json();

        if (data?.user) {
          // 🔥 Asegurar que el usuario tenga TODOS los datos
          setUser({
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,  // 🔥 IMPORTANTE
          });
        } else {
          localStorage.removeItem("accessToken");
        }
      } catch (err) {
        localStorage.removeItem("accessToken");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [API]);

  /* ============================
     LOGIN
  ============================ */
  const login = (userData, token) => {
    localStorage.setItem("accessToken", token);

    // 🔥 Guardar usuario completo con rol
    setUser({
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role, // 🔥 IMPORTANTE
    });
  };

  /* ============================
     LOGOUT
  ============================ */
  const logout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
