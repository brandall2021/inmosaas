"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deletePropertyImageAction } from "../actions";

export function DeleteImageButton({ id }: { id: string }) {
  return (
    <form
      action={deletePropertyImageAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar esta imagen?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="destructive"
        size="icon-sm"
        aria-label="Eliminar imagen"
      >
        <Trash2 />
      </Button>
    </form>
  );
}
