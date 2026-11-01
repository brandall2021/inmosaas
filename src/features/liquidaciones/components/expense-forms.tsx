"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  addSettlementExpenseAction,
  updateSettlementExpenseAction,
} from "../actions";
import { SETTLEMENT_ITEM_TYPES } from "../constants";
import type { ExpenseRow } from "../data";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function AddExpenseForm({
  settlementId,
}: {
  settlementId: string;
}) {
  const [state, formAction, pending] = useActionState(addSettlementExpenseAction, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="settlementId" value={settlementId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="expense-concept">Concepto</Label>
          <Input
            id="expense-concept"
            name="concept"
            defaultValue=""
            placeholder="Ej. Expensas del mes"
            required
          />
          <FieldError messages={errors?.concept} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-amount">Monto</Label>
          <Input
            id="expense-amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue=""
            placeholder="20000"
            required
          />
          <FieldError messages={errors?.amount} />
        </div>
        <div className="space-y-2 flex items-end">
          <Label htmlFor="expense-type">Tipo</Label>
          <Select name="type" defaultValue="gasto">
            <SelectTrigger id="expense-type" className="w-full">
              <SelectValue>{(value: string) => value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SETTLEMENT_ITEM_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={errors?.type} />
        </div>
      </div>

      {state && !state.success && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Agregando..." : "Agregar ítem"}
        </Button>
      </div>
    </form>
  );
}

export function EditExpenseForm({
  expense,
  settlementId,
}: {
  expense: ExpenseRow;
  settlementId: string;
}) {
  const [state, formAction, pending] = useActionState(updateSettlementExpenseAction, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={expense.id} />
      <input type="hidden" name="settlementId" value={settlementId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs">Concepto</Label>
          <Input
            name="concept"
            defaultValue={expense.concept}
            required
          />
          <FieldError messages={errors?.concept} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Monto</Label>
          <Input
            name="amount"
            type="number"
            step="0.01"
            defaultValue={String(expense.amount)}
            required
          />
          <FieldError messages={errors?.amount} />
        </div>
        <div className="space-y-2 flex items-end">
          <Label className="text-xs">Tipo</Label>
          <Select name="type" defaultValue={expense.type}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SETTLEMENT_ITEM_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={errors?.type} />
        </div>
      </div>

      {state && !state.success && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
