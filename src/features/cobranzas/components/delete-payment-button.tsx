"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deletePaymentAction } from "../actions";

export function DeletePaymentButton({ id }: { id: string }) {
  return (
    <form
      action={deletePaymentAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este pago definitivamente?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-label={`Eliminar pago ${id}`}
      >
        <Trash2 className="size-4 text-destructive" />
        Eliminar
      </Button>
    </form>
  );
}
