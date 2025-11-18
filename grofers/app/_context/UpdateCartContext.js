"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

export const UpdateCartContext = createContext();

export function UpdateCartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [updateCart, setUpdateCart] = useState(0);

  const { user } = useAuth();

  // 🔥 CADA USUARIO TIENE SU PROPIO CARRITO
  const storageKey = user ? `cartData_${user._id}` : "cartData_guest";

  // 🔥 SIEMPRE USAR item.id (ObjectId real)
  const getKey = (item) => item.id;

  /* ==========================
     CARGAR CARRITO
  =========================== */
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      const parsed = JSON.parse(saved);
      setCart(parsed);
      setUpdateCart(parsed.reduce((acc, i) => acc + i.quantity, 0));
    } else {
      setCart([]);
      setUpdateCart(0);
    }
  }, [user]);

  /* ==========================
     GUARDAR AUTOMÁTICO
  =========================== */
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [cart, storageKey]);

  /* ==========================
     AÑADIR PRODUCTO
  =========================== */
  const addToCart = (product) => {
    if (!product.id) {
      console.error("❌ PRODUCTO SIN ID:", product);
      toast.error("Producto inválido (sin ID)");
      return;
    }

    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);

      // 🔹 Si ya existe → sumar
      if (exists) {
        if (exists.quantity >= product.stock) {
          toast.error("No puedes añadir más, stock máximo alcanzado ❌");
          return prev;
        }

        const updated = prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );

        setUpdateCart((u) => u + 1);
        return updated;
      }

      // 🔹 Nuevo producto
      if (product.stock <= 0) {
        toast.error("Producto sin stock ❌");
        return prev;
      }

      setUpdateCart((u) => u + 1);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  /* ==========================
     RESTAR CANTIDAD
  =========================== */
  const decreaseQuantity = (id) => {
    setCart((prev) => {
      const updated = prev
        .map((p) =>
          p.id === id ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter((p) => p.quantity > 0);

      const total = updated.reduce((s, i) => s + i.quantity, 0);
      setUpdateCart(total);

      return updated;
    });
  };

  /* ==========================
     ELIMINAR PRODUCTO
  =========================== */
  const removeFromCart = (id) => {
    setCart((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const total = updated.reduce((s, i) => s + i.quantity, 0);

      setUpdateCart(total);
      toast.success("Producto eliminado 🗑️");

      return updated;
    });
  };

  /* ==========================
     VACIAR TODO
  =========================== */
  const clearCart = () => {
    setCart([]);
    setUpdateCart(0);
    localStorage.removeItem(storageKey);
  };

  return (
    <UpdateCartContext.Provider
      value={{
        cart,
        addToCart,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        updateCart,
      }}
    >
      {children}
    </UpdateCartContext.Provider>
  );
}

export function useCart() {
  return useContext(UpdateCartContext);
}
