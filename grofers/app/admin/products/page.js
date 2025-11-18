"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    stock: "",
    image: "",
    category: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    stock: "",
    category: "",
  });

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // 🔐 Validar admin
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/login");

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!data.user) return router.push("/login");
        if (data.user.role !== "admin") {
          toast.error("Acceso denegado ❌");
          router.push("/");
          return;
        }
      } catch (err) {
        router.push("/login");
      }
    };

    fetchUser();
  }, [API, router]);

  // 🛒 Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar productos");
        setProducts(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [API]);

  // 🛠 Editar producto
  const startEdit = (p) => {
    setEditingId(p._id);
    setEditForm({
      title: p.title,
      price: p.price,
      stock: p.stock,
      category: p.category || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", price: "", stock: "", category: "" });
  };

  const saveEdit = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
          category: editForm.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar producto");

      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, ...data } : p))
      );
      toast.success("Producto actualizado ✅");
      cancelEdit();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ➕ Crear producto
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear producto");

      setProducts((prev) => [...prev, data]);
      toast.success("Producto creado 🎉");
      setNewProduct({
        title: "",
        price: "",
        stock: "",
        image: "",
        category: "",
      });
      setCreating(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🗑 Eliminar producto
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar producto");

      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Producto eliminado 🗑️");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando productos...
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER + NAV */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-700">
            Gestión de Productos 🛒
          </h1>
          <p className="text-gray-600">
            Administra el catálogo, precios y stock.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            📦 Pedidos
          </Link>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            👥 Usuarios
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            🛒 Productos
          </Link>
          <Link
            href="/admin/stats"
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
          >
            📊 Estadísticas
          </Link>
        </div>
      </div>

      {/* FORM CREAR */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <button
          onClick={() => setCreating((v) => !v)}
          className="mb-3 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
        >
          {creating ? "Cancelar" : "➕ Nuevo producto"}
        </button>

        {creating && (
          <form
            onSubmit={handleCreate}
            className="grid md:grid-cols-5 gap-3 items-end"
          >
            <input
              type="text"
              placeholder="Nombre"
              className="border p-2 rounded-md"
              value={newProduct.title}
              onChange={(e) =>
                setNewProduct({ ...newProduct, title: e.target.value })
              }
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              className="border p-2 rounded-md"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Stock"
              className="border p-2 rounded-md"
              value={newProduct.stock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Categoría"
              className="border p-2 rounded-md"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="URL de imagen"
              className="border p-2 rounded-md md:col-span-2"
              value={newProduct.image}
              onChange={(e) =>
                setNewProduct({ ...newProduct, image: e.target.value })
              }
            />

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition md:col-span-1"
            >
              Guardar
            </button>
          </form>
        )}
      </div>

      {/* TABLA PRODUCTOS */}
      {products.length === 0 ? (
        <p className="text-gray-600">No hay productos registrados.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Categoría</th>
                <th className="px-4 py-2 text-left">Precio</th>
                <th className="px-4 py-2 text-left">Stock</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p._id}
                  className="border-b hover:bg-gray-100 transition"
                >
                  <td className="px-4 py-2">
                    {editingId === p._id ? (
                      <input
                        className="border rounded-md px-2 py-1 w-full"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                      />
                    ) : (
                      p.title
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === p._id ? (
                      <input
                        className="border rounded-md px-2 py-1 w-full"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            category: e.target.value,
                          })
                        }
                      />
                    ) : (
                      p.category || "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === p._id ? (
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded-md px-2 py-1 w-full"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                      />
                    ) : (
                      `$${Number(p.price).toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === p._id ? (
                      <input
                        type="number"
                        className="border rounded-md px-2 py-1 w-full"
                        value={editForm.stock}
                        onChange={(e) =>
                          setEditForm({ ...editForm, stock: e.target.value })
                        }
                      />
                    ) : (
                      p.stock
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {editingId === p._id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => saveEdit(p._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md text-sm hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => startEdit(p)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
