"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deletePropertyAction } from "../actions";

export function DeletePropertyButton({ id }: { id: string }) {
  return (
    <form
      action={deletePropertyAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar esta propiedad definitivamente?")) {
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
