"use client";

import { Badge } from "@/components/ui/badge";
import type { ValuationStatus } from "@/db/schema";

import { valuationStatusLabels } from "../constants";

const variantByStatus: Record<
  ValuationStatus,
  "default" | "secondary" | "outline"
> = {
  pendiente: "outline",
  en_revision: "secondary",
  completada: "default",
};

export function StatusBadge({ status }: { status: ValuationStatus }) {
  return (
    <Badge variant={variantByStatus[status]}>
      {valuationStatusLabels[status]}
    </Badge>
  );
}
