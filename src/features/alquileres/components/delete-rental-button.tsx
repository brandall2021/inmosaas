"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteRentalAction } from "../actions";

export function DeleteRentalButton({ id }: { id: string }) {
  return (
    <form
      action={deleteRentalAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este alquiler definitivamente?")) {
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
