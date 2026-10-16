import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { clients, properties, rentals, type RentalStatus } from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RentalFilters = {
  search?: string;
  status?: RentalStatus;
};

export type RentalOption = { id: string; label: string };

const selection = {
  rental: rentals,
  propertyTitle: properties.title,
  clientName: clients.name,
};

export type RentalRow = {
  rental: typeof rentals.$inferSelect;
  propertyTitle: string | null;
  clientName: string | null;
};

export async function listRentals(
  organizationId: string,
  filters: RentalFilters = {},
): Promise<RentalRow[]> {
  const conditions: SQL[] = [eq(rentals.organizationId, organizationId)];

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    const match = or(ilike(properties.title, term), ilike(clients.name, term));
    if (match) {
      conditions.push(match);
    }
  }

  if (filters.status) {
    conditions.push(eq(rentals.status, filters.status));
  }

  const rows = await db
    .select(selection)
    .from(rentals)
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(rentals.createdAt));

  return rows;
}

export async function getRental(
  organizationId: string,
  id: string,
): Promise<RentalRow | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [row] = await db
    .select(selection)
    .from(rentals)
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .where(and(eq(rentals.organizationId, organizationId), eq(rentals.id, id)))
    .limit(1);

  return row ?? null;
}

export async function countRentals(
  organizationId: string,
  status?: RentalStatus,
): Promise<number> {
  const conditions: SQL[] = [eq(rentals.organizationId, organizationId)];
  if (status) {
    conditions.push(eq(rentals.status, status));
  }

  const [row] = await db
    .select({ value: count() })
    .from(rentals)
    .where(and(...conditions));

  return row?.value ?? 0;
}

export async function listPropertyOptions(
  organizationId: string,
): Promise<RentalOption[]> {
  const rows = await db
    .select({ id: properties.id, label: properties.title })
    .from(properties)
    .where(eq(properties.organizationId, organizationId))
    .orderBy(asc(properties.title));

  return rows;
}

export async function listClientOptions(
  organizationId: string,
): Promise<RentalOption[]> {
  const rows = await db
    .select({ id: clients.id, label: clients.name })
    .from(clients)
    .where(eq(clients.organizationId, organizationId))
    .orderBy(asc(clients.name));

  return rows;
}

/** Human label for the audit trail: "Depto Centro · María López". */
export async function getRentalLabel(
  organizationId: string,
  id: string,
): Promise<string | null> {
  const [row] = await db
    .select({ propertyTitle: properties.title, clientName: clients.name })
    .from(rentals)
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .where(and(eq(rentals.organizationId, organizationId), eq(rentals.id, id)))
    .limit(1);

  if (!row) {
    return null;
  }

  const parts = [row.propertyTitle, row.clientName].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(" · ") : "Alquiler sin asignar";
}
