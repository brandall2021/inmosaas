import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Pencil, Phone } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteClientButton } from "@/features/clients/components/delete-client-button";
import { StageBadge } from "@/features/clients/components/stage-badge";
import { clientTypeLabels } from "@/features/clients/constants";
import { getClient } from "@/features/clients/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
});

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const { id } = await params;
  const client = await getClient(org.id, id);
  if (!client) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/crm"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StageBadge stage={client.stage} />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {clientTypeLabels[client.type]}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {client.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/crm/${client.id}/editar`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="size-4" />
            Editar
          </Link>
          <DeleteClientButton id={client.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {client.email ? (
            <p className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${client.email}`} className="hover:underline">
                {client.email}
              </a>
            </p>
          ) : null}
          {client.phone ? (
            <p className="flex items-center gap-2 text-sm">
              <Phone className="size-4 text-muted-foreground" />
              <a href={`tel:${client.phone}`} className="hover:underline">
                {client.phone}
              </a>
            </p>
          ) : null}
          {!client.email && !client.phone ? (
            <p className="text-sm text-muted-foreground">
              Sin datos de contacto cargados.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-4 border-b py-2">
              <dt className="text-sm text-muted-foreground">Creado</dt>
              <dd className="text-sm font-medium">
                {dateFormatter.format(client.createdAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <dt className="text-sm text-muted-foreground">Última edición</dt>
              <dd className="text-sm font-medium">
                {dateFormatter.format(client.updatedAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {client.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {client.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
