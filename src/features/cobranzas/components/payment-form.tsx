"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { RentalPayment } from "@/features/cobranzas/data";

import {
  createPaymentAction,
  updatePaymentAction,
} from "../actions";
import { PAYMENT_METHODS, paymentMethodLabels } from "../constants";

type SelectOption = { value: string; label: string };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function PaymentForm({
  rentalId,
  payment,
}: {
  rentalId: string;
  payment?: RentalPayment;
}) {
  const isEdit = Boolean(payment);
  const action = isEdit ? updatePaymentAction : createPaymentAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      {payment ? (
        <input type="hidden" name="id" value={payment.id} />
      ) : (
        <input type="hidden" name="rentalId" value={rentalId} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={payment?.amount ?? ""}
            placeholder="450000"
            required
          />
          <FieldError messages={errors?.amount} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidDate">Fecha de cobro</Label>
          <Input
            id="paidDate"
            name="paidDate"
            type="date"
            defaultValue={payment?.paidDate ?? ""}
            required
          />
          <FieldError messages={errors?.paidDate} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Método</Label>
        <Select
          name="method"
          defaultValue={payment?.method ?? "transferencia"}
        >
          <SelectTrigger id="method" className="w-full">
            <SelectValue>
              {(
                value: string,
              ) => paymentMethodLabels[value as keyof typeof paymentMethodLabels] ?? null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((option: SelectOption) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={errors?.method} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-notes">Notas</Label>
        <Textarea
          id="payment-notes"
          name="notes"
          rows={2}
          defaultValue={payment?.notes ?? ""}
          placeholder="Transferencia del mes de julio..."
        />
      </div>

      {state && !state.success && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        {isEdit ? (
          <Link
            href={`/alquileres/${rentalId}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : isEdit ? "Guardar pago" : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
}
