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
import type { Property } from "@/db/schema";

import { createPropertyAction, updatePropertyAction } from "../actions";
import {
  CURRENCIES,
  PROPERTY_OPERATIONS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  typeLabels,
  operationLabels,
  statusLabels,
} from "../constants";

type SelectOption = { value: string; label: string };

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
  options: SelectOption[];
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

export function PropertyForm({ property }: { property?: Property }) {
  const isEdit = Boolean(property);
  const action = isEdit ? updatePropertyAction : createPropertyAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Editar propiedad" : "Nueva propiedad"}
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {property ? (
            <input type="hidden" name="id" value={property.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              defaultValue={property?.title ?? ""}
              placeholder="Departamento 2 ambientes en Palermo"
              required
            />
            <FieldError messages={errors?.title} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              id="operation"
              name="operation"
              label="Operación"
              options={PROPERTY_OPERATIONS}
              labels={operationLabels}
              defaultValue={property?.operation ?? "venta"}
            />
            <SelectField
              id="propertyType"
              name="propertyType"
              label="Tipo"
              options={PROPERTY_TYPES}
              labels={typeLabels}
              defaultValue={property?.propertyType ?? "departamento"}
            />
            <SelectField
              id="status"
              name="status"
              label="Estado"
              options={PROPERTY_STATUSES}
              labels={statusLabels}
              defaultValue={property?.status ?? "disponible"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={property?.price ?? ""}
                placeholder="120000"
              />
              <FieldError messages={errors?.price} />
            </div>
            <SelectField
              id="currency"
              name="currency"
              label="Moneda"
              options={CURRENCIES}
              labels={{ USD: "USD", ARS: "ARS" }}
              defaultValue={property?.currency ?? "USD"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              defaultValue={property?.address ?? ""}
              placeholder="Av. Santa Fe 1234"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                name="city"
                defaultValue={property?.city ?? ""}
                placeholder="CABA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                name="province"
                defaultValue={property?.province ?? ""}
                placeholder="Buenos Aires"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="rooms">Ambientes</Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                min={0}
                defaultValue={property?.rooms ?? ""}
              />
              <FieldError messages={errors?.rooms} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Dormitorios</Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min={0}
                defaultValue={property?.bedrooms ?? ""}
              />
              <FieldError messages={errors?.bedrooms} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min={0}
                defaultValue={property?.bathrooms ?? ""}
              />
              <FieldError messages={errors?.bathrooms} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaM2">Superficie (m²)</Label>
              <Input
                id="areaM2"
                name="areaM2"
                type="number"
                min={0}
                defaultValue={property?.areaM2 ?? ""}
              />
              <FieldError messages={errors?.areaM2} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={property?.description ?? ""}
              placeholder="Detalles, amenities, expensas..."
            />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Link
            href={property ? `/propiedades/${property.id}` : "/propiedades"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Crear propiedad"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
