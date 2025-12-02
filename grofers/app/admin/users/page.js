"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE = 10; // usuarios por página

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  /* ============================================================
     🔐 Validación de ADMIN
  ============================================================ */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/login");

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!data.user) return router.push("/login");

        if (data.user.role !== "admin") {
          toast.error("Acceso denegado ❌");
          return router.push("/");
        }

        setCurrentUser(data.user);
      } catch (err) {
        router.push("/login");
      }
    };

    fetchUser();
  }, [API, router]);

  /* ============================================================
     👥 Cargar usuarios
  ============================================================ */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error cargando usuarios");

        setUsers(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API]);

  /* ============================================================
     🔁 Cambiar rol
  ============================================================ */
  const handleRoleChange = async (id, newRole) => {
    if (!confirm(`¿Cambiar rol a "${newRole}"?`)) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error actualizando rol");

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );

      toast.success("Rol actualizado correctamente ✔");
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ============================================================
     🗑 Eliminar usuario
  ============================================================ */
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error eliminando usuario");

      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("Usuario eliminado 🗑️");
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ============================================================
     FILTRO + PAGINACIÓN
  ============================================================ */
  const filtered = users.filter((u) => {
    const text = `${u.name || ""} ${u.email || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentUsers = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  /* ============================================================
     LOADING
  ============================================================ */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando usuarios...
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* ============================================================
         ENCABEZADO
      ============================================================ */}
      <h1 className="text-3xl font-bold text-green-700 mb-2">
        Gestión de Usuarios 👥
      </h1>
      <p className="text-gray-600 mb-6">
        Administra los usuarios, sus roles y permisos.
      </p>

      {/* ============================================================
         BOTONES DE NAVEGACIÓN DEL ADMIN
      ============================================================ */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link
          href="/admin"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          📦 Pedidos
        </Link>

        <Link
          href="/admin/users"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          👥 Usuarios
        </Link>

        <Link
          href="/admin/products"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          🛒 Productos
        </Link>

        <Link
          href="/admin/stats"
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          📊 Estadísticas
        </Link>
      </div>

      {/* ============================================================
         BUSCADOR
      ============================================================ */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-96 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {/* ============================================================
         TABLA DE USUARIOS
      ============================================================ */}
      {filtered.length === 0 ? (
        <p className="text-gray-600">
          {users.length === 0
            ? "No hay usuarios registrados."
            : "No se encontraron usuarios que coincidan con la búsqueda."}
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Correo</th>
                <th className="px-4 py-2 text-left">Rol</th>
                <th className="px-4 py-2 text-left">Registro</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.map((u) => {
                const displayName =
                  u.name || (u.email ? u.email.split("@")[0] : "Usuario");

                return (
                  <tr
                    key={u._id}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    {/* NOMBRE */}
                    <td className="px-4 py-2">{displayName}</td>

                    {/* EMAIL */}
                    <td className="px-4 py-2">{u.email}</td>

                    {/* ROL */}
                    <td className="px-4 py-2">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u._id, e.target.value)
                        }
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="assistant">Asistente</option>
                        <option value="user">Usuario</option>
                      </select>
                    </td>

                    {/* FECHA */}
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleString()
                        : "—"}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(u._id)}
                        disabled={currentUser?._id === u._id}
                        className={`px-3 py-1 rounded-md text-white text-sm ${
                          currentUser?._id === u._id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================
         PAGINACIÓN
      ============================================================ */}
      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            ← Anterior
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const num = i + 1;
            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  num === currentPage
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-blue-50"
                }`}
              >
                {num}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
