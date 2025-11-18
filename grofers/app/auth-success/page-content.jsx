"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../_context/AuthContext";

export default function AuthSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) return router.push("/login");

    localStorage.setItem("accessToken", token);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          login(data.user, token);
          router.push("/");
        } else {
          router.push("/login");
        }
      });
  }, []);

  return <div className="p-10">Procesando autenticación...</div>;
}
