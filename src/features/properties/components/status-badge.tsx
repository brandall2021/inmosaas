"use client";

import { Badge } from "@/components/ui/badge";
import type { PropertyStatus } from "@/db/schema";
import { statusLabels } from "../constants";

const variantByStatus: Record<
  PropertyStatus,
  "default" | "secondary" | "outline"
> = {
  disponible: "default",
  reservada: "secondary",
  vendida: "outline",
  alquilada: "secondary",
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge variant={variantByStatus[status]}>{statusLabels[status]}</Badge>;
}
