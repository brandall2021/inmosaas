"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { cn } from "@/lib/utils";
import type { Valuation } from "@/db/schema";

import { createValuationAction, updateValuationAction } from "../actions";
import { VALUATION_STATUSES, valuationStatusLabels } from "../constants";

function SelectField({
  id,
  name,
  label,
  options,
  labels,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  labels: Record<string, string>;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            {(value) => (value ? labels[value as string] : null)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function ValuationForm({ valuation }: { valuation?: Valuation }) {
  const isEdit = Boolean(valuation);
  const action = isEdit ? updateValuationAction : createValuationAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Editar tasación" : "Nueva tasación"}
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {valuation ? <input type="hidden" name="id" value={valuation.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={valuation?.title ?? ""}
              placeholder="Tasación Edificio Av. Santa Fe 1234"
              required
            />
            <FieldError messages={errors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              defaultValue={valuation?.address ?? ""}
              placeholder="Av. Santa Fe 1234, CABA"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="areaM2">Superficie (m²)</Label>
              <Input
                id="areaM2"
                name="areaM2"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={valuation?.areaM2 ?? ""}
              />
              <FieldError messages={errors?.areaM2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerM2">Valor por m²</Label>
              <Input
                id="pricePerM2"
                name="pricePerM2"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={valuation?.pricePerM2 ?? ""}
              />
              <FieldError messages={errors?.pricePerM2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Valor total estimado</Label>
              <Input
                id="totalPrice"
                name="totalPrice"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={valuation?.totalPrice ?? ""}
              />
              <FieldError messages={errors?.totalPrice} />
            </div>
          </div>

          <SelectField
            id="status"
            name="status"
            label="Estado"
            options={VALUATION_STATUSES}
            labels={valuationStatusLabels}
            defaultValue={valuation?.status ?? "pendiente"}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={5}
              defaultValue={valuation?.notes ?? ""}
              placeholder="Método comparativo, fuentes, ajustes..."
            />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Link
            href={valuation ? `/tasaciones/${valuation.id}` : "/tasaciones"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Crear tasación"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
