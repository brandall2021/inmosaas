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
import { cn } from "@/lib/utils";

import { createDocumentUploadAction } from "../actions";
import {
  ACCEPTED_DOCUMENT_ATTRIBUTE,
  DOCUMENT_EXTENSIONS_LABEL,
} from "../document-constants";
import type { DocumentOption } from "../data";

const NONE_VALUE = "none";

const fileInputClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground outline-none transition-colors file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm file:text-foreground hover:file:bg-muted/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function SelectField({
  id,
  name,
  label,
  options,
  labels,
}: {
  id: string;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  labels: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={NONE_VALUE}>
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

function buildOptions(items: DocumentOption[]) {
  return [
    { value: NONE_VALUE, label: "Sin asignar" },
    ...items.map((item) => ({ value: item.id, label: item.label })),
  ];
}

function buildLabels(items: DocumentOption[]) {
  return items.reduce<Record<string, string>>(
    (acc, item) => {
      acc[item.id] = item.label;
      return acc;
    },
    { [NONE_VALUE]: "Sin asignar" },
  );
}

export function DocumentUploadForm({
  propertyOptions,
  clientOptions,
  rentalOptions,
}: {
  propertyOptions: DocumentOption[];
  clientOptions: DocumentOption[];
  rentalOptions: DocumentOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createDocumentUploadAction,
    undefined,
  );
  const errors = state && !state.success ? state.errors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Subir documento</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              maxLength={120}
              placeholder="Contrato firmado - Depto Centro"
              required
            />
            <FieldError messages={errors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept={ACCEPTED_DOCUMENT_ATTRIBUTE}
              className={fileInputClass}
              required
            />
            <p className="text-xs text-muted-foreground">
              {DOCUMENT_EXTENSIONS_LABEL}, hasta 10 MB.
            </p>
            <FieldError messages={errors?.file} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="propertyId"
              name="propertyId"
              label="Propiedad"
              options={buildOptions(propertyOptions)}
              labels={buildLabels(propertyOptions)}
            />
            <SelectField
              id="clientId"
              name="clientId"
              label="Cliente"
              options={buildOptions(clientOptions)}
              labels={buildLabels(clientOptions)}
            />
          </div>

          <SelectField
            id="rentalId"
            name="rentalId"
            label="Alquiler"
            options={buildOptions(rentalOptions)}
            labels={buildLabels(rentalOptions)}
          />

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-2">
          <Link
            href="/documentos"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? "Subiendo..." : "Subir documento"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
