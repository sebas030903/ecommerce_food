"use client";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "../_context/UpdateCartContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CartPage() {
  const {
    cart,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============================================================
    PAYMENT
  ============================================================ */
  const handlePayment = async () => {
    if (!cart.length) return toast.error("Tu carrito está vacío 🛒");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Inicia sesión para proceder al pago 🧾");
      return router.push("/login?mode=login");
    }

    if (!address || !city || !postal) {
      return toast.error("Completa todos los campos de dirección 🏠");
    }

    try {
      setLoading(true);
      toast.loading("Procesando pedido...");

      const orderRes = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cart,
          total,
          shipping: { address, city, postal },
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error || "Error al registrar pedido");
      }

      const stockRes = await fetch(`${API}/api/products/reduce-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });

      if (!stockRes.ok) {
        const data = await stockRes.json();
        throw new Error(data.error || "Error al actualizar stock");
      }

      toast.dismiss();
      toast.success("Pedido registrado correctamente ✔");

      clearCart();
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || "Error en la compra");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
    EMPTY CART
  ============================================================ */
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-gray-600">
        <Image src="/empty-cart.svg" alt="Carrito vacío" width={250} height={250} />
        <h2 className="mt-4 text-2xl font-semibold">Tu carrito está vacío 🛒</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition"
        >
          Ir a comprar
        </button>
      </div>
    );
  }

  /* ============================================================
    MAIN CART
  ============================================================ */
  return (
    <div className="p-6 md:p-12 lg:px-20 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-green-600">🛍️ Tu Carrito</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* ===================== PRODUCT LIST ===================== */}
        <div className="md:col-span-2 space-y-5">
          {cart.map((item) => {
            const productId = item._id || item.id; // 🔥 FIX ID

            return (
              <motion.div
                key={productId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-lg transition"
              >
                {/* === IMAGE + INFO === */}
                <div className="flex items-center gap-5">
                  <div className="relative w-[80px] h-[80px] group">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-green-600 font-bold">${item.price}</p>

                    {/* === QUANTITY === */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => decreaseQuantity(productId)}
                        className="px-3 py-1 bg-gray-200 rounded-md text-lg hover:bg-gray-300"
                      >
                        –
                      </button>

                      <span className="font-semibold text-gray-800">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => {
                          if (item.quantity >= item.stock) {
                            toast.error("No hay más stock ❌");
                            return;
                          }
                          addToCart(item);
                        }}
                        className="px-3 py-1 bg-gray-200 rounded-md text-lg hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Stock disponible: {item.stock}
                    </p>
                  </div>
                </div>

                {/* === REMOVE PRODUCT === */}
                <button
                  onClick={() => {
                    removeFromCart(productId);
                    toast.success("Producto eliminado 🗑️");
                  }}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  ✖ Eliminar
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ===================== SUMMARY ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-md rounded-xl p-6 border border-gray-200 h-fit"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Dirección de envío 🏠
          </h2>

          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Dirección (ej: Av. Ejército 123)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            />

            <input
              type="text"
              placeholder="Ciudad (ej: Arequipa)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            />

            <input
              type="text"
              placeholder="Código postal"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              className="w-full border p-2 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Resumen del pedido
          </h3>

          <div className="text-gray-700 space-y-2">
            <p className="flex justify-between">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </p>

            <p className="flex justify-between">
              <span>Envío:</span>
              <span>Gratis 🚚</span>
            </p>

            <p className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full mt-5 py-2 rounded-md font-semibold text-white transition-all ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Procesando..." : "Finalizar compra 💳"}
          </button>

          <button
            onClick={clearCart}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
          >
            Vaciar carrito
          </button>
        </motion.div>
      </div>
    </div>
  );
}
