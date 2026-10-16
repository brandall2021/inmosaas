"use client";

import { Badge } from "@/components/ui/badge";
import type { CatalogKind } from "@/db/schema";

import { catalogKindLabels } from "../constants";

const variantByKind: Record<
  CatalogKind,
  "default" | "secondary" | "outline"
> = {
  zona: "default",
  amenity: "secondary",
  servicio: "outline",
  etiqueta: "secondary",
};

export function CatalogKindBadge({ kind }: { kind: CatalogKind }) {
  return (
    <Badge variant={variantByKind[kind]}>{catalogKindLabels[kind]}</Badge>
  );
}
