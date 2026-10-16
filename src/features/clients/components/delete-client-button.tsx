"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteClientAction } from "../actions";

export function DeleteClientButton({ id }: { id: string }) {
  return (
    <form
      action={deleteClientAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este cliente definitivamente?")) {
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
