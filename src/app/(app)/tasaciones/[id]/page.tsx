import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteValuationButton } from "@/features/tasaciones/components/delete-valuation-button";
import { StatusBadge } from "@/features/tasaciones/components/status-badge";
import { formatCurrency } from "@/features/tasaciones/constants";
import { getValuation } from "@/features/tasaciones/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
});

export default async function TasacionDetallePage({
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
  const valuation = await getValuation(org.id, id);
  if (!valuation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/tasaciones"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={valuation.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {valuation.title}
          </h1>
          {valuation.address ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {valuation.address}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/tasaciones/${valuation.id}/editar`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="size-4" />
            Editar
          </Link>
          <DeleteValuationButton id={valuation.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimación</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-4 border-b py-2">
              <dt className="text-sm text-muted-foreground">Superficie</dt>
              <dd className="text-sm font-medium">
                {valuation.areaM2 != null ? `${valuation.areaM2} m²` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b py-2">
              <dt className="text-sm text-muted-foreground">Valor por m²</dt>
              <dd className="text-sm font-medium">
                {formatCurrency(valuation.pricePerM2)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <dt className="text-sm text-muted-foreground">Valor total estimado</dt>
              <dd className="text-sm font-medium">
                {formatCurrency(valuation.totalPrice)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-4 border-b py-2">
              <dt className="text-sm text-muted-foreground">Creada</dt>
              <dd className="text-sm font-medium">
                {dateFormatter.format(valuation.createdAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <dt className="text-sm text-muted-foreground">Última edición</dt>
              <dd className="text-sm font-medium">
                {dateFormatter.format(valuation.updatedAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {valuation.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {valuation.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
