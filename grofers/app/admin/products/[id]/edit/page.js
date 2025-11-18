"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditProductPage({ params }) {
  const { id } = params;
  const router = useRouter();

  const [form, setForm] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API}/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setForm(data));
  }, [API, id]);

  const updateProduct = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${API}/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Error al actualizar producto");
      return;
    }

    toast.success("Producto actualizado ✔");
    router.push("/admin/products");
  };

  if (!form) return <p className="p-8">Cargando...</p>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Editar Producto</h1>

      <form onSubmit={updateProduct} className="space-y-4">

        <input
          value={form.title}
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          value={form.description}
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        ></textarea>

        <input
          value={form.image}
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />

        <input
          value={form.category}
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          type="number"
          value={form.price}
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />

        <input
          type="number"
          value={form.stock}
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Actualizar
        </button>
      </form>
    </div>
  );
}
