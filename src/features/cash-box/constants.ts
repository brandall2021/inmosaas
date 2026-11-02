import type { Currency } from "@/db/schema";

export type CashBoxEntryType = "ingreso" | "egreso";

export type CashBoxCategory =
  | "ventas"
  | "alquileres"
  | "servicios"
  | "expensas"
  | "impuestos"
  | "sueldos"
  | "mantenimiento"
  | "otros";

export type CashBoxEntryStatus = "pendiente" | "conciliado";

export const CASH_BOX_ENTRY_TYPES = [
  { value: "ingreso", label: "Ingreso" },
  { value: "egreso", label: "Egreso" },
] as const;

export const cashBoxEntryTypeLabels = CASH_BOX_ENTRY_TYPES.reduce<
  Record<CashBoxEntryType, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<CashBoxEntryType, string>);

export const CASH_BOX_CATEGORIES = [
  { value: "ventas", label: "Ventas" },
  { value: "alquileres", label: "Alquileres" },
  { value: "servicios", label: "Servicios" },
  { value: "expensas", label: "Expensas" },
  { value: "impuestos", label: "Impuestos" },
  { value: "sueldos", label: "Sueldos" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otros", label: "Otros" },
] as const;

export const cashBoxCategoryLabels = CASH_BOX_CATEGORIES.reduce<
  Record<CashBoxCategory, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<CashBoxCategory, string>);

export const CASH_BOX_ENTRY_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "conciliado", label: "Conciliado" },
] as const;

export const cashBoxEntryStatusLabels = CASH_BOX_ENTRY_STATUSES.reduce<
  Record<CashBoxEntryStatus, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<CashBoxEntryStatus, string>);

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
