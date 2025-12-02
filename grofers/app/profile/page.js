"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "../_context/AuthContext";
import { useCart } from "../_context/UpdateCartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// 📍 Datos de ejemplo para departamentos / provincias / distritos
// Amplía esta estructura con todos los que necesites
const LOCATION_DATA = {
  Arequipa: {
    Arequipa: [
      "Arequipa",
      "Cercado",
      "Cayma",
      "Yanahuara",
      "José Luis Bustamante y Rivero",
      "Miraflores",
    ],
    Camana: ["Camaná"],
    Islay: ["Mollendo", "Mejía"],
  },
  Lima: {
    Lima: ["Lima", "Miraflores", "San Isidro", "Surco", "San Miguel"],
    Callao: ["Callao", "Bellavista", "La Perla"],
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { clearCart } = useCart();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    country: "",
    phone: "",
  });

  // Direcciones guardadas en el usuario
  const [addresses, setAddresses] = useState([]);

  // Formulario de nueva dirección
  const [addrLabel, setAddrLabel] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrDept, setAddrDept] = useState("");
  const [addrProv, setAddrProv] = useState("");
  const [addrDist, setAddrDist] = useState("");

  // Cambiar contraseña
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Provincias y distritos dinámicos
  const provinces = useMemo(
    () => (addrDept ? Object.keys(LOCATION_DATA[addrDept] || {}) : []),
    [addrDept]
  );
  const districts = useMemo(
    () =>
      addrDept && addrProv
        ? LOCATION_DATA[addrDept]?.[addrProv] || []
        : [],
    [addrDept, addrProv]
  );

  // Obtener usuario
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login?mode=login");
      return;
    }

    async function loadUser() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data.user) {
          router.push("/login?mode=login");
          return;
        }

        setUser(data.user);
        setForm({
          name: data.user.name || "",
          country: data.user.country || "Perú",
          phone: data.user.phone || "",
        });

        // addresses puede no existir todavía en tu modelo, así que usamos []
        setAddresses(data.user.addresses || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [API, router]);

  const validateNewPassword = (pwd) => {
    const visible = pwd.replace(/\s/g, ""); // quita espacios normales e invisibles
    if (visible.length < 8) {
      return "La nueva contraseña debe tener al menos 8 caracteres (sin contar espacios).";
    }
    if (!/\d/.test(visible)) {
      return "La nueva contraseña debe incluir al menos un número.";
    }
    return null;
  };

  const updateProfile = async (e) => {
    e?.preventDefault?.();

    if (
      !window.confirm(
        "¿Deseas guardar los cambios de tu información personal y direcciones?"
      )
    ) {
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login?mode=login");
      return;
    }

    try {
      setSavingProfile(true);

      const res = await fetch(`${API}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Enviamos también las direcciones
        body: JSON.stringify({
          ...form,
          addresses,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al actualizar perfil");
        return;
      }

      toast.success("Perfil actualizado ✔");
      // Opcional: refrescar user
      setUser((prev) => ({ ...(prev || {}), ...form, addresses }));
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al actualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e?.preventDefault?.();

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login?mode=login");
      return;
    }

    if (!passForm.currentPassword || !passForm.newPassword) {
      toast.error("Completa la contraseña actual y la nueva contraseña.");
      return;
    }

    const validationError = validateNewPassword(passForm.newPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (
      !window.confirm("¿Seguro que deseas actualizar tu contraseña?")
    ) {
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passForm),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "No se pudo cambiar la contraseña");
        return;
      }

      toast.success("Contraseña cambiada ✔");
      setPassForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al cambiar contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();

    if (!addrDept || !addrProv || !addrDist || !addrStreet.trim()) {
      toast.error("Completa todos los datos de la dirección");
      return;
    }

    const newAddress = {
      id: Date.now(), // id temporal para el frontend
      label: addrLabel || `Dirección ${addresses.length + 1}`,
      street: addrStreet.trim(),
      department: addrDept,
      province: addrProv,
      district: addrDist,
      isPrimary: addresses.length === 0, // la primera será principal
    };

    setAddresses((prev) => [...prev, newAddress]);
    setAddrLabel("");
    setAddrStreet("");
    setAddrDept("");
    setAddrProv("");
    setAddrDist("");

    toast.success("Dirección añadida (no olvides Guardar cambios)");
  };

  const handleDeleteAddress = (id) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetPrimary = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.id === id }))
    );
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login?mode=login");
      return;
    }

    const text = window.prompt(
      'Para eliminar tu cuenta escribe "DELETE" (en mayúsculas). Esta acción es irreversible.'
    );

    if (text !== "DELETE") {
      toast.error('Debes escribir exactamente "DELETE" para confirmar.');
      return;
    }

    if (!window.confirm("¿Estás totalmente seguro? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      setDeletingAccount(true);
      const res = await fetch(`${API}/api/auth/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "No se pudo eliminar la cuenta");
        setDeletingAccount(false);
        return;
      }

      toast.success("Cuenta eliminada correctamente");

      // limpiar contexto, carrito y token
      await logout();
      clearCart();
      localStorage.removeItem("accessToken");

      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al eliminar cuenta");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading || !user) {
    return (
      <p className="p-8 text-gray-700">
        Cargando perfil...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-16">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-6">
          Mi Perfil 👤
        </h1>

        {/* INFORMACIÓN PERSONAL + DIRECCIONES */}
        <form onSubmit={updateProfile} className="space-y-10">
          {/* Información Personal */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Información Personal
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Nombre completo
                </label>
                <input
                  className="w-full p-2 border rounded mt-1"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Correo
                </label>
                <input
                  className="w-full p-2 border rounded mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                  value={user.email || ""}
                  disabled
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Teléfono
                </label>
                <input
                  className="w-full p-2 border rounded mt-1"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="Teléfono"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  País
                </label>
                <input
                  className="w-full p-2 border rounded mt-1"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="País"
                />
              </div>
            </div>
          </section>

          {/* Direcciones */}
          <section id="addresses">
            <h2 className="text-xl font-semibold mb-4">
              Mis Direcciones 🏠
            </h2>

            {/* Lista de direcciones guardadas */}
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                Aún no tienes direcciones guardadas.
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {addr.label}{" "}
                        {addr.isPrimary && (
                          <span className="ml-1 text-xs text-green-600 border border-green-300 px-2 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-700">
                        {addr.street}
                      </p>
                      <p className="text-xs text-gray-500">
                        {addr.district}, {addr.province},{" "}
                        {addr.department}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {!addr.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(addr.id)}
                          className="px-3 py-1 text-xs border border-green-500 text-green-600 rounded-md hover:bg-green-50"
                        >
                          Marcar como principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="px-3 py-1 text-xs border border-red-500 text-red-600 rounded-md hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form para añadir nueva dirección */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold mb-3">
                Agregar nueva dirección
              </h3>

              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Nombre de la dirección
                  </label>
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Ej: Casa, Trabajo, Dirección 1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Departamento
                  </label>
                  <select
                    value={addrDept}
                    onChange={(e) => {
                      setAddrDept(e.target.value);
                      setAddrProv("");
                      setAddrDist("");
                    }}
                    className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="">
                      Selecciona departamento
                    </option>
                    {Object.keys(LOCATION_DATA).map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Provincia
                  </label>
                  <select
                    value={addrProv}
                    onChange={(e) => {
                      setAddrProv(e.target.value);
                      setAddrDist("");
                    }}
                    className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                    disabled={!addrDept}
                  >
                    <option value="">
                      {addrDept
                        ? "Selecciona provincia"
                        : "Selecciona un departamento primero"}
                    </option>
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Distrito
                  </label>
                  <select
                    value={addrDist}
                    onChange={(e) => setAddrDist(e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                    disabled={!addrProv}
                  >
                    <option value="">
                      {addrProv
                        ? "Selecciona distrito"
                        : "Selecciona una provincia primero"}
                    </option>
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700">
                  Dirección (calle, número, referencia)
                </label>
                <input
                  type="text"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Ej: Calle Lisboa 110, depto 301"
                />
              </div>

              <button
                type="button"
                onClick={handleAddAddress}
                className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
              >
                Añadir dirección
              </button>
            </div>
          </section>

          {/* Botón para guardar todo */}
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button
              type="submit"
              disabled={savingProfile}
              className={`px-6 py-2 rounded-md font-semibold text-white ${
                savingProfile
                  ? "bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className={`px-6 py-2 rounded-md font-semibold border text-sm ${
                deletingAccount
                  ? "border-red-300 text-red-300"
                  : "border-red-500 text-red-600 hover:bg-red-50"
              }`}
            >
              {deletingAccount
                ? "Eliminando cuenta..."
                : "Eliminar cuenta"}
            </button>
          </div>
        </form>

        {/* Cambiar contraseña */}
        <section className="mt-10 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">
            Cambiar Contraseña 🔐
          </h2>

          <form
            onSubmit={changePassword}
            className="space-y-4 max-w-md"
          >
            <input
              type="password"
              className="w-full p-2 border rounded"
              placeholder="Contraseña actual"
              value={passForm.currentPassword}
              onChange={(e) =>
                setPassForm({
                  ...passForm,
                  currentPassword: e.target.value,
                })
              }
            />

            <div>
              <input
                type="password"
                className="w-full p-2 border rounded"
                placeholder="Nueva contraseña"
                value={passForm.newPassword}
                onChange={(e) =>
                  setPassForm({
                    ...passForm,
                    newPassword: e.target.value,
                  })
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 8 caracteres visibles y al menos un número.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className={`bg-green-600 text-white px-4 py-2 rounded ${
                savingPassword ? "opacity-60" : "hover:bg-green-700"
              }`}
            >
              {savingPassword
                ? "Actualizando..."
                : "Actualizar Contraseña"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
