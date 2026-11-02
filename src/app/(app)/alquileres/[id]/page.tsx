import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, CalendarDays, Pencil, User } from "lucide-react";

import {
  DeletePaymentButton,
  PaymentForm,
} from "@/features/cobranzas";
import { listPayments, getPaymentSummary, rentalPeriodMonths } from "@/features/cobranzas/data";
import { paymentMethodLabels } from "@/features/cobranzas/constants";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteRentalButton } from "@/features/alquileres/components/delete-rental-button";
import { StatusBadge } from "@/features/alquileres/components/status-badge";
import { GenerateContractForm } from "@/features/documentos/components/generate-contract-form";
import { formatDate } from "@/features/alquileres/constants";
import { getRental } from "@/features/alquileres/data";
import { formatPrice } from "@/features/properties/constants";
import {
  listIndexEntries,
  listPenalties,
  rentalIndexTypeLabels,
  rentalPenaltyStatusLabels,
} from "@/features/rental-indexing";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editarPago?: string }>;
}) {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const { id } = await params;
  const { editarPago } = await searchParams;
  const row = await getRental(org.id, id);
  if (!row) {
    notFound();
  }
  const { rental, propertyTitle, clientName } = row;

  const role = await requireMembership(user.id, org.id);
  const [payments, summary, indexEntries, penalties] = await Promise.all([
    listPayments(org.id, rental.id),
    getPaymentSummary(org.id, rental.id),
    listIndexEntries(org.id, rental.id),
    listPenalties(org.id, rental.id, undefined),
  ]);
  const periodMonths = rentalPeriodMonths(rental.startDate, rental.endDate);
  const editing = editarPago
    ? payments.find((payment) => payment.id === editarPago) ?? null
    : null;
  const canManage = hasRole(role, ["owner", "admin"]);

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

      <Card>
        <CardHeader>
          <CardTitle>Cobranzas</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow
              label="Total cobrado"
              value={
                payments.length > 0
                  ? formatPrice(summary.collected, rental.currency)
                  : "Sin cobros"
              }
            />
            <DetailRow
              label="Último pago"
              value={summary.lastPaymentDate ? formatDate(summary.lastPaymentDate) : "—"}
            />
            <DetailRow
              label="Meses cubiertos"
              value={`${summary.monthsCovered} de ${periodMonths}`}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar pago" : "Registrar pago"}</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm rentalId={rental.id} payment={editing ?? undefined} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin pagos registrados todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Fecha</th>
                    <th className="py-2 pr-3 font-medium">Monto</th>
                    <th className="py-2 pr-3 font-medium">Método</th>
                    <th className="py-2 pr-3 font-medium">Notas</th>
                    {canManage ? (
                      <th className="py-2 text-right font-medium">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{formatDate(payment.paidDate)}</td>
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">
                        {formatPrice(payment.amount, payment.currency)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {paymentMethodLabels[payment.method]}
                      </td>
                      <td className="max-w-48 truncate py-2 pr-3">
                        {payment.notes ?? "—"}
                      </td>
                      {canManage ? (
                        <td className="py-2">
                          <div className="flex justify-end items-center gap-1">
                            <Link
                              href={`/alquileres/${rental.id}?editarPago=${payment.id}`}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" }),
                              )}
                              aria-label={`Editar pago ${formatDate(payment.paidDate)}`}
                            >
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                            <DeletePaymentButton id={payment.id} />
                          </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Ajustes de índice y punitorios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">Índice de ajuste</p>
                <p className="font-medium">
                  {rentalIndexTypeLabels[rental.indexType as keyof typeof rentalIndexTypeLabels]}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">Día de ajuste</p>
                <p className="font-medium">
                  {rental.adjustmentDay ?? "—"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">Punitorio diario</p>
                <p className="font-medium">
                  {rental.penaltyRate !== null
                    ? `${rental.penaltyRate}%`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Ajustes aplicados</h2>
              {canManage && (
                <Link
                  href={`/alquileres/${rental.id}/ajustes/nuevo`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Aplicar ajuste
                </Link>
              )}
            </div>
            {indexEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay ajustes de índice registrados todavía.
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Fecha</th>
                    <th className="py-2 pr-3 font-medium text-right">Índice</th>
                    <th className="py-2 pr-3 font-medium text-right">Monto anterior</th>
                    <th className="py-2 pr-3 font-medium text-right">Monto nuevo</th>
                    <th className="py-2 pr-3 font-medium text-right">Valor base</th>
                    <th className="py-2 pr-3 font-medium text-right">Valor nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {indexEntries.slice(0, 5).map((entry) => (
                    <tr key={entry.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        {new Date(entry.appliedDate).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {entry.indexType}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPrice(Number(entry.previousRent), rental.currency)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPrice(Number(entry.newRent), rental.currency)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {Number(entry.baseIndexValue).toLocaleString("es-AR")}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {Number(entry.newIndexValue).toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Punitorios por mora</h2>
              {canManage && (
                <Link
                  href={`/alquileres/${rental.id}/ajustes/nuevo?tipo=penalty`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Registrar punitorio
                </Link>
              )}
            </div>
            {penalties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay punitorios registrados todavía.
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Fecha de cálculo</th>
                    <th className="py-2 pr-3 font-medium text-right">Monto adeudado</th>
                    <th className="py-2 pr-3 font-medium text-right">Días mora</th>
                    <th className="py-2 pr-3 font-medium text-right">Punitorio</th>
                    <th className="py-2 pr-3 font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.slice(0, 5).map((penalty) => (
                    <tr key={penalty.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        {new Date(penalty.calculatedDate).toLocaleDateString(
                          "es-AR",
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPrice(
                          Number(penalty.overdueAmount),
                          rental.currency,
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {penalty.overdueDays}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {formatPrice(
                          Number(penalty.penaltyAmount),
                          rental.currency,
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py text-xs font-medium",
                            penalty.status === "pagado"
                              ? "border-green/20 bg-green/5 text-green-600"
                              : "border-orange/20 bg-orange/5 text-orange-600",
                          )}
                        >
                          {rentalPenaltyStatusLabels[penalty.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <GenerateContractForm rentalId={rental.id} />

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
