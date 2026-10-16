import "server-only";

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { clients, type ClientStage } from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ClientFilters = {
  search?: string;
  stage?: ClientStage;
};

/** Tenant-scoped reads: callers always pass the active organization id. */
export async function listClients(
  organizationId: string,
  filters: ClientFilters = {},
) {
  const conditions: SQL[] = [eq(clients.organizationId, organizationId)];

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    const match = or(
      ilike(clients.name, term),
      ilike(clients.email, term),
      ilike(clients.phone, term),
    );
    if (match) {
      conditions.push(match);
    }
  }

  if (filters.stage) {
    conditions.push(eq(clients.stage, filters.stage));
  }

  return db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(desc(clients.createdAt));
}

export async function getClient(organizationId: string, id: string) {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), eq(clients.id, id)))
    .limit(1);

  return client ?? null;
}

export async function countClients(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(clients)
    .where(eq(clients.organizationId, organizationId));

  return row?.value ?? 0;
}
