import { Badge } from "@/components/ui/badge";
import { operationLabels, typeLabels } from "@/features/properties/constants";

import type { SearchPlan } from "../query";

function money(value: number, currency: string | undefined) {
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value);
  return currency ? `${currency} ${formatted}` : formatted;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function IntentChips({ plan }: { plan: SearchPlan }) {
  const chips: string[] = [];

  if (plan.operation) {
    chips.push(`Operación: ${operationLabels[plan.operation]}`);
  }
  for (const type of plan.propertyTypes) {
    chips.push(`Tipo: ${typeLabels[type]}`);
  }
  if (plan.city) {
    chips.push(`Zona: ${titleCase(plan.city)}`);
  }
  if (plan.minPrice !== undefined) {
    chips.push(`Desde ${money(plan.minPrice, plan.currency)}`);
  }
  if (plan.maxPrice !== undefined) {
    chips.push(`Hasta ${money(plan.maxPrice, plan.currency)}`);
  }
  if (
    plan.currency &&
    plan.minPrice === undefined &&
    plan.maxPrice === undefined
  ) {
    chips.push(`Moneda: ${plan.currency}`);
  }
  for (const token of plan.tokens) {
    chips.push(`Texto: ${token}`);
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Badge key={chip} variant="secondary" className="font-normal">
          {chip}
        </Badge>
      ))}
    </div>
  );
}
