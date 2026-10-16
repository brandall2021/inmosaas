import { LoginForm } from "@/features/auth";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center gap-6 px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Bienvenido de vuelta
        </h1>
        <p className="text-balance text-muted-foreground">
          Ingresá para administrar tus propiedades, clientes y catálogos.
        </p>
      </div>

      <LoginForm />

      <p className="text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link
          href="/signup"
          className="font-medium underline-offset-4 hover:underline"
        >
          Creá una gratis
        </Link>
      </p>
    </div>
  );
}
