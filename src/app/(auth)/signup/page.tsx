import { SignupForm } from "@/features/auth";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center gap-6 px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Empezá con InmoSaaS
        </h1>
        <p className="text-balance text-muted-foreground">
          Creá tu cuenta y organizá la operación inmobiliaria en un solo lugar.
        </p>
      </div>

      <SignupForm />

      <p className="text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium underline-offset-4 hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
