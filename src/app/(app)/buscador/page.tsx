import Link from "next/link";
import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IntentChips } from "@/features/buscador/components/intent-chips";
import { ResultGroup } from "@/features/buscador/components/result-group";
import { searchEverything } from "@/features/buscador/data";
import { hasCriteria, interpretQuery } from "@/features/buscador/query";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const SUGGESTIONS = [
  "casas en venta en Rosario hasta 150000",
  "departamentos en alquiler",
  "clientes en Palermo",
];

export default async function BuscadorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const plan = interpretQuery(query);
  const ready = query.length > 0 && hasCriteria(plan);
  const results = ready ? await searchEverything(org.id, plan) : null;

  const total = results
    ? results.properties.length +
      results.clients.length +
      results.valuations.length +
      results.rentals.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Buscador IA</h1>
        <p className="text-sm text-muted-foreground">
          Describí lo que buscás con tus palabras y lo interpretamos por vos.
        </p>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Ej: casas en venta en Rosario hasta USD 150.000"
        />
        <button type="submit" className={cn(buttonVariants())}>
          Buscar
        </button>
      </form>

      {!query ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              Probá con…
            </CardTitle>
            <CardDescription>
              Interpretamos operación, tipo, zona y rango de precio, y buscamos a
              la vez en propiedades, clientes, tasaciones y alquileres.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Link
                key={suggestion}
                href={`/buscador?q=${encodeURIComponent(suggestion)}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                {suggestion}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {query && !hasCriteria(plan) ? (
        <p className="text-sm text-muted-foreground">
          No pudimos interpretar «{query}». Probá con algo como “departamentos en
          alquiler en Palermo”.
        </p>
      ) : null}

      {ready && results ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Así leímos tu búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IntentChips plan={plan} />
            </CardContent>
          </Card>

          {total === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Sin resultados para «{query}».
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <ResultGroup title="Propiedades" items={results.properties} />
              <ResultGroup title="Clientes" items={results.clients} />
              <ResultGroup title="Tasaciones" items={results.valuations} />
              <ResultGroup title="Alquileres" items={results.rentals} />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
