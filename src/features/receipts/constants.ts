import type { CatalogOption } from "@/features/catalogos/constants";
import type { Currency, PaymentMethod } from "@/db/schema";

export type { CatalogOption };

export type ReceiptStatus = "emitido" | "pagado" | "anulado";

export const RECEIPT_STATUSES: CatalogOption<ReceiptStatus>[] = [
  { value: "emitido", label: "Emitido" },
  { value: "pagado", label: "Pagado" },
  { value: "anulado", label: "Anulado" },
];

export const receiptStatusLabels = RECEIPT_STATUSES.reduce<
  Record<ReceiptStatus, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<ReceiptStatus, string>);

export const RECEIPT_METHODS: CatalogOption<PaymentMethod>[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "debito", label: "Débito" },
  { value: "cheque", label: "Cheque" },
];

export const receiptMethodLabels = RECEIPT_METHODS.reduce<
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

/** Current period as `YYYY-MM`, in UTC. */
export function currentPeriod(today = new Date()): string {
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Currency label. */
export function formatCurrency(currency: Currency): string {
  return currency;
}
