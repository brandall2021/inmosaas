import Link from "next/link";
import { Plus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  listReceipts,
  countReceiptsByStatus,
  receiptStatusLabels,
  receiptMethodLabels,
  RECEIPT_STATUSES,
  formatPeriod,
} from "@/features/receipts";
import { formatPrice } from "@/features/properties/constants";
import { formatDate } from "@/features/alquileres/constants";
import type { ReceiptStatus } from "@/features/receipts";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; cliente?: string; periodo?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const statusFilter = params.estado ?? "todos";
  const clientFilter = params.cliente ?? "";
  const periodFilter = params.periodo ?? "";

  const receipts = await listReceipts(org.id, {
    status: (statusFilter === "todos"
      ? undefined
      : statusFilter) as ReceiptStatus | undefined,
    clientId: clientFilter || undefined,
    period: periodFilter || undefined,
  });

  const emittedCount = await countReceiptsByStatus(org.id, "emitido");

  const totalAmount = receipts.reduce(
    (acc, r) => acc + Number(r.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recibos</h1>
          <p className="text-sm text-muted-foreground">
            Comprobantes de cobro emitidos a inquilinos y propietarios.
          </p>
        </div>
        <Link href="/recibos/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Nuevo recibo
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-l-2 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de pago</CardTitle>
            <CardDescription className="ml-auto text-right">
              {emittedCount}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto total (listado)</CardTitle>
            <CardDescription className="ml-auto text-right">
              {formatPrice(totalAmount, "ARS")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En el listado</CardTitle>
            <CardDescription className="ml-auto text-right">
              {receipts.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último emitido</CardTitle>
            <CardDescription className="ml-auto text-right">
              {receipts[0] ? formatPeriod(receipts[0].period) : "—"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <form method="get" className="flex flex-wrap gap-2 sm:flex-row items-end">
        <div className="relative flex-1 min-w-[160px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Estado
          </label>
          <select
            name="estado"
            defaultValue={statusFilter}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="todos">Todos</option>
            {RECEIPT_STATUSES.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {receiptStatusLabels[option.value]}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Cliente
          </label>
          <input
            name="cliente"
            type="text"
            defaultValue={clientFilter}
            placeholder="Cliente..."
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Período
          </label>
          <input
            name="periodo"
            type="month"
            defaultValue={periodFilter}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button type="submit">Filtrar</Button>
        <Link href="/recibos" className={cn(buttonVariants({ variant: "outline" }))}>
          Limpiar
        </Link>
      </form>

      {receipts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sin recibos</CardTitle>
            <CardDescription>
              Comenzá emitiendo el primer recibo para un inquilino o propietario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Link href="/recibos/nuevo">Emitir recibo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium text-right">Cliente</th>
                <th className="py-2 pr-3 font-medium text-right">Período</th>
                <th className="py-2 pr-3 font-medium text-right">Monto</th>
                <th className="py-2 pr-3 font-medium text-right">Método</th>
                <th className="py-2 pr-3 font-medium text-right">Estado</th>
                <th className="py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-medium">
                    {formatDate(receipt.issuedDate)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {receipt.clientName ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatPeriod(receipt.period)}
                  </td>
                  <td className="py-2 pr-3 font-medium text-right">
                    {formatPrice(Number(receipt.amount), receipt.currency)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {receiptMethodLabels[receipt.method as keyof typeof receiptMethodLabels]}
                  </td>
                  <td className="py-2 pr-3 text-right">
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
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      href={`/recibos/${receipt.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
