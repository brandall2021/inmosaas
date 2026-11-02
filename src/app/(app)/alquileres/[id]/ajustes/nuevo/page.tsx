import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  applyIndexAdjustmentAction,
  recordPenaltyAction,
} from "@/features/rental-indexing/actions";
import { RENTAL_INDEX_TYPES, rentalIndexTypeLabels } from "@/features/rental-indexing/constants";
import { getRental } from "@/features/alquileres/data";
import {
  getActiveOrganization,
  requireUser,
} from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NewAdjustmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const { id } = await params;
  const { tipo } = await searchParams;
  const isPenalty = tipo === "penalty";

  const row = await getRental(org.id, id);
  if (!row) {
    notFound();
  }

  const { rental } = row;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/alquileres/${rental.id}/ajustes`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            {isPenalty ? "Registrar punitorio" : "Aplicar ajuste de índice"}
          </CardTitle>
          <CardDescription>
            {isPenalty
              ? "Calcule y registre un punitorio por mora en este alquiler."
              : "Aplique un ajuste de índice al canon del alquiler."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPenalty ? (
            <form
              action={async (formData: FormData) => {
                "use server";
                await recordPenaltyAction(undefined, formData);
              }}
              className="space-y-6"
            >
              <input type="hidden" name="id" value={rental.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="overdue-amount">Monto adeudado</Label>
                  <Input
                    id="overdue-amount"
                    name="overdueAmount"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    defaultValue=""
                    placeholder="50000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overdue-days">Días de mora</Label>
                  <Input
                    id="overdue-days"
                    name="overdueDays"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue=""
                    placeholder="30"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="daily-rate">Tasa diaria (%)</Label>
                  <Input
                    id="daily-rate"
                    name="dailyRate"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    defaultValue={
                      rental.penaltyRate !== null
                        ? String(rental.penaltyRate)
                        : ""
                    }
                    placeholder="2"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calculated-date">Fecha de cálculo</Label>
                  <Input
                    id="calculated-date"
                    name="calculatedDate"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalty-notes">Notas (opcional)</Label>
                <Textarea
                  id="penalty-notes"
                  name="notes"
                  rows={2}
                  placeholder="Ej. Mora de septiembre 2026"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Link
                  href={`/alquileres/${rental.id}/ajustes`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Cancelar
                </Link>
                <Button type="submit">Registrar punitorio</Button>
              </div>
            </form>
          ) : (
            <form
              action={async (formData: FormData) => {
                "use server";
                await applyIndexAdjustmentAction(undefined, formData);
              }}
              className="space-y-6"
            >
              <input type="hidden" name="id" value={rental.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="index-type">Índice de ajuste</Label>
                  <Select name="indexType" defaultValue={rental.indexType}>
                    <SelectTrigger id="index-type" className="w-full">
                      <SelectValue>
                        {(value: string) =>
                          rentalIndexTypeLabels[
                            value as keyof typeof rentalIndexTypeLabels
                          ]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {RENTAL_INDEX_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applied-date">Fecha de aplicación</Label>
                  <Input
                    id="applied-date"
                    name="appliedDate"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="base-index">Valor del índice (base)</Label>
                  <Input
                    id="base-index"
                    name="baseIndexValue"
                    type="number"
                    step="0.0001"
                    inputMode="decimal"
                    defaultValue=""
                    placeholder="1000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor del índice al inicio del período
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-index">Valor del índice (nuevo)</Label>
                  <Input
                    id="new-index"
                    name="newIndexValue"
                    type="number"
                    step="0.0001"
                    inputMode="decimal"
                    defaultValue=""
                    placeholder="1050"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor del índice al momento del ajuste
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="previous-rent">Canon anterior</Label>
                  <Input
                    id="previous-rent"
                    name="previousRent"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={String(Number(rental.rentAmount))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-rent">Canon nuevo (ajustable)</Label>
                  <Input
                    id="new-rent"
                    name="newRent"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    defaultValue=""
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Se sugiere calcular según el índice aplicado
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="index-notes">Notas (opcional)</Label>
                <Textarea
                  id="index-notes"
                  name="notes"
                  rows={2}
                  placeholder="Ajuste por ICL septiembre 2026"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Link
                  href={`/alquileres/${rental.id}/ajustes`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Cancelar
                </Link>
                <Button type="submit">Aplicar ajuste</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
