"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/api/orders/my-orders`, {
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
  }, [API, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando tus pedidos...
      </div>
    );
  }

  return (
    <div className="p-8 md:px-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-green-700 mb-6">🧾 Mis Pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">No tienes pedidos todavía.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow-md rounded-lg p-6 border"
            >
              <div className="flex justify-between">
                <h2 className="font-semibold text-lg">
                  Pedido #{order._id.slice(-6)}
                </h2>
                <span className="text-gray-500 text-sm">
                  {new Date(order.date).toLocaleString()}
                </span>
              </div>

              <p className="mt-2 text-green-700 font-bold">
                Total: ${order.total.toFixed(2)}
              </p>

              <h3 className="mt-4 font-semibold">Productos</h3>
              <ul className="list-disc pl-6 text-gray-700">
                {order.cart.map((item, i) => (
                  <li key={i}>
                    {item.title} x{item.quantity} — $
                    {(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-sm text-gray-600">
                Dirección:{" "}
                {order.address?.street
                  ? `${order.address.street}, ${order.address.city}`
                  : "No especificada"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
