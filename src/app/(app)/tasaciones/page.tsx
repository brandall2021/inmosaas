import Link from "next/link";
import { Calculator, Plus, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ValuationStatus } from "@/db/schema";
import { listValuations } from "@/features/tasaciones/data";
import { VALUATION_STATUSES } from "@/features/tasaciones/constants";
import { ValuationCard } from "@/features/tasaciones/components/valuation-card";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44";

export default async function TasacionesPage({
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
  const status = VALUATION_STATUSES.find(
    (option) => option.value === params.estado,
  )?.value as ValuationStatus | undefined;

  const valuations = await listValuations(org.id, {
    search: search || undefined,
    status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tasaciones</h1>
          <p className="text-sm text-muted-foreground">
            Valor por m² y estimaciones de mercado.
          </p>
        </div>
        <Link href="/tasaciones/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Nueva tasación
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Buscar por título o dirección"
            className="pl-8"
          />
        </div>
        <select name="estado" defaultValue={status ?? ""} className={selectClass}>
          <option value="">Todos los estados</option>
          {VALUATION_STATUSES.map((option) => (
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

      {valuations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Calculator className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">
                {search || status
                  ? "No encontramos tasaciones con ese criterio"
                  : "Todavía no hay tasaciones"}
              </p>
              <p className="text-sm text-muted-foreground">
                Registrá una tasación para calcular valor por m² y total.
              </p>
            </div>
            <Link href="/tasaciones/nuevo" className={cn(buttonVariants())}>
              <Plus className="size-4" />
              Nueva tasación
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {valuations.map((valuation) => (
            <ValuationCard key={valuation.id} valuation={valuation} />
          ))}
        </div>
      )}
    </div>
  );
}
