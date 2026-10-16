"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteCatalogEntryAction } from "../actions";

export function DeleteCatalogEntryButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteCatalogEntryAction}
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar «${name}» del catálogo?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label={`Eliminar ${name}`}
        title="Eliminar"
      >
        <Trash2 />
      </Button>
    </form>
  );
}
