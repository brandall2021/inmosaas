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
import type { Client } from "@/db/schema";

import { createClientAction, updateClientAction } from "../actions";
import { CLIENT_STAGES, CLIENT_TYPES, clientStageLabels, clientTypeLabels } from "../constants";

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

export function ClientForm({ client }: { client?: Client }) {
  const isEdit = Boolean(client);
  const action = isEdit ? updateClientAction : createClientAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Editar cliente" : "Nuevo cliente"}
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {client ? <input type="hidden" name="id" value={client.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              name="name"
              defaultValue={client?.name ?? ""}
              placeholder="Juan Pérez"
              required
            />
            <FieldError messages={errors?.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="type"
              name="type"
              label="Tipo"
              options={CLIENT_TYPES}
              labels={clientTypeLabels}
              defaultValue={client?.type ?? "comprador"}
            />
            <SelectField
              id="stage"
              name="stage"
              label="Etapa"
              options={CLIENT_STAGES}
              labels={clientStageLabels}
              defaultValue={client?.stage ?? "nuevo"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={client?.email ?? ""}
                placeholder="juan@example.com"
              />
              <FieldError messages={errors?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={client?.phone ?? ""}
                placeholder="+54 11 5555 5555"
              />
              <FieldError messages={errors?.phone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={5}
              defaultValue={client?.notes ?? ""}
              placeholder="Presupuesto, zona buscada, preferencias..."
            />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Link
            href={client ? `/crm/${client.id}` : "/crm"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Crear cliente"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
