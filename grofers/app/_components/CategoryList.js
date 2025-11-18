"use client";
import { useEffect, useState } from "react";
import GlobalApi from "../_utils/GlobalApi";

export default function CategoryList({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      const data = await GlobalApi.getCategories();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  return (
    <div className="my-6">
      <h2 className="text-2xl font-semibold mb-3 text-green-600">
        🛒 Categorías disponibles
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => onSelectCategory?.(cat)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-green-100 hover:shadow-md transition-all"
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
