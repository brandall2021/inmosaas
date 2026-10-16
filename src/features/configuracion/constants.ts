export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  "property.created": "Propiedad creada",
  "property.updated": "Propiedad editada",
  "property.deleted": "Propiedad eliminada",
  "property.image_added": "Imagen agregada",
  "property.image_removed": "Imagen eliminada",
  "client.created": "Cliente creado",
  "client.updated": "Cliente editado",
  "client.deleted": "Cliente eliminado",
  "valuation.created": "Tasación creada",
  "valuation.updated": "Tasación editada",
  "valuation.deleted": "Tasación eliminada",
  "rental.created": "Alquiler creado",
  "rental.updated": "Alquiler editado",
  "rental.deleted": "Alquiler eliminado",
  "integration.updated": "Integración actualizada",
  "catalog.created": "Elemento de catálogo creado",
  "catalog.updated": "Elemento de catálogo editado",
  "catalog.deleted": "Elemento de catálogo eliminado",
  "catalog.seeded": "Catálogo de ejemplo cargado",
};

export function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action;
}

/** Alert rules computed on read; none of these touch the database. */
export const ALERT_EXPIRING_DAYS = 30;
