"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE = 10; // productos por página

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
    image: "",
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // 🔐 Validar admin o assistant
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

        if (!["admin", "assistant"].includes(data.user.role)) {
          toast.error("Acceso denegado ❌");
          router.push("/");
          return;
        }

        setCurrentUser(data.user);
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

  // 🛠 Editar producto (inline)
  const startEdit = (p) => {
    const id = p._id || p.id;
    setEditingId(id);
    setEditForm({
      title: p.title,
      price: p.price,
      stock: p.stock,
      category: p.category || "",
      image: p.image || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      title: "",
      price: "",
      stock: "",
      category: "",
      image: "",
    });
  };

  const saveEdit = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
          category: editForm.category,
          image: editForm.image,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Error al actualizar producto");

      setProducts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === id ? { ...p, ...data } : p
        )
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

      setProducts((prev) =>
        prev.filter((p) => (p._id || p.id) !== id)
      );
      toast.success("Producto eliminado 🗑️");
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ============================================================
     FILTRO + PAGINACIÓN
  ============================================================ */
  const filtered = products.filter((p) => {
    const text = `${p.title || ""} ${p.category || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentProducts = filtered.slice(startIndex, startIndex + PAGE_SIZE);

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

          {/* Usuarios y estadísticas solo para ADMIN */}
          {currentUser?.role === "admin" && (
            <>
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                👥 Usuarios
              </Link>
              <Link
                href="/admin/stats"
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
              >
                📊 Estadísticas
              </Link>
            </>
          )}

          <Link
            href="/admin/products"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            🛒 Productos
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

      {/* BUSCADOR */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-96 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
        />
      </div>

      {/* TABLA PRODUCTOS */}
      {filtered.length === 0 ? (
        <p className="text-gray-600">
          {products.length === 0
            ? "No hay productos registrados."
            : "No se encontraron productos que coincidan con la búsqueda."}
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Categoría</th>
                <th className="px-4 py-2 text-left">Precio</th>
                <th className="px-4 py-2 text-left">Stock</th>
                <th className="px-4 py-2 text-left">Imagen (URL)</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((p) => {
                const id = p._id || p.id;
                const isEditing = editingId === id;

                return (
                  <tr
                    key={id}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          className="border rounded-md px-2 py-1 w-full"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              title: e.target.value,
                            })
                          }
                        />
                      ) : (
                        p.title
                      )}
                    </td>

                    <td className="px-4 py-2">
                      {isEditing ? (
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
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="border rounded-md px-2 py-1 w-full"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                        />
                      ) : (
                        `$${Number(p.price).toFixed(2)}`
                      )}
                    </td>

                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          className="border rounded-md px-2 py-1 w-full"
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              stock: e.target.value,
                            })
                          }
                        />
                      ) : (
                        p.stock
                      )}
                    </td>

                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          className="border rounded-md px-2 py-1 w-full text-xs"
                          value={editForm.image}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              image: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="text-xs text-blue-600 break-all">
                          {p.image}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-center">
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => saveEdit(id)}
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
                            onClick={() => handleDelete(id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINACIÓN */}
      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            ← Anterior
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const num = i + 1;
            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  num === currentPage
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white hover:bg-purple-50"
                }`}
              >
                {num}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
