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
  listSettlements,
  countPendingSettlements,
  settlementStatusLabels,
  SETTLEMENT_STATUSES,
  formatPeriod,
} from "@/features/liquidaciones";
import { formatPrice } from "@/features/properties/constants";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function LiquidacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; propietario?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const statusFilter = params.estado ?? "todas";
  const ownerFilter = params.propietario ?? "";

  const settlements = await listSettlements(org.id, {
    status: statusFilter === "todas" ? undefined : (statusFilter as "pendiente" | "pagada"),
    ownerId: ownerFilter || undefined,
  });

  const pendingCount = await countPendingSettlements(org.id);

  const totalNet = settlements.reduce(
    (acc, s) => acc + Number(s.grossAmount) * (1 - Number(s.feePercent ?? 0) / 100),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Liquidaciones</h1>
          <p className="text-sm text-muted-foreground">
            Liquidación de lo cobrado a los propietarios por período.
          </p>
        </div>
        <Link href="/liquidaciones/nuevo" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          Nueva liquidación
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-l-2 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <CardDescription className="ml-auto text-right">
              {pendingCount}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neto total (listado)</CardTitle>
            <CardDescription className="ml-auto text-right">
              {formatPrice(totalNet, "ARS")}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En el listado</CardTitle>
            <CardDescription className="ml-auto text-right">
              {settlements.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último período</CardTitle>
            <CardDescription className="ml-auto text-right">
              {settlements[0] ? formatPeriod(settlements[0].period) : "—"}
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
            {SETTLEMENT_STATUSES.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={false}
              >
                {settlementStatusLabels[option.value as keyof typeof settlementStatusLabels]}
              </option>
            ))}
            <option value="todas">Todas</option>
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <label className="block text-xs text-muted-foreground mb-1">
            Propietario
          </label>
          <input
            name="propietario"
            type="text"
            defaultValue={ownerFilter}
            placeholder="Propietario..."
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button type="submit">Filtrar</Button>
        <Link href="/liquidaciones" className={cn(buttonVariants({ variant: "outline" }))}>
          Limpiar
        </Link>
      </form>

      {settlements.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sin liquidaciones</CardTitle>
            <CardDescription>
              Comenzá creando la primera liquidación de un alquiler con cobros
              registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Link href="/liquidaciones/nuevo">Crear liquidación</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Período</th>
                <th className="py-2 pr-3 font-medium text-right">Propietario</th>
                <th className="py-2 pr-3 font-medium text-right">Propiedad</th>
                <th className="py-2 pr-3 font-medium text-right">Bruto</th>
                <th className="py-2 pr-3 font-medium text-right">Honorarios</th>
                <th className="py-2 pr-3 font-medium text-right">Neto</th>
                <th className="py-2 pr-3 font-medium text-right">Estado</th>
                <th className="py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-medium">
                    {formatPeriod(settlement.period)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {settlement.ownerName ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {settlement.propertyTitle ?? "—"}
                  </td>
                  <td className="py-2 pr-3 font-medium text-right">
                    {formatPrice(Number(settlement.grossAmount), settlement.currency)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatPrice(
                      Number(settlement.grossAmount) *
                        (Number(settlement.feePercent ?? 0) / 100),
                      settlement.currency,
                    )}
                  </td>
                  <td className="py-2 pr-3 font-medium text-right">
                    {formatPrice(
                      Number(settlement.grossAmount) -
                        Number(settlement.grossAmount) *
                          (Number(settlement.feePercent ?? 0) / 100),
                      settlement.currency,
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">
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
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      href={`/liquidaciones/${settlement.id}`}
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
