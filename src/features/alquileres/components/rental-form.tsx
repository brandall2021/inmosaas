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
import { CURRENCIES } from "@/features/properties/constants";
import { cn } from "@/lib/utils";
import type { Rental } from "@/db/schema";

import { createRentalAction, updateRentalAction } from "../actions";
import {
  NONE_VALUE,
  RENTAL_STATUSES,
  rentalStatusLabels,
} from "../constants";
import type { RentalOption } from "../data";

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

function buildRefOptions(items: RentalOption[]) {
  return [
    { value: NONE_VALUE, label: "Sin asignar" },
    ...items.map((item) => ({ value: item.id, label: item.label })),
  ];
}

function buildRefLabels(items: RentalOption[]) {
  return items.reduce<Record<string, string>>(
    (acc, item) => {
      acc[item.id] = item.label;
      return acc;
    },
    { [NONE_VALUE]: "Sin asignar" },
  );
}

export function RentalForm({
  rental,
  propertyOptions,
  clientOptions,
}: {
  rental?: Rental;
  propertyOptions: RentalOption[];
  clientOptions: RentalOption[];
}) {
  const isEdit = Boolean(rental);
  const action = isEdit ? updateRentalAction : createRentalAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Editar alquiler" : "Nuevo alquiler"}
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {rental ? <input type="hidden" name="id" value={rental.id} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="propertyId"
              name="propertyId"
              label="Propiedad"
              options={buildRefOptions(propertyOptions)}
              labels={buildRefLabels(propertyOptions)}
              defaultValue={rental?.propertyId ?? NONE_VALUE}
            />
            <SelectField
              id="clientId"
              name="clientId"
              label="Inquilino"
              options={buildRefOptions(clientOptions)}
              labels={buildRefLabels(clientOptions)}
              defaultValue={rental?.clientId ?? NONE_VALUE}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={rental?.startDate ?? ""}
                required
              />
              <FieldError messages={errors?.startDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={rental?.endDate ?? ""}
              />
              <FieldError messages={errors?.endDate} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="rentAmount">Canon mensual</Label>
              <Input
                id="rentAmount"
                name="rentAmount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={rental?.rentAmount ?? ""}
                placeholder="250000"
              />
              <FieldError messages={errors?.rentAmount} />
            </div>
            <SelectField
              id="currency"
              name="currency"
              label="Moneda"
              options={CURRENCIES}
              labels={{ ARS: "ARS", USD: "USD" }}
              defaultValue={rental?.currency ?? "ARS"}
            />
          </div>

          <SelectField
            id="status"
            name="status"
            label="Estado"
            options={RENTAL_STATUSES}
            labels={rentalStatusLabels}
            defaultValue={rental?.status ?? "vigente"}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={5}
              defaultValue={rental?.notes ?? ""}
              placeholder="Depósito, condiciones, indexación..."
            />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Link
            href={rental ? `/alquileres/${rental.id}` : "/alquileres"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear alquiler"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
