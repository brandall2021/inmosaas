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
  const [payments, summary] = await Promise.all([
    listPayments(org.id, rental.id),
    getPaymentSummary(org.id, rental.id),
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
