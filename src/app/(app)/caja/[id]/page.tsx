import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Building2 } from "lucide-react";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCashBoxEntry,
  cashBoxEntryTypeLabels,
  cashBoxCategoryLabels,
  cashBoxEntryStatusLabels,
  formatCurrency,
  deleteCashBoxEntryAction,
} from "@/features/cash-box";
import { formatDate } from "@/features/alquileres/constants";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function CashBoxEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const { id } = await params;
  const entry = await getCashBoxEntry(org.id, id);
  if (!entry) {
    notFound();
  }

  const role = await requireMembership(user.id, org.id);
  const canManage = hasRole(role, ["owner", "admin"]);
  const canEdit = entry.status === "pendiente" && canManage;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/caja"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py text-xs font-medium",
              entry.type === "ingreso"
                ? "border-green/20 bg-green/5 text-green-600"
                : "border-red/20 bg-red/5 text-red-600",
            )}
          >
            {cashBoxEntryTypeLabels[entry.type]}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            {entry.concept}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            {cashBoxCategoryLabels[entry.category]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/caja/${entry.id}/editar`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Pencil className="size-4" />
              Editar
            </Link>
          )}
          {canEdit && entry.status === "pendiente" && (
            <form
              action={deleteCashBoxEntryAction}
              onSubmit={(e) => {
                if (
                  !window.confirm(
                    "¿Eliminar este movimiento de caja definitivamente?",
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={entry.id} />
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalle</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{cashBoxEntryTypeLabels[entry.type]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Categoría</dt>
                <dd>{cashBoxCategoryLabels[entry.category]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd>{formatDate(entry.date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Moneda</dt>
                <dd>{entry.currency}</dd>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <dt>Monto</dt>
                <dd>
                  {formatCurrency(
                    entry.type === "egreso" ? -Number(entry.amount) : Number(entry.amount),
                    entry.currency,
                  )}
                </dd>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>
                  <span
                    className={cn("text-xs font-medium", entry.status === "conciliado" ? "text-green-600" : "text-orange-600")}
                  >
                    {cashBoxEntryStatusLabels[entry.status]}
                  </span>
                </dd>
              </div>
              {entry.clientId && entry.clientName ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cliente</dt>
                  <dd>{entry.clientName}</dd>
                </div>
              ) : null}
              {entry.rentalId ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Alquiler</dt>
                  <dd>Vinculado</dd>
                </div>
              ) : null}
              {entry.notes ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Notas</dt>
                  <dd>{entry.notes}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
