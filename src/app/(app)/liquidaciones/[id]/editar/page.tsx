import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

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

import { updateSettlementAction } from "@/features/liquidaciones/actions";
import { formatPeriod } from "@/features/liquidaciones/constants";
import { formatPrice } from "@/features/properties/constants";
import { clients, rentals, settlements } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { getActiveOrganization, hasRole, requireMembership, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

type Option = { id: string; label: string };

async function getRentalOptions(organizationId: string): Promise<Option[]> {
  const rows = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(eq(rentals.organizationId, organizationId))
    .orderBy(rentals.createdAt);
  return rows.map((r) => ({ id: r.id, label: `Alquiler ${r.id.slice(0, 8)}` }));
}

async function getOwnerOptions(organizationId: string): Promise<Option[]> {
  const rows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(
      and(eq(clients.type, "propietario"), eq(clients.organizationId, organizationId)),
    )
    .orderBy(asc(clients.name));
  return rows.map((r) => ({ id: r.id, label: r.name ?? "Sin nombre" }));
}

export default async function EditSettlementPage({
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
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(
      and(
        eq(settlements.organizationId, org.id),
        eq(settlements.id, id),
      ),
    )
    .limit(1);
  if (!settlement) {
    notFound();
  }
  if (settlement.status !== "pendiente") {
    redirect(`/liquidaciones/${settlement.id}`);
  }

  const role = await requireMembership(user.id, org.id);
  const canManage = hasRole(role, ["owner", "admin"]);
  if (!canManage) {
    redirect(`/liquidaciones/${settlement.id}`);
  }

  const [rentalOptions, ownerOptions] = await Promise.all([
    getRentalOptions(org.id),
    getOwnerOptions(org.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/liquidaciones/${settlement.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar liquidación</CardTitle>
          <CardDescription>
            Solo se pueden editar liquidaciones pendientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSettlementAction} className="space-y-6">
            <input type="hidden" name="id" value={settlement.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rental-id">Alquiler</Label>
                <Select name="rentalId" defaultValue={settlement.rentalId ?? ""} required>
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
                <Select name="ownerId" defaultValue={settlement.ownerClientId ?? ""} required>
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
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Input
                  id="period"
                  name="period"
                  type="month"
                  defaultValue={settlement.period}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross-amount">Monto bruto cobrado</Label>
                <Input
                  id="gross-amount"
                  name="grossAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={String(settlement.grossAmount)}
                  required
                />
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
                  defaultValue={String(settlement.feePercent ?? 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select name="currency" defaultValue={settlement.currency}>
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
                defaultValue={settlement.notes ?? ""}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href={`/liquidaciones/${settlement.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Cancelar
              </Link>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
