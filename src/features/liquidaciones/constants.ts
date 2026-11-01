import type { CatalogOption } from "@/features/catalogos/constants";
import type { PaymentMethod, SettlementItemType, SettlementStatus } from "@/db/schema";

export type { CatalogOption };

export const SETTLEMENT_STATUSES: CatalogOption<SettlementStatus>[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagada", label: "Pagada" },
];

export const settlementStatusLabels = SETTLEMENT_STATUSES.reduce<
  Record<SettlementStatus, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<SettlementStatus, string>);

export const SETTLEMENT_ITEM_TYPES: CatalogOption<SettlementItemType>[] = [
  { value: "gasto", label: "Gasto (descuenta)" },
  { value: "adicional", label: "Adicional (suma)" },
];

export const settlementItemTypeLabels = SETTLEMENT_ITEM_TYPES.reduce<
  Record<SettlementItemType, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<SettlementItemType, string>);

export const SETTLEMENT_METHODS: CatalogOption<PaymentMethod>[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "debito", label: "Débito" },
  { value: "cheque", label: "Cheque" },
];

export const settlementMethodLabels = SETTLEMENT_METHODS.reduce<
  Record<PaymentMethod, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<PaymentMethod, string>);

/** Period input value format (`YYYY-MM`). */
export const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Human label for a `YYYY-MM` period: "septiembre de 2026". */
export function formatPeriod(period: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) {
    return period;
  }
  const date = new Date(`${period}-15T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return period;
  }
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Current period as `YYYY-MM`, in UTC so it matches payment attribution. */
export function currentPeriod(today = new Date()): string {
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
