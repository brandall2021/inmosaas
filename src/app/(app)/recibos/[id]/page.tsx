import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, User } from "lucide-react";

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
  getReceipt,
  receiptStatusLabels,
  receiptMethodLabels,
  formatPeriod,
} from "@/features/receipts";
import { formatPrice } from "@/features/properties/constants";
import { formatDate } from "@/features/alquileres/constants";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { markReceiptPaidAction, voidReceiptAction } from "@/features/receipts/actions";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function ReceiptDetailPage({
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
  const receipt = await getReceipt(org.id, id);
  if (!receipt) {
    notFound();
  }

  const role = await requireMembership(user.id, org.id);
  const canManage = hasRole(role, ["owner", "admin"]);
  const canEdit = receipt.status === "emitido" && canManage;

  const downloadUrl = receipt.documentStorageKey
    ? `/api/documentos/${receipt.documentStorageKey}`
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/recibos"
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
              receipt.status === "pagado"
                ? "border-green/20 bg-green/5 text-green-600"
                : receipt.status === "anulado"
                  ? "border-red/20 bg-red/5 text-red-600"
                  : "border-orange/20 bg-orange/5 text-orange-600",
            )}
          >
            {receiptStatusLabels[receipt.status as keyof typeof receiptStatusLabels]}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Recibo {receipt.period}
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            {receipt.clientName ?? "Sin cliente asignado"}
            {receipt.clientType ? ` · ${receipt.clientType}` : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await voidReceiptAction(undefined, formData);
              }}
              onSubmit={(e) => {
                if (
                  !window.confirm("¿Anular este recibo definitivamente?")
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={receipt.id} />
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Anular
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalle del recibo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Período</dt>
                <dd>{formatPeriod(receipt.period)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fecha de emisión</dt>
                <dd>{formatDate(receipt.issuedDate)}</dd>
              </div>
              {receipt.paidDate ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Fecha de pago</dt>
                  <dd>{formatDate(receipt.paidDate)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cliente</dt>
                <dd>{receipt.clientName ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{receipt.clientType ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Propiedad / Alquiler</dt>
                <dd>{receipt.propertyTitle ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Moneda</dt>
                <dd>{receipt.currency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Método de pago</dt>
                <dd>{receiptMethodLabels[receipt.method as keyof typeof receiptMethodLabels]}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Monto</dt>
                <dd>{formatPrice(Number(receipt.amount), receipt.currency)}</dd>
              </div>
              {receipt.notes ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Notas</dt>
                  <dd>{receipt.notes}</dd>
                </div>
              ) : null}
              <div className="border-t pt-2 flex justify-between">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>{receiptStatusLabels[receipt.status as keyof typeof receiptStatusLabels]}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), "w-full")}
              >
                Descargar comprobante PDF
              </a>
            )}
            {!downloadUrl && (
              <Button variant="outline" disabled className="w-full">
                Comprobante no disponible
              </Button>
            )}
            {receipt.status === "emitido" && canManage && (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await markReceiptPaidAction(undefined, formData);
                }}
                className="mt-2"
              >
                <input type="hidden" name="id" value={receipt.id} />
                <Button type="submit" className="w-full">
                  Marcar como pagado
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
