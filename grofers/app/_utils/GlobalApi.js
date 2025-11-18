"use client";

/**
 * 🌎 API Global para consumir el backend local (Node + MongoDB)
 * Asegúrate de tener configurada la variable:
 * NEXT_PUBLIC_API_URL=http://localhost:4000
 */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const GlobalApi = {
  // 🏷️ Obtener todas las categorías
  async getCategories() {
    try {
      const res = await fetch(`${API}/api/products/categories`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al obtener categorías");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("❌ Error al obtener categorías:", err.message);
      return [];
    }
  },

  // 🛍️ Obtener todos los productos
  async getAllProducts() {
    try {
      const res = await fetch(`${API}/api/products`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("❌ Error al obtener productos:", err.message);
      return [];
    }
  },

  // 🧺 Obtener productos por categoría
  async getProductsByCategory(category) {
    try {
      const res = await fetch(`${API}/api/products?category=${encodeURIComponent(category)}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Error al obtener productos por categoría");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("❌ Error al obtener productos por categoría:", err.message);
      return [];
    }
  },
};

export default GlobalApi;
