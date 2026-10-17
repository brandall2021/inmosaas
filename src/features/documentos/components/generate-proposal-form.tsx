"use client";

import { useActionState } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

import { generateProposalAction } from "../actions";
import type { DocumentOption } from "../data";

const NONE_VALUE = "none";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function GenerateProposalForm({
  propertyId,
  clientOptions,
}: {
  propertyId: string;
  clientOptions: DocumentOption[];
}) {
  const [state, formAction, pending] = useActionState(
    generateProposalAction,
    undefined,
  );
  const errors = state && !state.success ? state.errors : undefined;

  const labels = clientOptions.reduce<Record<string, string>>(
    (acc, option) => {
      acc[option.id] = option.label;
      return acc;
    },
    { [NONE_VALUE]: "Sin destinatario" },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generar propuesta</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <input type="hidden" name="propertyId" value={propertyId} />

          <div className="space-y-2">
            <Label htmlFor="clientId">Destinatario</Label>
            <Select name="clientId" defaultValue={NONE_VALUE}>
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue>
                  {(value) => (value ? labels[value as string] : null)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sin destinatario</SelectItem>
                {clientOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={errors?.clientId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Vigencia</Label>
            <Input id="expiresAt" name="expiresAt" type="date" />
            <FieldError messages={errors?.expiresAt} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              name="message"
              rows={3}
              placeholder="Mensaje comercial para el destinatario..."
            />
            <FieldError messages={errors?.message} />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <div className="px-6 pb-6">
          <Button type="submit" disabled={pending}>
            <FileText />
            {pending ? "Generando..." : "Generar propuesta"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
