"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { pingWebhookAction } from "../actions";

export function TestConnectionButton() {
  const [state, formAction, pending] = useActionState(
    pingWebhookAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Enviando..." : "Probar conexión"}
      </Button>
      {state?.message ? (
        <span
          className={
            state.success
              ? "text-sm text-emerald-600"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
