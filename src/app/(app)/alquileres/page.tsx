import Link from "next/link";
import { KeyRound, Plus, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RentalStatus } from "@/db/schema";
import { RentalCard } from "@/features/alquileres/components/rental-card";
import { RENTAL_STATUSES } from "@/features/alquileres/constants";
import { listRentals } from "@/features/alquileres/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44";

export default async function AlquileresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = RENTAL_STATUSES.find(
    (option) => option.value === params.estado,
  )?.value as RentalStatus | undefined;

  const rows = await listRentals(org.id, {
    search: search || undefined,
    status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Alquileres</h1>
          <p className="text-sm text-muted-foreground">
            Contratos de alquiler y canones mensuales.
          </p>
        </div>
        <Link href="/alquileres/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Nuevo alquiler
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Buscar por propiedad o inquilino"
            className="pl-8"
          />
        </div>
        <select name="estado" defaultValue={status ?? ""} className={selectClass}>
          <option value="">Todos los estados</option>
          {RENTAL_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Filtrar
        </button>
      </form>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <KeyRound className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">
                {search || status
                  ? "No encontramos alquileres con ese criterio"
                  : "Todavía no hay alquileres"}
              </p>
              <p className="text-sm text-muted-foreground">
                Registrá un contrato para empezar a administrar tus alquileres.
              </p>
            </div>
            <Link href="/alquileres/nuevo" className={cn(buttonVariants())}>
              <Plus className="size-4" />
              Nuevo alquiler
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <RentalCard key={row.rental.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
