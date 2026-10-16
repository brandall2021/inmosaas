import type { CatalogKind } from "@/db/schema";

export type CatalogOption<T extends string> = {
  value: T;
  label: string;
};

export const CATALOG_KINDS: CatalogOption<CatalogKind>[] = [
  { value: "zona", label: "Zona / Barrio" },
  { value: "amenity", label: "Amenity" },
  { value: "servicio", label: "Servicio" },
  { value: "etiqueta", label: "Etiqueta" },
];

const toLabelMap = <T extends string>(
  options: CatalogOption<T>[],
): Record<T, string> =>
  options.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<T, string>,
  );

export const catalogKindLabels = toLabelMap(CATALOG_KINDS);

/** Starter entries offered when an organization's catalog is empty. */
export const DEFAULT_CATALOG_ENTRIES: {
  kind: CatalogKind;
  name: string;
  description?: string;
}[] = [
  { kind: "zona", name: "Centro", description: "Casco céntrico" },
  { kind: "zona", name: "Palermo", description: "Zona norte" },
  { kind: "zona", name: "Villa Nueva", description: "Zona residencial" },
  { kind: "amenity", name: "Pileta" },
  { kind: "amenity", name: "Parrilla" },
  { kind: "amenity", name: "Balcón" },
  { kind: "amenity", name: "Cochera cubierta" },
  { kind: "servicio", name: "Agua corriente" },
  { kind: "servicio", name: "Gas natural" },
  { kind: "servicio", name: "Internet por fibra" },
  { kind: "etiqueta", name: "Oportunidad" },
  { kind: "etiqueta", name: "Apto crédito" },
  { kind: "etiqueta", name: "Para refacción" },
];
