"use client";

import { Badge } from "@/components/ui/badge";
import type { ClientStage } from "@/db/schema";

import { clientStageLabels } from "../constants";

const variantByStage: Record<
  ClientStage,
  "default" | "secondary" | "outline"
> = {
  nuevo: "outline",
  contactado: "secondary",
  visitando: "secondary",
  negociacion: "default",
  cerrado: "outline",
};

export function StageBadge({ stage }: { stage: ClientStage }) {
  return (
    <Badge variant={variantByStage[stage]}>{clientStageLabels[stage]}</Badge>
  );
}
