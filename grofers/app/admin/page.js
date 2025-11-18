"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // =====================================================
  // 🔐 Validar ADMIN
  // =====================================================
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
          router.push("/");
          return;
        }

        setUser(data.user);
      } catch (err) {
        router.push("/login");
      }
    };

    fetchUser();
  }, [API, router]);

  // =====================================================
  // 📦 Cargar pedidos
  // =====================================================
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setOrders(data);
      } catch (err) {
        toast.error("Error al cargar pedidos");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [API]);

  // =====================================================
  // 🗑 Eliminar pedido
  // =====================================================
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este pedido?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Pedido eliminado 🗑️");
      setOrders(orders.filter((o) => o._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // =====================================================
  // ⏳ Loading
  // =====================================================
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando panel...
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* =====================================================
          HEADER DEL PANEL
      ===================================================== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700">
          Panel de Administración 🧾
        </h1>
        <p className="text-gray-600">Bienvenido, {user?.email}</p>
      </div>

      {/* =====================================================
          BOTONES DE NAVEGACIÓN
      ===================================================== */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Link
          href="/admin"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          📦 Pedidos
        </Link>

        <Link
          href="/admin/users"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          👥 Usuarios
        </Link>

        <Link
          href="/admin/products"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          🛒 Productos
        </Link>

        <Link
          href="/admin/stats"
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          📊 Estadísticas
        </Link>
      </div>

      {/* =====================================================
          LISTA DE PEDIDOS
      ===================================================== */}
      {orders.length === 0 ? (
        <p className="text-gray-600">No hay pedidos registrados.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Correo</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Dirección</th>
                <th className="px-4 py-2 text-left">Productos</th>
                <th className="px-4 py-2 text-center">Acción</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b hover:bg-gray-100 transition"
                >
                  <td className="px-4 py-2">{order.user}</td>

                  <td className="px-4 py-2 text-gray-600">
                    {order.email || "—"}
                  </td>

                  <td className="px-4 py-2 font-semibold text-green-700">
                    ${order.total.toFixed(2)}
                  </td>

                  <td className="px-4 py-2">
                    {new Date(order.date).toLocaleString()}
                  </td>

                  <td className="px-4 py-2">
                    {order.address?.street
                      ? `${order.address.street}, ${order.address.city}`
                      : "No especificada"}
                  </td>

                  <td className="px-4 py-2">
                    <ul className="text-sm text-gray-700 list-disc pl-4">
                      {order.cart.map((item, i) => (
                        <li key={i}>
                          {item.title} x{item.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>

                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}
