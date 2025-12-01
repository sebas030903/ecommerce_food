"use client";
import Image from "next/image";
import Slider from "./_components/Slider";
import CategoryList from "./_components/CategoryList";
import ProductList from "./_components/ProductList";
import Footer from "./_components/Footer";

export default function Home() {
  return (
    <div className="p-10 px-5 md:px-16">
      {/* 🖼️ Slider */}
      <Slider />

      {/* 🧺 Lista de Productos */}
      <ProductList />

      {/* 📢 Banner Promocional */}
      <div className="mt-10">
        <Image
          src="/banner.png"
          width={1000}
          height={300}
          alt="banner"
          className="w-full h-[400px] object-contain rounded-xl shadow-lg"
        />
      </div>

      {/* 📞 Footer */}
      <Footer />
    </div>
  );
}
