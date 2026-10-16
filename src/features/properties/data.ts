import "server-only";

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { properties, propertyImages, type PropertyStatus } from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PropertyFilters = {
  search?: string;
  status?: PropertyStatus;
};

/**
 * Every query takes an explicit `organizationId`. This is the tenant boundary:
 * callers pass the active organization resolved from the server session, never
 * a value coming from the client.
 */
export async function listProperties(
  organizationId: string,
  filters: PropertyFilters = {},
) {
  const conditions: SQL[] = [eq(properties.organizationId, organizationId)];

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    const match = or(
      ilike(properties.title, term),
      ilike(properties.address, term),
      ilike(properties.city, term),
    );
    if (match) {
      conditions.push(match);
    }
  }

  if (filters.status) {
    conditions.push(eq(properties.status, filters.status));
  }

  return db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt));
}

export async function getProperty(organizationId: string, id: string) {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [property] = await db
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(properties.id, id),
      ),
    )
    .limit(1);

  return property ?? null;
}

export async function countProperties(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(properties)
    .where(eq(properties.organizationId, organizationId));

  return row?.value ?? 0;
}

export async function listPropertyImages(
  organizationId: string,
  propertyId: string,
) {
  return db
    .select({
      id: propertyImages.id,
      storageKey: propertyImages.storageKey,
      alt: propertyImages.alt,
      position: propertyImages.position,
    })
    .from(propertyImages)
    .innerJoin(properties, eq(properties.id, propertyImages.propertyId))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(propertyImages.propertyId, propertyId),
      ),
    )
    .orderBy(propertyImages.position, propertyImages.createdAt);
}

export async function getPropertyImage(
  organizationId: string,
  imageId: string,
) {
  if (!UUID_PATTERN.test(imageId)) {
    return null;
  }

  const [image] = await db
    .select({
      id: propertyImages.id,
      storageKey: propertyImages.storageKey,
      propertyId: propertyImages.propertyId,
    })
    .from(propertyImages)
    .innerJoin(properties, eq(properties.id, propertyImages.propertyId))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(propertyImages.id, imageId),
      ),
    )
    .limit(1);

  return image ?? null;
}

/** Resolves an image by its stored key, scoped to the active organization. */
export async function getPropertyImageByKey(
  organizationId: string,
  storageKey: string,
) {
  const [image] = await db
    .select({ id: propertyImages.id })
    .from(propertyImages)
    .innerJoin(properties, eq(properties.id, propertyImages.propertyId))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(propertyImages.storageKey, storageKey),
      ),
    )
    .limit(1);

  return image ?? null;
}
