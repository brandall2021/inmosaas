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
import type { CatalogEntry, CatalogKind } from "@/db/schema";

import { createCatalogEntryAction, updateCatalogEntryAction } from "../actions";
import { CATALOG_KINDS, catalogKindLabels } from "../constants";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function CatalogEntryForm({ entry }: { entry?: CatalogEntry }) {
  const isEdit = Boolean(entry);
  const action = isEdit ? updateCatalogEntryAction : createCatalogEntryAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Editar elemento" : "Nuevo elemento"}
        </CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {entry ? <input type="hidden" name="id" value={entry.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={entry?.name ?? ""}
              placeholder="Palermo, Pileta, Apto crédito..."
              required
            />
            <FieldError messages={errors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kind">Tipo de catálogo</Label>
            <Select name="kind" defaultValue={entry?.kind ?? "zona"}>
              <SelectTrigger id="kind" className="w-full">
                <SelectValue>
                  {(value) =>
                    value ? catalogKindLabels[value as CatalogKind] : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATALOG_KINDS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={errors?.kind} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={entry?.description ?? ""}
              placeholder="Detalle opcional de este elemento"
            />
            <FieldError messages={errors?.description} />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Link
            href="/catalogos"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Crear elemento"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
