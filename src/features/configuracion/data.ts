import "server-only";

import { and, count, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  activityLogs,
  integrations,
  propertyImages,
  properties,
  rentals,
} from "@/db/schema";

export type ActivityRow = typeof activityLogs.$inferSelect;
export type IntegrationRow = typeof integrations.$inferSelect;

export type ActivityInput = {
  organizationId: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
};

/**
 * Appends an entry to the tenant audit trail. Auditing is best-effort: a
 * failure here must never break the mutation that triggered it.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
    });
  } catch {
    // intentionally ignored
  }
}

export async function getIntegration(
  organizationId: string,
): Promise<IntegrationRow | null> {
  const [row] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.organizationId, organizationId))
    .limit(1);

  return row ?? null;
}

export async function saveIntegration(
  organizationId: string,
  input: { webhookUrl: string | null; webhookEnabled: boolean },
): Promise<IntegrationRow> {
  const now = new Date();
  const [row] = await db
    .insert(integrations)
    .values({
      organizationId,
      webhookUrl: input.webhookUrl,
      webhookEnabled: input.webhookEnabled,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: integrations.organizationId,
      set: {
        webhookUrl: input.webhookUrl,
        webhookEnabled: input.webhookEnabled,
        updatedAt: now,
      },
    })
    .returning();

  return row;
}

export async function listActivity(
  organizationId: string,
  limit = 15,
): Promise<ActivityRow[]> {
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.organizationId, organizationId))
    .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
    .limit(limit);
}

/** Active rentals whose contract ends within `days` of today (SQL clock). */
export async function countExpiringRentals(
  organizationId: string,
  days = 30,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(rentals)
    .where(
      and(
        eq(rentals.organizationId, organizationId),
        eq(rentals.status, "vigente"),
        isNotNull(rentals.endDate),
        gte(rentals.endDate, sql`current_date`),
        lte(rentals.endDate, sql`current_date + ${days}::int * interval '1 day'`),
      ),
    );

  return row?.value ?? 0;
}

export async function countPropertiesWithoutImages(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(properties)
    .leftJoin(propertyImages, eq(properties.id, propertyImages.propertyId))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        isNull(propertyImages.id),
      ),
    );

  return row?.value ?? 0;
}
