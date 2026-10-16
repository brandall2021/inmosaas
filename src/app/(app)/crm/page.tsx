import Link from "next/link";
import { Contact, Plus, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClientStage } from "@/db/schema";
import { ClientCard } from "@/features/clients/components/client-card";
import { CLIENT_STAGES } from "@/features/clients/constants";
import { listClients } from "@/features/clients/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; etapa?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const stage = CLIENT_STAGES.find(
    (option) => option.value === params.etapa,
  )?.value as ClientStage | undefined;

  const clients = await listClients(org.id, {
    search: search || undefined,
    stage,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Clientes / CRM
          </h1>
          <p className="text-sm text-muted-foreground">
            Cartera de contactos de {org.name}.
          </p>
        </div>
        <Link href="/crm/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Nuevo cliente
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Buscar por nombre, correo o teléfono"
            className="pl-8"
          />
        </div>
        <select name="etapa" defaultValue={stage ?? ""} className={selectClass}>
          <option value="">Todas las etapas</option>
          {CLIENT_STAGES.map((option) => (
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

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Contact className="size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">
                {search || stage
                  ? "No encontramos clientes con ese criterio"
                  : "Todavía no hay clientes"}
              </p>
              <p className="text-sm text-muted-foreground">
                Cargá tu primer contacto para empezar a armar tu cartera.
              </p>
            </div>
            <Link href="/crm/nuevo" className={cn(buttonVariants())}>
              <Plus className="size-4" />
              Nuevo cliente
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
