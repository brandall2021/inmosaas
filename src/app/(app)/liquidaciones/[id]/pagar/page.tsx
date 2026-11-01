import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

import { markSettlementPaidAction } from "@/features/liquidaciones/actions";
import { formatPrice } from "@/features/properties/constants";
import { getSettlement } from "@/features/liquidaciones/data";
import { SETTLEMENT_METHODS } from "@/features/liquidaciones/constants";
import { getActiveOrganization, hasRole, requireMembership, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function PaySettlementPage({
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
  const settlement = await getSettlement(org.id, id);
  if (!settlement) {
    notFound();
  }

  const role = await requireMembership(user.id, org.id);
  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/liquidaciones/${settlement.id}`);
  }
  if (settlement.status !== "pendiente") {
    redirect(`/liquidaciones/${settlement.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={`/liquidaciones/${settlement.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Confirmar pago al propietario</CardTitle>
          <CardDescription>
            Liquidación {settlement.period} — neto{" "}
            {formatPrice(
              Number(settlement.grossAmount) -
                Number(settlement.grossAmount) *
                  (Number(settlement.feePercent ?? 0) / 100),
              settlement.currency,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async (formData: FormData) => {
              await markSettlementPaidAction(undefined, formData);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={settlement.id} />

            <div className="space-y-2">
              <Label htmlFor="paid-date">Fecha de pago</Label>
              <Input
                id="paid-date"
                name="paidDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método de pago</Label>
              <Select name="method" defaultValue="transferencia">
                <SelectTrigger id="method" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      SETTLEMENT_METHODS.find((m) => m.value === value)?.label ??
                      null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SETTLEMENT_METHODS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Ej. Transferencia del mes de septiembre..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href={`/liquidaciones/${settlement.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Cancelar
              </Link>
              <Button type="submit">Confirmar pago</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
