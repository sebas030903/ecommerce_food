"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminStatsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [range, setRange] = useState("all"); // all | 7 | 30

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  /* ============================================================
     🔐 Validar solo ADMIN
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

  /* ============================================================
     📈 Cargar pedidos
  ============================================================ */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar pedidos");
        setOrders(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [API]);

  /* ============================================================
     📊 Cálculos de estadísticas (según filtro de fecha)
  ============================================================ */
  const stats = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        totalItems: 0,
        avgItemsPerOrder: 0,
        topProducts: [],
        filteredOrders: [],
      };
    }

    // Filtrar por rango de días
    const now = Date.now();
    const filteredOrders = orders.filter((o) => {
      if (range === "all") return true;
      const days = range === "7" ? 7 : 30;
      const diffMs = now - new Date(o.date).getTime();
      const limitMs = days * 24 * 60 * 60 * 1000;
      return diffMs <= limitMs;
    });

    if (!filteredOrders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        totalItems: 0,
        avgItemsPerOrder: 0,
        topProducts: [],
        filteredOrders: [],
      };
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgTicket = totalRevenue / totalOrders;

    // productos más vendidos + total de items
    const productMap = {};
    let totalItems = 0;

    filteredOrders.forEach((o) => {
      o.cart.forEach((item) => {
        totalItems += item.quantity;
        if (!productMap[item.title]) {
          productMap[item.title] = 0;
        }
        productMap[item.title] += item.quantity;
      });
    });

    const avgItemsPerOrder = totalItems / totalOrders;

    const topProducts = Object.entries(productMap)
      .map(([title, qty]) => ({ title, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      avgTicket,
      totalItems,
      avgItemsPerOrder,
      topProducts,
      filteredOrders,
    };
  }, [orders, range]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando estadísticas...
      </div>
    );

  const rangeLabel =
    range === "all"
      ? "todo el histórico"
      : range === "7"
      ? "últimos 7 días"
      : "últimos 30 días";

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* ============================================================
          HEADER + NAV
      ============================================================ */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-700">
            Estadísticas del sistema 📊
          </h1>
          <p className="text-gray-600">
            Resumen de ventas, pedidos y productos más vendidos ({rangeLabel}).
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Admin: <span className="font-semibold">{user.email}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
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
      </div>

      {/* ============================================================
          FILTRO DE RANGO
      ============================================================ */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-700 font-medium">
          Rango de análisis:
        </span>
        <button
          onClick={() => setRange("all")}
          className={`px-3 py-1 rounded-full text-sm border ${
            range === "all"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Todo
        </button>
        <button
          onClick={() => setRange("7")}
          className={`px-3 py-1 rounded-full text-sm border ${
            range === "7"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Últimos 7 días
        </button>
        <button
          onClick={() => setRange("30")}
          className={`px-3 py-1 rounded-full text-sm border ${
            range === "30"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Últimos 30 días
        </button>
      </div>

      {/* ============================================================
          CARDS PRINCIPALES
      ============================================================ */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Ingresos totales</p>
          <p className="text-3xl font-bold text-green-600">
            ${stats.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Pedidos totales</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Ticket promedio</p>
          <p className="text-3xl font-bold text-purple-600">
            ${stats.avgTicket.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <p className="text-gray-500 text-sm">Ítems por pedido</p>
          <p className="text-3xl font-bold text-orange-500">
            {stats.avgItemsPerOrder.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total ítems vendidos: {stats.totalItems}
          </p>
        </div>
      </div>

      {/* ============================================================
          TOP PRODUCTOS + ÚLTIMOS PEDIDOS
      ============================================================ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* TOP PRODUCTOS */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            🏆 Productos más vendidos
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-gray-600">No hay datos suficientes.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topProducts.map((p) => (
                <li
                  key={p.title}
                  className="flex justify-between items-center border-b last:border-b-0 pb-2"
                >
                  <span className="font-medium text-gray-800">{p.title}</span>
                  <span className="text-sm text-gray-600">
                    {p.qty} unidades vendidas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ÚLTIMOS PEDIDOS */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">📅 Últimos pedidos</h2>
          {stats.filteredOrders.length === 0 ? (
            <p className="text-gray-600">No hay pedidos en este rango.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.filteredOrders
                    .slice(0, 10)
                    .map((o) => (
                      <tr key={o._id} className="border-b last:border-b-0">
                        <td className="py-1 pr-2">{o.user}</td>
                        <td className="py-1 pr-2 text-gray-600">
                          {new Date(o.date).toLocaleString()}
                        </td>
                        <td className="py-1 font-semibold text-green-600">
                          ${o.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
