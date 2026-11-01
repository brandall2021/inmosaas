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

import { createReceiptAction } from "@/features/receipts/actions";
import {
  currentPeriod,
} from "@/features/receipts/constants";
import { clients, rentals } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

type Option = { id: string; label: string };

async function getClientOptions(organizationId: string): Promise<Option[]> {
  const rows = await db
    .select({ id: clients.id, name: clients.name, type: clients.type })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, organizationId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clients.type as any).in(["inquilino", "propietario"]),
      ),
    )
    .orderBy(asc(clients.name));
  return rows.map((r) => ({ id: r.id, label: `${r.name} (${r.type})` }));
}

async function getRentalOptions(organizationId: string): Promise<Option[]> {
  const rows = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(eq(rentals.organizationId, organizationId))
    .orderBy(rentals.createdAt);
  return rows.map((r) => ({ id: r.id, label: `Alquiler ${r.id.slice(0, 8)}` }));
}

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; rentalId?: string; period?: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const params = await searchParams;
  const [clientOptions, rentalOptions] = await Promise.all([
    getClientOptions(org.id),
    getRentalOptions(org.id),
  ]);

  const defaultPeriod = currentPeriod();
  const period = params.period ?? defaultPeriod;
  const selectedClientId = params.clientId ?? "";
  const selectedRentalId = params.rentalId ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recibos"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo recibo</CardTitle>
          <CardDescription>
            Emití un comprobante de cobro a un inquilino o propietario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              await createReceiptAction(undefined, formData);
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-id">Cliente</Label>
                <Select name="clientId" defaultValue={selectedClientId} required>
                  <SelectTrigger id="client-id" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        clientOptions.find((o) => o.id === value)?.label ?? null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay clientes tipo inquilino ni propietario en esta organización.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental-id">Alquiler (opcional)</Label>
                <Select name="rentalId" defaultValue={selectedRentalId}>
                  <SelectTrigger id="rental-id" className="w-full">
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
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  defaultValue=""
                  placeholder="450000"
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Método de pago</Label>
                <Select name="method" defaultValue="transferencia">
                  <SelectTrigger id="method" className="w-full">
                    <SelectValue>{(value: string) => value}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "efectivo", label: "Efectivo" },
                      { value: "transferencia", label: "Transferencia" },
                      { value: "debito", label: "Débito" },
                      { value: "cheque", label: "Cheque" },
                    ].map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issued-date">Fecha de emisión</Label>
              <Input
                id="issued-date"
                name="issuedDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Notas del recibo..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href="/recibos"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Cancelar
              </Link>
              <Button type="submit">Emitir recibo</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
