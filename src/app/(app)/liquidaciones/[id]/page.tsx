import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  User,
} from "lucide-react";

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
  getSettlement,
  listExpenses,
  settlementSummary,
  settlementStatusLabels,
  settlementItemTypeLabels,
  settlementMethodLabels,
  formatPeriod,
  generateSettlementDocumentAction,
} from "@/features/liquidaciones";
import { formatDate } from "@/features/alquileres/constants";
import { formatPrice } from "@/features/properties/constants";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { cn } from "@/lib/utils";
import {
  DeleteSettlementButton,
  AddExpenseForm,
  EditExpenseForm,
  DeleteExpenseButton,
} from "@/features/liquidaciones/components";

export const instant = false;

export default async function SettlementDetailPage({
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
  const settlement = await getSettlement(org.id, id);
  if (!settlement) {
    notFound();
  }

  const expenses = await listExpenses(org.id, id);
  const summary = settlementSummary(settlement, expenses);
  const role = await requireMembership(user.id, org.id);
  const canManage = hasRole(role, ["owner", "admin"]);
  const canEdit = settlement.status === "pendiente" && canManage;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/liquidaciones"
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
              settlement.status === "pagada"
                ? "border-green/20 bg-green/5 text-green-600"
                : "border-orange/20 bg-orange/5 text-orange-600",
            )}
          >
            {settlementStatusLabels[settlement.status as keyof typeof settlementStatusLabels]}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Liquidación {settlement.period}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            {settlement.ownerName ?? "Sin propietario asignado"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/liquidaciones/${settlement.id}/editar`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Pencil className="size-4" />
              Editar
            </Link>
          )}
          <DeleteSettlementButton
            id={settlement.id}
            disabled={!canEdit || settlement.status !== "pendiente"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resumen del cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Bruto cobrado</dt>
                <dd className="font-medium">
                  {formatPrice(summary.gross, settlement.currency)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Honorarios ({settlement.feePercent}%)</dt>
                <dd className="font-medium">
                  {formatPrice(summary.feeAmount, settlement.currency)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Gastos</dt>
                <dd className="font-medium text-destructive">
                  -{formatPrice(summary.expensesTotal, settlement.currency)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Adicionales</dt>
                <dd className="font-medium text-success">
                  +{formatPrice(summary.additionsTotal, settlement.currency)}
                </dd>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <dt>Neto a pagar</dt>
                <dd>{formatPrice(summary.net, settlement.currency)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Datos de la liquidación</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Período</dt>
                <dd>{formatPeriod(settlement.period)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Propiedad</dt>
                <dd>{settlement.propertyTitle ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Moneda</dt>
                <dd>{settlement.currency}</dd>
              </div>
              {settlement.paidDate ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pagado el</dt>
                  <dd>{formatDate(settlement.paidDate)}</dd>
                </div>
              ) : null}
              {settlement.paidMethod ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Método de pago</dt>
                  <dd>{settlementMethodLabels[settlement.paidMethod as keyof typeof settlementMethodLabels]}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>{settlementStatusLabels[settlement.status as keyof typeof settlementStatusLabels]}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settlement.status === "pendiente" && canManage && (
              <form
                action={async (formData: FormData) => {
                  await generateSettlementDocumentAction(undefined, formData);
                }}
              >
                <input type="hidden" name="id" value={settlement.id} />
                <Button type="submit" className="w-full">
                  Generar comprobante PDF
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ítems ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin ítems de gastos ni adicionales todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Concepto</th>
                    <th className="py-2 pr-3 font-medium text-right">Tipo</th>
                    <th className="py-2 pr-3 font-medium text-right">Monto</th>
                    {canEdit ? (
                      <th className="py-2 text-right font-medium">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-2 pr-3 font-medium">
                        {expense.concept}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span className={cn("text-xs font-medium", expense.type === "gasto" ? "text-destructive" : "text-success")}>
                          {settlementItemTypeLabels[expense.type as keyof typeof settlementItemTypeLabels]}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium text-right">
                        {formatPrice(expense.amount, settlement.currency)}
                      </td>
                      {canEdit ? (
                        <td className="py-2 text-right">
                          <EditExpenseForm
                            expense={expense}
                            settlementId={settlement.id}
                          />
                          <DeleteExpenseButton id={expense.id} _settlementId={settlement.id} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar ítem</CardTitle>
          </CardHeader>
          <CardContent>
            <AddExpenseForm settlementId={settlement.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
