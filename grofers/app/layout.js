"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./_context/AuthContext";
import { UpdateCartProvider } from "./_context/UpdateCartContext";
import Navbar from "./_components/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${outfit.className} bg-gray-50`}>
        <AuthProvider>
          <UpdateCartProvider>
            <Navbar />
            <main className="pt-20 px-4 sm:px-8 min-h-screen">{children}</main>
            <Toaster position="top-right" richColors closeButton />
          </UpdateCartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
