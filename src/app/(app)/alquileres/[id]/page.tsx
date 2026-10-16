import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, CalendarDays, Pencil, User } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteRentalButton } from "@/features/alquileres/components/delete-rental-button";
import { StatusBadge } from "@/features/alquileres/components/status-badge";
import { formatDate } from "@/features/alquileres/constants";
import { getRental } from "@/features/alquileres/data";
import { formatPrice } from "@/features/properties/constants";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default async function AlquilerDetallePage({
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
  const row = await getRental(org.id, id);
  if (!row) {
    notFound();
  }

  const { rental, propertyTitle, clientName } = row;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/alquileres"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={rental.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {propertyTitle ?? "Sin propiedad asignada"}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            {clientName ?? "Sin inquilino asignado"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/alquileres/${rental.id}/editar`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="size-4" />
            Editar
          </Link>
          <DeleteRentalButton id={rental.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow
              label="Canon mensual"
              value={formatPrice(rental.rentAmount, rental.currency)}
            />
            <DetailRow
              label="Inicio"
              value={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {formatDate(rental.startDate)}
                </span>
              }
            />
            <DetailRow
              label="Fin"
              value={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {formatDate(rental.endDate)}
                </span>
              }
            />
            <DetailRow
              label="Propiedad"
              value={
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {propertyTitle ?? "—"}
                </span>
              }
            />
          </dl>
        </CardContent>
      </Card>

      {rental.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {rental.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
