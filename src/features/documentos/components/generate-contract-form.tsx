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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { generateContractAction } from "../actions";

export function GenerateContractForm({ rentalId }: { rentalId: string }) {
  const [state, formAction, pending] = useActionState(
    generateContractAction,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generar contrato</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <input type="hidden" name="rentalId" value={rentalId} />

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Condiciones adicionales</Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={3}
              placeholder="Indexación, depósito, mascotas, servicios..."
            />
          </div>

          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <div className="px-6 pb-6">
          <Button type="submit" disabled={pending}>
            <FileText />
            {pending ? "Generando..." : "Generar contrato"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
