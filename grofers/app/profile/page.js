"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // Obtener usuario
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/login");

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) return router.push("/login");

        setUser(data.user);
        setForm({
          name: data.user.name || "",
          country: data.user.country || "",
          phone: data.user.phone || "",
        });
      });
  }, [API, router]);

  const updateProfile = async () => {
    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${API}/api/auth/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) return toast.error(data.error);
    toast.success("Perfil actualizado ✔");
  };

  const changePassword = async () => {
    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${API}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passForm),
    });

    const data = await res.json();

    if (!res.ok) return toast.error(data.error);
    toast.success("Contraseña cambiada ✔");

    setPassForm({ currentPassword: "", newPassword: "" });
  };

  if (!user)
    return <p className="p-8 text-gray-700">Cargando perfil...</p>;

  return (
    <div className="p-10 max-w-3xl mx-auto bg-white shadow rounded">
      <h1 className="text-3xl font-bold text-green-600 mb-6">
        Mi Perfil 👤
      </h1>

      {/* DATOS */}
      <div className="space-y-4 mb-10">
        <h2 className="text-xl font-semibold">Información Personal</h2>

        <input
          className="w-full p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre"
        />

        <input
          className="w-full p-2 border rounded"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Teléfono"
        />

        <input
          className="w-full p-2 border rounded"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          placeholder="País"
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={updateProfile}
        >
          Guardar Cambios
        </button>
      </div>

      {/* CAMBIAR CONTRASEÑA */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cambiar Contraseña 🔐</h2>

        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="Contraseña actual"
          value={passForm.currentPassword}
          onChange={(e) =>
            setPassForm({ ...passForm, currentPassword: e.target.value })
          }
        />

        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="Nueva contraseña"
          value={passForm.newPassword}
          onChange={(e) =>
            setPassForm({ ...passForm, newPassword: e.target.value })
          }
        />

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={changePassword}
        >
          Actualizar Contraseña
        </button>
      </div>
    </div>
  );
}

