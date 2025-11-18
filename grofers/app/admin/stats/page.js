"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminStatsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // 🔐 Validar admin
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
      } catch (err) {
        router.push("/login");
      }
    };

    fetchUser();
  }, [API, router]);

  // 📈 Cargar pedidos
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

  // 📊 Cálculos de estadísticas
  const stats = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgTicket: 0,
        topProducts: [],
      };
    }

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgTicket = totalRevenue / totalOrders;

    // productos más vendidos
    const productMap = {};
    orders.forEach((o) => {
      o.cart.forEach((item) => {
        if (!productMap[item.title]) {
          productMap[item.title] = 0;
        }
        productMap[item.title] += item.quantity;
      });
    });

    const topProducts = Object.entries(productMap)
      .map(([title, qty]) => ({ title, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { totalRevenue, totalOrders, avgTicket, topProducts };
  }, [orders]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando estadísticas...
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER + NAV */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-700">
            Estadísticas del sistema 📊
          </h1>
          <p className="text-gray-600">
            Resumen de ventas, pedidos y productos más vendidos.
          </p>
        </div>

        <div className="flex gap-3">
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

      {/* CARDS PRINCIPALES */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
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
      </div>

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
    </div>
  );
}
