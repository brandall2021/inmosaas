"use client";

import { Badge } from "@/components/ui/badge";
import type { RentalStatus } from "@/db/schema";

import { rentalStatusLabels } from "../constants";

const variantByStatus: Record<
  RentalStatus,
  "default" | "secondary" | "outline"
> = {
  vigente: "default",
  finalizado: "secondary",
  rescindido: "outline",
};

export function StatusBadge({ status }: { status: RentalStatus }) {
  return <Badge variant={variantByStatus[status]}>{rentalStatusLabels[status]}</Badge>;
}
