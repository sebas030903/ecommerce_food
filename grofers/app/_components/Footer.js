"use client";

export default function Footer() {
  return (
    <footer className="mt-10 bg-green-600 text-white py-6">
      <div className="container mx-auto px-6 text-center">
        <h3 className="text-xl font-semibold mb-2">🛍️ Food Market</h3>
        <p className="text-sm mb-3">
          Tu supermercado en línea — Productos frescos, precios bajos, y entregas rápidas 🚚
        </p>

        <div className="flex justify-center gap-6 mb-3">
          <a
            href="#"
            className="hover:text-gray-200 transition-colors"
          >
            🏠 Inicio
          </a>
          <a
            href="#"
            className="hover:text-gray-200 transition-colors"
          >
            📦 Productos
          </a>
          <a
            href="#"
            className="hover:text-gray-200 transition-colors"
          >
            📞 Contacto
          </a>
        </div>

        <p className="text-xs text-gray-200">
          © {new Date().getFullYear()} Food Market — Desarrollado con ❤️ por Sebastián
        </p>
      </div>
    </footer>
  );
}
