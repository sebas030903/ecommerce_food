import { Suspense } from "react";
import AuthSuccess from "./page-content";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Procesando autenticación...</div>}>
      <AuthSuccess />
    </Suspense>
  );
}
