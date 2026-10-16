import "server-only";

import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { catalogEntries, type CatalogKind } from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CatalogFilters = {
  kind?: CatalogKind;
  search?: string;
};

/** Tenant-scoped reads: callers always pass the active organization id. */
export async function listCatalogEntries(
  organizationId: string,
  filters: CatalogFilters = {},
) {
  const conditions: SQL[] = [eq(catalogEntries.organizationId, organizationId)];

  if (filters.kind) {
    conditions.push(eq(catalogEntries.kind, filters.kind));
  }

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    const match = or(
      ilike(catalogEntries.name, term),
      ilike(catalogEntries.description, term),
    );
    if (match) {
      conditions.push(match);
    }
  }

  return db
    .select()
    .from(catalogEntries)
    .where(and(...conditions))
    .orderBy(asc(catalogEntries.kind), asc(catalogEntries.name));
}

export async function getCatalogEntry(organizationId: string, id: string) {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [entry] = await db
    .select()
    .from(catalogEntries)
    .where(
      and(
        eq(catalogEntries.organizationId, organizationId),
        eq(catalogEntries.id, id),
      ),
    )
    .limit(1);

  return entry ?? null;
}

export async function countCatalogEntries(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(catalogEntries)
    .where(eq(catalogEntries.organizationId, organizationId));

  return row?.value ?? 0;
}

/** Entry count per kind, used to label the filter tabs. */
export async function countCatalogEntriesByKind(
  organizationId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ kind: catalogEntries.kind, value: count() })
    .from(catalogEntries)
    .where(eq(catalogEntries.organizationId, organizationId))
    .groupBy(catalogEntries.kind);

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.kind] = row.value;
    return acc;
  }, {});
}
