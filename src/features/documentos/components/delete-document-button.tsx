"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteDocumentAction } from "../actions";

export function DeleteDocumentButton({ id }: { id: string }) {
  return (
    <form
      action={deleteDocumentAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este documento definitivamente?")) {
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
