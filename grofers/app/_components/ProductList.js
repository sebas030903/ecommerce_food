"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import GlobalApi from "../_utils/GlobalApi";
import { useCart } from "../_context/UpdateCartContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProductList() {
  const { cart, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar productos y categorías
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prods, cats] = await Promise.all([
          GlobalApi.getAllProducts(),
          GlobalApi.getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrar productos
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory
      ? p.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  if (loading)
    return (
      <p className="text-center text-gray-600 mt-10 animate-pulse">
        Cargando productos...
      </p>
    );

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
        🛒 Categorías disponibles
      </h2>

      <div className="flex flex-wrap gap-3 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat ? null : cat)
            }
            className={`px-4 py-2 rounded-md border transition-all text-sm font-medium ${
              selectedCategory === cat
                ? "bg-green-100 border-green-500 text-green-700 shadow-sm"
                : "bg-white border-gray-300 hover:bg-green-50 hover:border-green-400"
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mb-8 flex justify-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full md:w-1/2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-600">No se encontraron productos 😔</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((item) => {
            // 🔥 CORRECCIÓN: usar item.id
            const productId = item.id;

            // Cantidad en carrito
            const inCart = cart.find((p) => p.id === productId);
            const quantityInCart = inCart?.quantity || 0;

            const remainingStock = Math.max(item.stock - quantityInCart, 0);
            const isOutOfStock = remainingStock <= 0;

            return (
              <motion.div
                key={productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border rounded-lg bg-white shadow hover:shadow-lg transition cursor-pointer flex flex-col"
              >
                <div className="relative w-full h-48 p-2">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="p-3 text-center flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-gray-800 font-medium text-sm line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-green-600 font-bold mt-1">
                      ${item.price}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Stock disponible: {remainingStock}
                    </p>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (isOutOfStock) {
                        return toast.error("Producto agotado ❌");
                      }

                      // 🔥 enviar ID correcto → item.id
                      addToCart({
                        id: item.id,
                        title: item.title,
                        image: item.image,
                        price: item.price,
                        stock: item.stock,
                      });
                    }}
                    className={`mt-2 w-full py-1.5 rounded-md text-white font-semibold transition ${
                      isOutOfStock
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isOutOfStock ? "Agotado" : "Agregar"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
