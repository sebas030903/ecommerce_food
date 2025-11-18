"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../_context/UpdateCartContext";
import { useAuth } from "../_context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { cart, clearCart } = useCart();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  const totalItems = cart.reduce((t, i) => t + i.quantity, 0);

  const handleLogout = async () => {
    await logout();
    clearCart();
    setOpenMenu(false);
    toast.success("Sesión cerrada 👋");
    router.push("/");
  };

  return (
    <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50">
      {/* LOGO */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 font-bold text-xl"
      >
        <img src="/logo.png" alt="FM" className="w-8 h-8" />
        <span>Food Market</span>
      </button>

      <div className="flex items-center gap-6">
        <Link href="/" className="hover:underline text-sm">🏠 Inicio</Link>

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="flex items-center gap-1"
            >
              👋 {user.name?.split(" ")[0]}
              ▼
            </button>

            {openMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg p-2 overflow-hidden">

                {/* 🔥 BOTÓN ADMIN SOLO SI ES ADMIN */}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                    onClick={() => setOpenMenu(false)}
                  >
                    🛠 Panel Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="block px-3 py-2 hover:bg-gray-100"
                  onClick={() => setOpenMenu(false)}
                >
                  🧑 Mi Perfil
                </Link>

                <Link
                  href="/orders"
                  className="block px-3 py-2 hover:bg-gray-100"
                  onClick={() => setOpenMenu(false)}
                >
                  🧾 Mis Pedidos
                </Link>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-100"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}

        {!user && (
          <Link href="/login?mode=login" className="hover:underline text-sm">
            Iniciar sesión
          </Link>
        )}

        {/* Carrito */}
        <Link href="/cart" className="relative flex items-center gap-1">
          <ShoppingCart className="w-5 h-5" />
          <span>Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-xs px-2 py-1 rounded-full">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
