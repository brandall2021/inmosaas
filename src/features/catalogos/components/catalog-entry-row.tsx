import Link from "next/link";
import { Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { CatalogEntry } from "@/db/schema";
import { cn } from "@/lib/utils";

import { CatalogKindBadge } from "./kind-badge";
import { DeleteCatalogEntryButton } from "./delete-catalog-entry-button";

export function CatalogEntryRow({ entry }: { entry: CatalogEntry }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/catalogos/${entry.id}/editar`}
            className="truncate font-medium hover:underline"
          >
            {entry.name}
          </Link>
          <CatalogKindBadge kind={entry.kind} />
        </div>
        {entry.description ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {entry.description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/catalogos/${entry.id}/editar`}
          aria-label={`Editar ${entry.name}`}
          title="Editar"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <Pencil />
        </Link>
        <DeleteCatalogEntryButton id={entry.id} name={entry.name} />
      </div>
    </div>
  );
}
