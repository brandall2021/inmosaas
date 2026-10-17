import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DocumentType } from "@/db/schema";
import { DocumentCard } from "@/features/documentos/components/document-card";
import { listDocuments } from "@/features/documentos/data";
import { DOCUMENT_TYPE_FILTER_OPTIONS } from "@/features/documentos/document-constants";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44";

export default async function DocumentosPage({
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
  const type = DOCUMENT_TYPE_FILTER_OPTIONS.find(
    (option) => option.value === params.tipo,
  )?.value as DocumentType | undefined;

  const rows = await listDocuments(org.id, {
    search: search || undefined,
    type,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Contratos, propuestas y archivos de la inmobiliaria.
          </p>
        </div>
        <Link href="/documentos/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Subir documento
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Buscar por título"
            className="pl-8"
          />
        </div>
        <select name="tipo" defaultValue={type ?? ""} className={selectClass}>
          <option value="">Todos los tipos</option>
          {DOCUMENT_TYPE_FILTER_OPTIONS.map((option) => (
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
            <FileText className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">
                {search || type
                  ? "No encontramos documentos con ese criterio"
                  : "Todavía no hay documentos"}
              </p>
              <p className="text-sm text-muted-foreground">
                Subí un archivo o generá una propuesta para empezar.
              </p>
            </div>
            <Link href="/documentos/nuevo" className={cn(buttonVariants())}>
              <Plus className="size-4" />
              Subir documento
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <DocumentCard key={row.document.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
