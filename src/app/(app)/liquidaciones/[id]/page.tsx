import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  LayoutList,
  Pencil,
  Plus,
  Trash2,
  User,
  Building2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSettlement,
  listExpenses,
  settlementSummary,
  formatPrice,
  settlementStatusLabels,
  settlementItemTypeLabels,
  settlementMethodLabels,
  formatPeriod,
  generateSettlementDocumentAction,
} from "@/features/liquidaciones";
import { formatDate } from "@/features/properties/constants";
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
            {settlementStatusLabels[settlement.status]}
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
                  <dd>{settlementMethodLabels[settlement.paidMethod]}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>{settlementStatusLabels[settlement.status]}</dd>
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
              <Button
                asChild
                className="w-full"
                disabled={settlement.status === "pagada"}
              >
                <Link href={`/liquidaciones/${settlement.id}/pagar`}>
                  Confirmar pago al propietario
                </Link>
              </Button>
            )}
            {settlement.status === "pendiente" && (
              <form action={generateSettlementDocumentAction}>
                <input type="hidden" name="id" value={settlement.id} />
                <Button type="submit" className="w-full outline">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    {canEdit ? (
                      <TableHead className="text-right">Acciones</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow
                      key={expense.id}
                      className="border-b last:border-b-0"
                    >
                      <TableCell className="font-medium">
                        {expense.concept}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn("text-xs font-medium", expense.type === "gasto" ? "text-destructive" : "text-success")}>
                          {settlementItemTypeLabels[expense.type]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(expense.amount, settlement.currency)}
                      </TableCell>
                      {canEdit ? (
                        <TableCell className="text-right">
                          <EditExpenseForm
                            expense={expense}
                            settlementId={settlement.id}
                          />
                          <DeleteExpenseButton id={expense.id} settlementId={settlement.id} />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
