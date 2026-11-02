import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listIndexEntries,
  listPenalties,
  rentalIndexTypeLabels,
  rentalPenaltyStatusLabels,
} from "@/features/rental-indexing";
import { formatPrice } from "@/features/properties/constants";
import { getRental } from "@/features/alquileres/data";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function RentalAdjustmentsPage({
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
  const row = await getRental(org.id, id);
  if (!row) {
    notFound();
  }

  const { rental } = row;
  const role = await requireMembership(user.id, org.id);
  const canManage = hasRole(role, ["owner", "admin"]);

  const [indexEntries, penalties] = await Promise.all([
    listIndexEntries(org.id, rental.id),
    listPenalties(org.id, rental.id, undefined),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/alquileres/${rental.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver al alquiler
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Ajustes de alquiler
        </h1>
        <p className="text-sm text-muted-foreground">
          Historial de ajustes por índice y punitorios de{" "}
          {rental.id.slice(0, 8)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Índice configurado</CardTitle>
            <CardDescription>
              {rentalIndexTypeLabels[rental.indexType as keyof typeof rentalIndexTypeLabels]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Día de ajuste</span>
              <span>{rental.adjustmentDay ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Punitorio diario</span>
              <span>
                {rental.penaltyRate !== null
                  ? `${rental.penaltyRate}%`
                  : "—"}
              </span>
            </div>
            {canManage && (
              <Link
                href={`/alquileres/${rental.id}/editar`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                Configurar índice
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Canon actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatPrice(Number(rental.rentAmount), rental.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Punitorios pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {penalties.filter((p) => p.status === "pendiente").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Ajustes de índice ({indexEntries.length})
            </CardTitle>
            {canManage && (
              <Link
                href={`/alquileres/${rental.id}/ajustes/nuevo`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <Plus className="mr-2 size-4" />
                Aplicar ajuste
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {indexEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay ajustes de índice registrados todavía.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Fecha</th>
                      <th className="py-2 pr-3 font-medium text-right">Índice</th>
                      <th className="py-2 pr-3 font-medium text-right">Valor base</th>
                      <th className="py-2 pr-3 font-medium text-right">Valor nuevo</th>
                      <th className="py-2 pr-3 font-medium text-right">Monto anterior</th>
                      <th className="py-2 pr-3 font-medium text-right">Monto nuevo</th>
                      <th className="py-2 text-right font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexEntries.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-3">
                          {new Date(entry.appliedDate).toLocaleDateString("es-AR")}
                        </td>
                        <td className="py-2 pr-3 text-right font-medium">
                          {entry.indexType}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {Number(entry.baseIndexValue).toLocaleString(
                            "es-AR",
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {Number(entry.newIndexValue).toLocaleString("es-AR")}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {formatPrice(
                            Number(entry.previousRent),
                            rental.currency,
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right font-medium">
                          {formatPrice(Number(entry.newRent), rental.currency)}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {entry.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Punitorios ({penalties.length})
            </CardTitle>
            {canManage && (
              <Link
                href={`/alquileres/${rental.id}/ajustes/nuevo?tipo=penalty`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <Plus className="mr-2 size-4" />
                Registrar punitorio
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {penalties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay punitorios registrados todavía.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Fecha cálculo</th>
                      <th className="py-2 pr-3 font-medium text-right">Monto adeudado</th>
                      <th className="py-2 pr-3 font-medium text-right">Días mora</th>
                      <th className="py-2 pr-3 font-medium text-right">Tasa diaria</th>
                      <th className="py-2 pr-3 font-medium text-right">Punitorio</th>
                      <th className="py-2 pr-3 font-medium text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penalties.map((penalty) => (
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
                          {Number(penalty.dailyRate).toLocaleString("es-AR")}%
                        </td>
                        <td className="py-2 pr-3 text-right font-medium">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
