"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const images = ["/banner.png", "/logo.png", "/vercel.svg"];

export default function Slider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-xl shadow-md">
      <Image
        src={images[index]}
        alt={`Banner ${index + 1}`}
        fill
        priority
        className="object-cover transition-all duration-700"
      />
      <div className="absolute bottom-3 w-full flex justify-center gap-2">
        {images.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i === index ? "bg-green-500" : "bg-gray-400"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
