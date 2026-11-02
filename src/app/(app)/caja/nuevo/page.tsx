import Link from "next/link";
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

import { createCashBoxEntryAction } from "@/features/cash-box/actions";
import {
  CASH_BOX_ENTRY_TYPES,
  cashBoxEntryTypeLabels,
  CASH_BOX_CATEGORIES,
  cashBoxCategoryLabels,
} from "@/features/cash-box/constants";
import { clients, rentals } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { getActiveOrganization } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

type Option = { id: string; label: string };

async function getClientOptions(organizationId: string): Promise<Option[]> {
  const rows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.organizationId, organizationId))
    .orderBy(asc(clients.name));
  return rows.map((r) => ({ id: r.id, label: r.name ?? "Sin nombre" }));
}

async function getRentalOptions(organizationId: string): Promise<Option[]> {
  const rows = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(eq(rentals.organizationId, organizationId))
    .orderBy(rentals.createdAt);
  return rows.map((r) => ({ id: r.id, label: `Alquiler ${r.id.slice(0, 8)}` }));
}

export default async function NewCashBoxEntryPage() {
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const [clientOptions, rentalOptions] = await Promise.all([
    getClientOptions(org.id),
    getRentalOptions(org.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/caja"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo movimiento de caja</CardTitle>
          <CardDescription>
            Registrá un ingreso o egreso de caja general.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              "use server";
              await createCashBoxEntryAction(undefined, formData);
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select name="type" defaultValue="ingreso" required>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue>{(value: string) => value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CASH_BOX_ENTRY_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {cashBoxEntryTypeLabels[option.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select name="category" defaultValue="otros" required>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue>{(value: string) => value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CASH_BOX_CATEGORIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {cashBoxCategoryLabels[option.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="concept">Concepto</Label>
                <Input
                  id="concept"
                  name="concept"
                  defaultValue=""
                  placeholder="Ej. Pago de expensas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  defaultValue=""
                  placeholder="20000"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente (opcional)</Label>
                <Select name="clientId" defaultValue="">
                  <SelectTrigger id="clientId" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value
                          ? clientOptions.find((o) => o.id === value)?.label ??
                            null
                          : "Sin cliente"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin cliente</SelectItem>
                    {clientOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentalId">Alquiler (opcional)</Label>
                <Select name="rentalId" defaultValue="">
                  <SelectTrigger id="rentalId" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value
                          ? rentalOptions.find((o) => o.id === value)?.label ??
                            null
                          : "Sin alquiler"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin alquiler</SelectItem>
                    {rentalOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
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
                placeholder="Notas del movimiento..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href="/caja"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Cancelar
              </Link>
              <Button type="submit">Registrar movimiento</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
