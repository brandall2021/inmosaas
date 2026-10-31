import type { PaymentMethod } from "@/db/schema";

import type { CatalogOption } from "@/features/catalogos/constants";

export const PAYMENT_METHODS: CatalogOption<PaymentMethod>[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "debito", label: "Débito" },
  { value: "cheque", label: "Cheque" },
];

export const paymentMethodLabels = PAYMENT_METHODS.reduce<
  Record<PaymentMethod, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<PaymentMethod, string>);
