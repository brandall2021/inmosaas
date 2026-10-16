import Link from "next/link";
import { FolderTree, Plus, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CatalogKind } from "@/db/schema";
import { CatalogEntryRow } from "@/features/catalogos/components/catalog-entry-row";
import { SeedCatalogButton } from "@/features/catalogos/components/seed-catalog-button";
import { CATALOG_KINDS } from "@/features/catalogos/constants";
import {
  countCatalogEntriesByKind,
  listCatalogEntries,
} from "@/features/catalogos/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-52";

export default async function CatalogosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const kind = CATALOG_KINDS.find(
    (option) => option.value === params.tipo,
  )?.value as CatalogKind | undefined;

  const [entries, counts] = await Promise.all([
    listCatalogEntries(org.id, { search: search || undefined, kind }),
    countCatalogEntriesByKind(org.id),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const isFiltering = Boolean(search || kind);

  const grouped = CATALOG_KINDS.map((option) => ({
    ...option,
    entries: entries.filter((entry) => entry.kind === option.value),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Catálogos</h1>
          <p className="text-sm text-muted-foreground">
            Datos de referencia de {org.name}: zonas, amenities, servicios y
            etiquetas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {total === 0 ? <SeedCatalogButton /> : null}
          <Link href="/catalogos/nuevo" className={cn(buttonVariants())}>
            <Plus className="size-4" />
            Nuevo elemento
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/catalogos"
          className={cn(
            buttonVariants({
              variant: kind ? "outline" : "secondary",
              size: "sm",
            }),
          )}
        >
          Todos
          <span className="text-muted-foreground">{total}</span>
        </Link>
        {CATALOG_KINDS.map((option) => (
          <Link
            key={option.value}
            href={`/catalogos?tipo=${option.value}`}
            className={cn(
              buttonVariants({
                variant: kind === option.value ? "secondary" : "outline",
                size: "sm",
              }),
            )}
          >
            {option.label}
            <span className="text-muted-foreground">
              {counts[option.value] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Buscar en el catálogo"
            className="pl-8"
          />
        </div>
        {kind ? <input type="hidden" name="tipo" value={kind} /> : null}
        <select name="tipo" defaultValue={kind ?? ""} className={selectClass}>
          <option value="">Todos los tipos</option>
          {CATALOG_KINDS.map((option) => (
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

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderTree className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">
                {isFiltering
                  ? "No encontramos elementos con ese criterio"
                  : "Todavía no cargaste catálogos"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isFiltering
                  ? "Probá con otro término o quitá los filtros."
                  : "Armá tus listas de zonas, amenities, servicios y etiquetas."}
              </p>
            </div>
            {!isFiltering ? (
              <div className="flex items-center gap-2">
                <SeedCatalogButton />
                <Link
                  href="/catalogos/nuevo"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  <Plus className="size-4" />
                  Nuevo elemento
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <Card key={group.value}>
              <CardHeader>
                <CardTitle className="text-base">
                  {group.label}{" "}
                  <span className="text-muted-foreground">
                    ({group.entries.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {group.entries.map((entry) => (
                    <CatalogEntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
