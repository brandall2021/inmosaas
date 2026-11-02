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
  listCashBoxEntries,
  getCashBoxBalance,
  cashBoxEntryTypeLabels,
  cashBoxCategoryLabels,
  cashBoxEntryStatusLabels,
  CASH_BOX_ENTRY_TYPES,
  CASH_BOX_CATEGORIES,
  CASH_BOX_ENTRY_STATUSES,
  formatCurrency,
  type CashBoxEntryStatus,
} from "@/features/cash-box";
import { formatDate } from "@/features/alquileres/constants";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function CashBoxPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    categoria?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const typeFilter = params.tipo ?? "";
  const categoryFilter = params.categoria ?? "";
  const statusFilter = params.estado ?? "";
  const dateFrom = params.fechaDesde ?? "";
  const dateTo = params.fechaHasta ?? "";

  const entries = await listCashBoxEntries(org.id, {
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    status: (statusFilter || undefined) as CashBoxEntryStatus | undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const balance = await getCashBoxBalance(org.id, {
    type: typeFilter || undefined,
    category: categoryFilter || undefined,
    status: (statusFilter || undefined) as CashBoxEntryStatus | undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Caja</h1>
          <p className="text-sm text-muted-foreground">
            Ingresos y egresos de la organización.
          </p>
        </div>
        <Link href="/caja/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Nuevo movimiento
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(balance.totalIncome, "ARS")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {formatCurrency(balance.totalExpense, "ARS")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-primary">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo neto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(balance.netBalance, "ARS")}
            </div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="flex flex-wrap gap-2 sm:flex-row items-end">
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Tipo
          </label>
          <select
            name="tipo"
            defaultValue={typeFilter}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Todos</option>
            {CASH_BOX_ENTRY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {cashBoxEntryTypeLabels[option.value]}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Categoría
          </label>
          <select
            name="categoria"
            defaultValue={categoryFilter}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Todas</option>
            {CASH_BOX_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {cashBoxCategoryLabels[option.value]}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Estado
          </label>
          <select
            name="estado"
            defaultValue={statusFilter}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Todos</option>
            {CASH_BOX_ENTRY_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {cashBoxEntryStatusLabels[option.value]}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Desde
          </label>
          <input
            name="fechaDesde"
            type="date"
            defaultValue={dateFrom}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Hasta
          </label>
          <input
            name="fechaHasta"
            type="date"
            defaultValue={dateTo}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button type="submit">Filtrar</Button>
        <Link href="/caja" className={cn(buttonVariants({ variant: "outline" }))}>
          Limpiar
        </Link>
      </form>

      {entries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sin movimientos</CardTitle>
            <CardDescription>
              Registrá el primer ingreso o egreso de caja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Link href="/caja/nuevo">Nuevo movimiento</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Fecha</th>
                <th className="py-2 pr-3 font-medium text-right">Concepto</th>
                <th className="py-2 pr-3 font-medium text-right">Tipo</th>
                <th className="py-2 pr-3 font-medium text-right">Categoría</th>
                <th className="py-2 pr-3 font-medium text-right">Monto</th>
                <th className="py-2 pr-3 font-medium text-right">Estado</th>
                <th className="py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-medium">
                    {formatDate(entry.date)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {entry.concept}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <span className={cn("text-xs font-medium", entry.type === "ingreso" ? "text-green-600" : "text-destructive")}>
                      {cashBoxEntryTypeLabels[entry.type]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {cashBoxCategoryLabels[entry.category]}
                  </td>
                  <td className="py-2 pr-3 font-medium text-right">
                    {formatCurrency(
                      entry.type === "egreso" ? -Number(entry.amount) : Number(entry.amount),
                      entry.currency,
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <span
                      className={cn("inline-flex items-center rounded-full border px-2 py text-xs font-medium", entry.status === "conciliado" ? "border-green/20 bg-green/5 text-green-600" : "border-orange/20 bg-orange/5 text-orange-600")}
                    >
                      {cashBoxEntryStatusLabels[entry.status]}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      href={`/caja/${entry.id}`}
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
