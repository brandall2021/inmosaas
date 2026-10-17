import "server-only";

import { and, asc, desc, eq, ilike, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  clients,
  documents,
  properties,
  rentals,
  type DocumentType,
} from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DocumentFilters = {
  search?: string;
  type?: DocumentType;
};

const rentalProperties = alias(properties, "rental_properties");
const rentalClients = alias(clients, "rental_clients");

const selection = {
  document: documents,
  propertyTitle: properties.title,
  clientName: clients.name,
  rentalPropertyTitle: rentalProperties.title,
  rentalClientName: rentalClients.name,
};

export type DocumentRow = {
  document: typeof documents.$inferSelect;
  propertyTitle: string | null;
  clientName: string | null;
  rentalPropertyTitle: string | null;
  rentalClientName: string | null;
};

export type DocumentOption = { id: string; label: string };

/**
 * Every query takes an explicit `organizationId`, the tenant boundary resolved
 * from the server session. A client-supplied id is never trusted for scoping.
 */
export async function listDocuments(
  organizationId: string,
  filters: DocumentFilters = {},
): Promise<DocumentRow[]> {
  const conditions: SQL[] = [eq(documents.organizationId, organizationId)];

  const search = filters.search?.trim();
  if (search) {
    conditions.push(ilike(documents.title, `%${search}%`));
  }

  if (filters.type) {
    conditions.push(eq(documents.type, filters.type));
  }

  return db
    .select(selection)
    .from(documents)
    .leftJoin(properties, eq(documents.propertyId, properties.id))
    .leftJoin(clients, eq(documents.clientId, clients.id))
    .leftJoin(rentals, eq(documents.rentalId, rentals.id))
    .leftJoin(rentalProperties, eq(rentals.propertyId, rentalProperties.id))
    .leftJoin(rentalClients, eq(rentals.clientId, rentalClients.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));
}

export async function getDocument(
  organizationId: string,
  id: string,
): Promise<DocumentRow | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [row] = await db
    .select(selection)
    .from(documents)
    .leftJoin(properties, eq(documents.propertyId, properties.id))
    .leftJoin(clients, eq(documents.clientId, clients.id))
    .leftJoin(rentals, eq(documents.rentalId, rentals.id))
    .leftJoin(rentalProperties, eq(rentals.propertyId, rentalProperties.id))
    .leftJoin(rentalClients, eq(rentals.clientId, rentalClients.id))
    .where(
      and(
        eq(documents.organizationId, organizationId),
        eq(documents.id, id),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** Resolves a document by its stored key, scoped to the active organization. */
export async function getDocumentByKey(
  organizationId: string,
  storageKey: string,
) {
  const [document] = await db
    .select({ id: documents.id, title: documents.title, mimeType: documents.mimeType })
    .from(documents)
    .where(
      and(
        eq(documents.organizationId, organizationId),
        eq(documents.storageKey, storageKey),
      ),
    )
    .limit(1);

  return document ?? null;
}

/** Property/client/rental selects for the upload form, tenant-scoped. */
export async function listDocumentPropertyOptions(
  organizationId: string,
): Promise<DocumentOption[]> {
  return db
    .select({ id: properties.id, label: properties.title })
    .from(properties)
    .where(eq(properties.organizationId, organizationId))
    .orderBy(asc(properties.title));
}

export async function listDocumentClientOptions(
  organizationId: string,
): Promise<DocumentOption[]> {
  return db
    .select({ id: clients.id, label: clients.name })
    .from(clients)
    .where(eq(clients.organizationId, organizationId))
    .orderBy(asc(clients.name));
}

export async function listDocumentRentalOptions(
  organizationId: string,
): Promise<DocumentOption[]> {
  const rows = await db
    .select({
      id: rentals.id,
      propertyTitle: properties.title,
      clientName: clients.name,
    })
    .from(rentals)
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .where(eq(rentals.organizationId, organizationId))
    .orderBy(desc(rentals.createdAt));

  return rows.map((row) => ({
    id: row.id,
    label:
      [row.propertyTitle, row.clientName].filter(Boolean).join(" · ") ||
      "Alquiler sin asignar",
  }));
}

/** Human label for the audit trail: "Depto Centro · María López". */
export function documentRentalLabel(row: DocumentRow): string | null {
  const parts = [row.rentalPropertyTitle, row.rentalClientName].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(" · ") : null;
}
