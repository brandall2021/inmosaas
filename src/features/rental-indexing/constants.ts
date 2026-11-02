import type { Currency } from "@/db/schema";

export type RentalIndexType =
  | "ninguno"
  | "icl"
  | "ipc"
  | "casa_propia"
  | "cer"
  | "uva"
  | "otro";

export type RentalPenaltyStatus = "pendiente" | "pagado";

export const RENTAL_INDEX_TYPES = [
  { value: "ninguno", label: "Sin ajuste por índice" },
  { value: "icl", label: "ICL" },
  { value: "ipc", label: "IPC" },
  { value: "casa_propia", label: "Casa Propia" },
  { value: "cer", label: "CER" },
  { value: "uva", label: "UVA" },
  { value: "otro", label: "Otro" },
] as const;

export const rentalIndexTypeLabels = RENTAL_INDEX_TYPES.reduce<
  Record<RentalIndexType, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<RentalIndexType, string>);

export const RENTAL_PENALTY_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
] as const;

export const rentalPenaltyStatusLabels = RENTAL_PENALTY_STATUSES.reduce<
  Record<RentalPenaltyStatus, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<RentalPenaltyStatus, string>);

/** Calcular nuevo monto de alquiler aplicando un índice. */
export function calculateIndexAdjustment(
  previousRent: number,
  baseIndex: number,
  newIndex: number,
): number {
  if (baseIndex <= 0) {
    return previousRent;
  }
  return Math.round((previousRent * newIndex) / baseIndex * 100) / 100;
}

/** Calcular punitorio por mora. */
export function calculatePenalty(
  overdueAmount: number,
  overdueDays: number,
  dailyRate: number,
): number {
  if (overdueAmount <= 0 || overdueDays <= 0 || dailyRate <= 0) {
    return 0;
  }
  return Math.round((overdueAmount * dailyRate * overdueDays) / 100 * 100) / 100;
}

/** Formatear moneda. */
export function formatCurrency(amount: number | null, currency: Currency): string {
  if (amount === null) {
    return "—";
  }
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency} ${formatted}`;
}
