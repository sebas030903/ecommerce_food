"use client";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useCart } from "../_context/UpdateCartContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CartPage() {
  const {
    cart,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  /* ================== TOTALES ================== */
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const shippingCost = 0;
  const total = subtotal + shippingCost;

  const [loading, setLoading] = useState(false);

  /* ================== DIRECCIONES PERFIL ================== */
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressMode, setAddressMode] = useState("new"); // "saved" | "new"

  // para dirección guardada
  const [savedPostal, setSavedPostal] = useState("");

  // para nueva dirección
  const [newLabel, setNewLabel] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPostal, setNewPostal] = useState("");
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  // cargar direcciones desde /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) return;

        const addrs = data.user.addresses || [];
        setAddresses(addrs);

        if (addrs.length > 0) {
          const primary = addrs.find((a) => a.isPrimary);
          const first = primary || addrs[0];
          setSelectedAddressId(String(first._id || first.id));
          setAddressMode("saved");
        } else {
          setAddressMode("new");
        }
      })
      .catch((err) => {
        console.error("Error cargando direcciones:", err);
      });
  }, [API]);

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (a) => String(a._id || a.id) === String(selectedAddressId)
      ) || null,
    [addresses, selectedAddressId]
  );

  /* ============================================================
    PAYMENT
  ============================================================ */
  const handlePayment = async () => {
    if (!cart.length) return toast.error("Tu carrito está vacío 🛒");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Inicia sesión para proceder al pago 🧾");
      return router.push("/login?mode=login");
    }

    let shipping;

    // 👉 usar dirección guardada
    if (addressMode === "saved" && addresses.length > 0) {
      if (!selectedAddress) {
        return toast.error("Selecciona una de tus direcciones guardadas 🏠");
      }
      if (!savedPostal.trim()) {
        return toast.error("Ingresa el código postal 📮");
      }

      if (!selectedAddress.street) {
        return toast.error(
          "La dirección seleccionada no tiene calle/avenida configurada."
        );
      }

      shipping = {
        address: selectedAddress.street,
        city: selectedAddress.district
          ? `${selectedAddress.district}${
              selectedAddress.province ? ", " + selectedAddress.province : ""
            }`
          : selectedAddress.province || "Ciudad",
        postal: savedPostal.trim(),
      };
    } else {
      // 👉 nueva dirección
      if (!newStreet.trim() || !newCity.trim() || !newPostal.trim()) {
        return toast.error("Completa todos los campos de la nueva dirección 🏠");
      }

      shipping = {
        address: newStreet.trim(),
        city: newCity.trim(),
        postal: newPostal.trim(),
      };
    }

    try {
      setLoading(true);
      toast.loading("Procesando pedido...");

      // 1️⃣ Guardar pedido
      const orderRes = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cart,
          total,
          shipping,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error || "Error al registrar pedido");
      }

      // 2️⃣ Actualizar stock
      const stockRes = await fetch(`${API}/api/products/reduce-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });

      if (!stockRes.ok) {
        const data = await stockRes.json();
        throw new Error(data.error || "Error al actualizar stock");
      }

      // 3️⃣ Si es nueva dirección y el usuario quiere guardarla → actualizar perfil
      if (addressMode === "new" && saveNewAddress) {
        const newAddr = {
          label: newLabel || `Dirección ${addresses.length + 1}`,
          street: newStreet.trim(),
          department: "",
          province: "",
          district: newCity.trim(),
          isPrimary: addresses.length === 0,
        };

        const updatedAddresses = [...addresses, newAddr];

        try {
          const updRes = await fetch(`${API}/api/auth/update`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ addresses: updatedAddresses }),
          });

          const updData = await updRes.json();
          if (!updRes.ok) {
            console.error(
              "Error guardando nueva dirección en perfil:",
              updData
            );
          } else {
            setAddresses(updatedAddresses);
          }
        } catch (err) {
          console.error("Error al actualizar direcciones en perfil:", err);
        }
      }

      toast.dismiss();
      toast.success("Pedido registrado correctamente ✔");

      clearCart();
      setTimeout(() => router.push("/success"), 1000);
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || "Error en la compra");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
    EMPTY CART
  ============================================================ */
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-gray-600">
        <Image
          src="/empty-cart.svg"
          alt="Carrito vacío"
          width={250}
          height={250}
        />
        <h2 className="mt-4 text-2xl font-semibold">
          Tu carrito está vacío 🛒
        </h2>
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition"
        >
          Ir a comprar
        </button>
      </div>
    );
  }

  /* ============================================================
    MAIN CART
  ============================================================ */
  return (
    <div className="p-6 md:p-12 lg:px-20 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-green-600">🛍️ Tu Carrito</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* ===================== PRODUCT LIST ===================== */}
        <div className="md:col-span-2 space-y-5">
          {cart.map((item) => {
            const productId = item._id || item.id;

            return (
              <motion.div
                key={productId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-lg p-4 hover:shadow-lg transition"
              >
                {/* === IMAGE + INFO === */}
                <div className="flex items-center gap-5">
                  <div className="relative w-[80px] h-[80px] group">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.title}
                    </p>
                    <p className="text-green-600 font-bold">${item.price}</p>

                    {/* === QUANTITY === */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => decreaseQuantity(productId)}
                        className="px-3 py-1 bg-gray-200 rounded-md text-lg hover:bg-gray-300"
                      >
                        –
                      </button>

                      <span className="font-semibold text-gray-800">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => {
                          if (item.quantity >= item.stock) {
                            toast.error("No hay más stock ❌");
                            return;
                          }
                          addToCart(item);
                        }}
                        className="px-3 py-1 bg-gray-200 rounded-md text-lg hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Stock disponible: {item.stock}
                    </p>
                  </div>
                </div>

                {/* === REMOVE PRODUCT === */}
                <button
                  onClick={() => {
                    removeFromCart(productId);
                    toast.success("Producto eliminado 🗑️");
                  }}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  ✖ Eliminar
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ===================== SUMMARY & SHIPPING ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-md rounded-xl p-6 border border-gray-200 h-fit"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Dirección de envío 🏠
          </h2>

          {/* Selector de modo si hay direcciones */}
          {addresses.length > 0 && (
            <div className="flex gap-3 text-sm mb-4">
              <button
                type="button"
                onClick={() => setAddressMode("saved")}
                className={`px-3 py-1 rounded border ${
                  addressMode === "saved"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-300"
                }`}
              >
                Usar dirección guardada
              </button>
              <button
                type="button"
                onClick={() => setAddressMode("new")}
                className={`px-3 py-1 rounded border ${
                  addressMode === "new"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-300"
                }`}
              >
                Nueva dirección
              </button>
            </div>
          )}

          {addresses.length === 0 && (
            <p className="text-xs text-gray-500 mb-3">
              Aún no tienes direcciones guardadas. Registra una nueva para este
              pedido (puedes guardarla en tu perfil).
            </p>
          )}

          {/* MODO: DIRECCIÓN GUARDADA */}
          {addressMode === "saved" && addresses.length > 0 && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Selecciona una dirección
                </label>
                <select
                  value={selectedAddressId || ""}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                >
                  {addresses.map((addr) => (
                    <option
                      key={addr._id || addr.id}
                      value={addr._id || addr.id}
                    >
                      {addr.label || "Dirección"} — {addr.street}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAddress && (
                <div className="text-xs text-gray-600 bg-gray-50 border rounded-md p-2">
                  <p>{selectedAddress.street}</p>
                  <p>
                    {selectedAddress.district &&
                      `${selectedAddress.district}${
                        selectedAddress.province
                          ? ", " + selectedAddress.province
                          : ""
                      }`}
                  </p>
                  <p>{selectedAddress.department}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Código postal
                </label>
                <input
                  type="text"
                  value={savedPostal}
                  onChange={(e) => setSavedPostal(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Código postal"
                />
              </div>
            </div>
          )}

          {/* MODO: NUEVA DIRECCIÓN */}
          {addressMode === "new" && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Nombre de la dirección
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Ej: Casa, Trabajo, Dirección 2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Dirección (calle, número, referencia)
                </label>
                <input
                  type="text"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Ej: Av. Ejército 123"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Ciudad / Distrito
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Ej: Arequipa, Cercado"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Código postal
                </label>
                <input
                  type="text"
                  value={newPostal}
                  onChange={(e) => setNewPostal(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Código postal"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                />
                Guardar esta dirección en mi perfil
              </label>
            </div>
          )}

          {/* RESUMEN DEL PEDIDO */}
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Resumen del pedido
          </h3>

          <div className="text-gray-700 space-y-2">
            <p className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </p>

            <p className="flex justify-between">
              <span>Envío:</span>
              <span>Gratis 🚚</span>
            </p>

            <p className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full mt-5 py-2 rounded-md font-semibold text-white transition-all ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Procesando..." : "Finalizar compra 💳"}
          </button>

          <button
            onClick={clearCart}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
          >
            Vaciar carrito
          </button>
        </motion.div>
      </div>
    </div>
  );
}
