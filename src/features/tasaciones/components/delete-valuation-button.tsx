"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteValuationAction } from "../actions";

export function DeleteValuationButton({ id }: { id: string }) {
  return (
    <form
      action={deleteValuationAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar esta tasación definitivamente?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive">
        <Trash2 />
        Eliminar
      </Button>
    </form>
  );
}
