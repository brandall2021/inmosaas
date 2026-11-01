"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteSettlementAction } from "../actions";

export function DeleteSettlementButton({
  id,
  disabled = false,
}: {
  id: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={deleteSettlementAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar esta liquidación definitivamente?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={disabled}
        aria-label={`Eliminar liquidación ${id}`}
      >
        <Trash2 className="size-4" />
        Eliminar
      </Button>
    </form>
  );
}
