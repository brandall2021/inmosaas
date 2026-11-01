"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveIntegrationsAction } from "../actions";
import type { IntegrationRow } from "../data";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

/** Random hex secret filled client-side; visible while typing but the stored
 * value is never sent back to the browser. */
function generateSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function IntegrationsForm({ integration }: { integration?: IntegrationRow }) {
  const [state, formAction, pending] = useActionState(
    saveIntegrationsAction,
    undefined,
  );
  const errors = state && !state.success ? state.errors : undefined;
  const success = state && state.success ? state.message : undefined;
  const [secretValue, setSecretValue] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  const hasSecret = Boolean(integration?.webhookSecret);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Integraciones</CardTitle>
        <CardDescription>
          Notificá eventos de la inmobiliaria hacia tus propias herramientas.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL del webhook</Label>
            <Input
              id="webhookUrl"
              name="webhookUrl"
              type="url"
              inputMode="url"
              defaultValue={integration?.webhookUrl ?? ""}
              placeholder="https://ejemplo.com/webhooks/inmo"
              autoComplete="off"
            />
            <p className="text-sm text-muted-foreground">
              Recibe un POST JSON cuando se crea, edita o elimina una propiedad,
              un cliente, una tasación o un alquiler.
            </p>
            <FieldError messages={errors?.webhookUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Secreto de firma (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="webhookSecret"
                name="webhookSecret"
                type={secretVisible ? "text" : "password"}
                inputMode="text"
                value={secretValue}
                onChange={(event) => setSecretValue(event.target.value)}
                placeholder={
                  hasSecret ? "•••••••• (dejá vacío para conservar)" : "Sin firma"
                }
                autoComplete="off"
                className="font-mono"
              />
              {secretValue !== "" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSecretVisible((visible) => !visible)}
                >
                  {secretVisible ? "Ocultar" : "Mostrar"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSecretValue(generateSecret())}
                >
                  Generar
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasSecret
                ? "Existe un secreto guardado: no se vuelve a mostrar. Escribí uno nuevo para reemplazarlo."
                : "Si lo definís, cada evento viaja firmado con el header X-InmoSaaS-Signature (HMAC-SHA256 del cuerpo)."}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-md border p-3">
            <input
              id="webhookEnabled"
              name="webhookEnabled"
              type="checkbox"
              defaultChecked={integration?.webhookEnabled ?? false}
              className="size-4 rounded border-border accent-primary"
            />
            <div className="space-y-1">
              <Label
                htmlFor="webhookEnabled"
                className="cursor-pointer text-sm font-normal"
              >
                Enviar eventos a este webhook
              </Label>
              <p className="text-sm text-muted-foreground">
                Si está desactivado, la URL queda guardada sin disparar eventos.
              </p>
            </div>
          </div>

          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          {state && !state.success && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
        </CardContent>

        <CardFooter className="mt-6 justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar integración"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
