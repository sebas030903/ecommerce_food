"use client";
import { useEffect } from "react";
import { useCart } from "../_context/UpdateCartContext";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SuccessPage() {
  const { clearCart } = useCart();

  // 🧹 Limpiar carrito automáticamente al entrar
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl md:text-4xl font-bold text-green-600 mb-4"
      >
        ¡Pedido registrado con éxito! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-gray-700 text-lg mb-8 max-w-md"
      >
        Gracias por tu compra. Pronto recibirás los detalles del pedido en tu
        correo electrónico.
      </motion.p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/orders"
          className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition font-semibold"
        >
          Ver mis pedidos
        </Link>

        <Link
          href="/"
          className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
