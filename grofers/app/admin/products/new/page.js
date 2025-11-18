"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    category: "",
    price: "",
    stock: 100,
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Error al crear producto");
      return;
    }

    toast.success("Producto creado ✔");
    router.push("/admin/products");
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Crear Producto</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <input
          placeholder="Título"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          placeholder="Descripción"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        ></textarea>

        <input
          type="text"
          placeholder="URL de Imagen"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />

        <input
          placeholder="Categoría (Ej: Bebidas)"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          type="number"
          placeholder="Precio"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />

        <input
          type="number"
          placeholder="Stock"
          className="w-full p-2 border rounded"
          defaultValue={100}
          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Guardar
        </button>
      </form>
    </div>
  );
}
