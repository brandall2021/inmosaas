import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  Library,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Search,
    title: "Buscador con IA",
    description:
      "Describí lo que busca tu cliente en lenguaje natural y encontrá coincidencias en segundos.",
  },
  {
    icon: Calculator,
    title: "Tasaciones digitales",
    description:
      "Estimá el valor de una propiedad con comparables reales y un informe listo para presentar.",
  },
  {
    icon: Library,
    title: "Catálogos profesionales",
    description:
      "Armá catálogos y fichas para compartir por WhatsApp, redes o tu vidriera.",
  },
  {
    icon: Users,
    title: "CRM inmobiliario",
    description:
      "Centralizá clientes, propiedades y seguimiento en un mismo lugar.",
  },
  {
    icon: Building2,
    title: "Gestión de cartera",
    description:
      "Publicá, actualizá y hacé seguimiento de toda tu cartera sin planillas sueltas.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            InmoSaaS
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Iniciar sesión
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Probar gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-6">
            Nueva plataforma para inmobiliarias
          </Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            La operación inmobiliaria, ordenada en un solo lugar
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Búsqueda inteligente, tasaciones, catálogos y CRM pensados para
            inmobiliarias y brokers. Empezá en minutos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Crear cuenta
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 InmoSaaS</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-foreground">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-foreground">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
