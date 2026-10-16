import type { RentalStatus } from "@/db/schema";

export type RentalOption<T extends string> = {
  value: T;
  label: string;
};

export const RENTAL_STATUSES: RentalOption<RentalStatus>[] = [
  { value: "vigente", label: "Vigente" },
  { value: "finalizado", label: "Finalizado" },
  { value: "rescindido", label: "Rescindido" },
];

const toLabelMap = <T extends string>(
  options: RentalOption<T>[],
): Record<T, string> =>
  options.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<T, string>,
  );

export const rentalStatusLabels = toLabelMap(RENTAL_STATUSES);

/** Sentinel used by the optional property/client selects for "no assignment". */
export const NONE_VALUE = "none";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/** Formats a `YYYY-MM-DD` string without timezone drift. */
export function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}
