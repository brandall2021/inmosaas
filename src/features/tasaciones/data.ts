import "server-only";

import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { valuations, type ValuationStatus } from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ValuationFilters = {
  search?: string;
  status?: ValuationStatus;
};

export async function listValuations(
  organizationId: string,
  filters: ValuationFilters = {},
) {
  const conditions: SQL[] = [eq(valuations.organizationId, organizationId)];

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    const match = ilike(valuations.title, term);
    conditions.push(match);
  }

  if (filters.status) {
    conditions.push(eq(valuations.status, filters.status));
  }

  return db
    .select()
    .from(valuations)
    .where(and(...conditions))
    .orderBy(desc(valuations.createdAt));
}

export async function getValuation(organizationId: string, id: string) {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [valuation] = await db
    .select()
    .from(valuations)
    .where(and(eq(valuations.organizationId, organizationId), eq(valuations.id, id)))
    .limit(1);

  return valuation ?? null;
}

export async function countValuations(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(valuations)
    .where(eq(valuations.organizationId, organizationId));

  return row?.value ?? 0;
}
