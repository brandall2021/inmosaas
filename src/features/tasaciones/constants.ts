import type { ValuationStatus } from "@/db/schema";

export type ValuationOption<T extends string> = {
  value: T;
  label: string;
};

export const VALUATION_STATUSES: ValuationOption<ValuationStatus>[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "completada", label: "Completada" },
];

const toLabelMap = <T extends string>(
  options: ValuationOption<T>[],
): Record<T, string> =>
  options.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<T, string>,
  );

export const valuationStatusLabels = toLabelMap(VALUATION_STATUSES);

export function formatCurrency(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (value == null) {
    return "—";
  }

  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value);

  return `${currency} ${formatted}`;
}
