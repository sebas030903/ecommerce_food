import { Suspense } from "react";
import LoginPage from "./page-content";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Cargando...</div>}>
      <LoginPage />
    </Suspense>
  );
}
