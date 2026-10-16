import type {
  Currency,
  PropertyOperation,
  PropertyStatus,
  PropertyType,
} from "@/db/schema";

export type PropertyOption<T extends string> = {
  value: T;
  label: string;
};

export const PROPERTY_OPERATIONS: PropertyOption<PropertyOperation>[] = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];

export const PROPERTY_TYPES: PropertyOption<PropertyType>[] = [
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "ph", label: "PH" },
  { value: "terreno", label: "Terreno" },
  { value: "local", label: "Local" },
  { value: "oficina", label: "Oficina" },
  { value: "cochera", label: "Cochera" },
  { value: "campo", label: "Campo" },
];

export const PROPERTY_STATUSES: PropertyOption<PropertyStatus>[] = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
  { value: "alquilada", label: "Alquilada" },
];

export const CURRENCIES: PropertyOption<Currency>[] = [
  { value: "USD", label: "USD" },
  { value: "ARS", label: "ARS" },
];

const toLabelMap = <T extends string>(
  options: PropertyOption<T>[],
): Record<T, string> =>
  options.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<T, string>,
  );

export const operationLabels = toLabelMap(PROPERTY_OPERATIONS);
export const typeLabels = toLabelMap(PROPERTY_TYPES);
export const statusLabels = toLabelMap(PROPERTY_STATUSES);

/** Human-friendly price, e.g. `USD 120.000`. */
export function formatPrice(
  price: number | null,
  currency: Currency,
): string {
  if (price === null) {
    return "Consultar precio";
  }

  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(price);

  return `${currency} ${formatted}`;
}
