import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Plus, User } from "lucide-react";

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

import { createSettlementAction } from "@/features/liquidaciones/actions";
import {
  currentPeriod,
  formatPeriod,
} from "@/features/liquidaciones/constants";
import { suggestGrossForPeriod } from "@/features/liquidaciones/data";
import { formatPrice } from "@/features/properties/constants";
import { clients, rentals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

type RentalOption = { id: string; label: string };

async function getRentalOptions(organizationId: string): Promise<RentalOption[]> {
  const rows = await db
    .select({ id: rentals.id, title: rentals.id })
    .from(rentals)
    .where(eq(rentals.organizationId, organizationId))
    .orderBy(rentals.createdAt);
  return rows.map((r) => ({ id: r.id, label: `Alquiler ${r.id.slice(0, 8)}` }));
}

async function getOwnerOptions(organizationId: string): Promise<RentalOption[]> {
  const rows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(
      and(
        eq(clients.type, "propietario"),
        eq(clients.organizationId, organizationId),
      ),
    )
    .orderBy(asc(clients.name));
  return rows.map((r) => ({ id: r.id, label: r.name ?? "Sin nombre" }));
}

export default async function NewSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ rentalId?: string; ownerId?: string; period?: string }>;
}) {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const [rentalOptions, ownerOptions] = await Promise.all([
    getRentalOptions(org.id),
    getOwnerOptions(org.id),
  ]);

  const defaultPeriod = currentPeriod();
  const period = params.period ?? defaultPeriod;
  const selectedRentalId = params.rentalId ?? "";
  const selectedOwnerId = params.ownerId ?? "";

  let suggested = 0;
  let paidCount = 0;
  if (selectedRentalId) {
    const suggestion = await suggestGrossForPeriod(
      org.id,
      selectedRentalId,
      period,
    );
    suggested = suggestion.suggested;
    paidCount = suggestion.paidCount;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/liquidaciones"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nueva liquidación</CardTitle>
          <CardDescription>
            Liquidá lo cobrado de un alquiler a su propietario por un período
            calendario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSettlementAction} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rental-id">Alquiler</Label>
                <Select name="rentalId" defaultValue={selectedRentalId} required>
                  <SelectTrigger id="rental-id" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        rentalOptions.find((o) => o.id === value)?.label ?? null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {rentalOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-id">Propietario</Label>
                <Select name="ownerId" defaultValue={selectedOwnerId} required>
                  <SelectTrigger id="owner-id" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        ownerOptions.find((o) => o.id === value)?.label ?? null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ownerOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay clientes tipo propietario en esta organización.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Input
                  id="period"
                  name="period"
                  type="month"
                  defaultValue={period}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross-amount">Monto bruto cobrado</Label>
                <div className="relative">
                  <Input
                    id="gross-amount"
                    name="grossAmount"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={String(suggested)}
                    placeholder="450000"
                    required
                  />
                  {paidCount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {paidCount} cobro{paidCount !== 1 ? "s" : ""} del período
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sugerido desde los cobros del alquiler en el período.{" "}
                  {suggested > 0 ? `(${formatPrice(suggested, "ARS")})` : "Sin cobros registrados en este período."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fee-percent">Honorarios inmobiliaria (%)</Label>
                <Input
                  id="fee-percent"
                  name="feePercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue="0"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select name="currency" defaultValue="ARS">
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue>{(value: string) => value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Notas de la liquidación..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href="/liquidaciones"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Cancelar
              </Link>
              <Button type="submit">Crear liquidación</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
