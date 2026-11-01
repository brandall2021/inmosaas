"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteSettlementExpenseAction } from "../actions";

export function DeleteExpenseButton({
  id,
  _settlementId,
  disabled = false,
}: {
  id: string;
  _settlementId: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={deleteSettlementExpenseAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este ítem definitivamente?")) {
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
        aria-label={`Eliminar ítem ${id}`}
      >
        <Trash2 className="size-4" />
        Eliminar
      </Button>
    </form>
  );
}
