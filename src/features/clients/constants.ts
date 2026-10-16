import type { ClientStage, ClientType } from "@/db/schema";

export type ClientOption<T extends string> = {
  value: T;
  label: string;
};

export const CLIENT_TYPES: ClientOption<ClientType>[] = [
  { value: "comprador", label: "Comprador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "inquilino", label: "Inquilino" },
  { value: "propietario", label: "Propietario" },
];

export const CLIENT_STAGES: ClientOption<ClientStage>[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "visitando", label: "Visitando" },
  { value: "negociacion", label: "En negociación" },
  { value: "cerrado", label: "Cerrado" },
];

const toLabelMap = <T extends string>(
  options: ClientOption<T>[],
): Record<T, string> =>
  options.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<T, string>,
  );

export const clientTypeLabels = toLabelMap(CLIENT_TYPES);
export const clientStageLabels = toLabelMap(CLIENT_STAGES);

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
