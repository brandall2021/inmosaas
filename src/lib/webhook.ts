import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { integrations, webhookDeliveries } from "@/db/schema";
import {
  computeSignature,
  SIGNATURE_HEADER,
} from "@/lib/webhook-signature";

/**
 * Outgoing webhook delivery: best-effort and non-blocking for the user. Each
 * attempt is logged into `webhook_deliveries` with its HTTP result or error
 * type, at most one retry for transient failures (timeout, 5xx, 429).
 */

const TIMEOUT_MS = 5_000;
const RETRY_PAUSE_MS = 2_000;
const MAX_ATTEMPTS = 2;

/** Stable event names: `<entity>.<action>` plus the `ping` test event. */
export type WebhookEvent =
  | "ping"
  | "property.created"
  | "property.updated"
  | "property.deleted"
  | "client.created"
  | "client.updated"
  | "client.deleted"
  | "valuation.created"
  | "valuation.updated"
  | "valuation.deleted"
  | "rental.created"
  | "rental.updated"
  | "rental.deleted"
  | "document.created"
  | "document.deleted";

export type WebhookPayload = {
  event: WebhookEvent;
  entity_id: string | null;
  at: string;
  data: Record<string, unknown>;
};

export type DeliveryRow = typeof webhookDeliveries.$inferSelect;

export type DeliveryState = "delivered" | "failed";

/** Tenant-scoped active webhook: URL + secret or nothing to deliver to. */
async function getActiveWebhook(organizationId: string) {
  const [row] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.organizationId, organizationId))
    .limit(1);

  if (!row?.webhookEnabled || !row.webhookUrl) {
    return null;
  }
  return row;
}

function buildPayload(
  event: WebhookEvent,
  entityId: string | null,
  data: Record<string, unknown>,
): WebhookPayload {
  return {
    event,
    entity_id: entityId,
    at: new Date().toISOString(),
    data,
  };
}

/**
 * Queues a delivery without waiting for the HTTP round-trip: the action that
 * triggers it must never pay the latency of the external receiver. Failures
 * are logged, never thrown.
 */
export async function enqueueWebhook(
  organizationId: string,
  event: WebhookEvent,
  entityId: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const integration = await getActiveWebhook(organizationId);
    if (!integration) {
      return;
    }

    const payload = buildPayload(event, entityId, data);
    const [row] = await db
      .insert(webhookDeliveries)
      .values({
        organizationId,
        event,
        payload,
      })
      .returning({ id: webhookDeliveries.id });

    void deliverWebhook(integration, row.id, payload).catch(async (error) => {
      await markDelivery(row.id, {
        error: error instanceof Error ? "network" : "unknown",
      });
    });
  } catch {
    // Best-effort: an outage of the receiving side (or of our own logging)
    // must never affect the operation that triggered the event.
  }
}

/** Blocking variant used by the "Probar conexión" button, so the user sees
 * the fresh log entry right after the action resolves. */
export async function testWebhookConnection(
  organizationId: string,
): Promise<DeliveryState | null> {
  const integration = await getActiveWebhook(organizationId);
  if (!integration) {
    return null;
  }

  const payload = buildPayload("ping", null, {
    message: "Conexión probada desde InmoSaaS",
  });
  const [row] = await db
    .insert(webhookDeliveries)
    .values({ organizationId, event: "ping", payload })
    .returning({ id: webhookDeliveries.id });

  return deliverWebhook(integration, row.id, payload);
}

async function deliverWebhook(
  integration: typeof integrations.$inferSelect,
  deliveryId: string,
  payload: WebhookPayload,
): Promise<DeliveryState> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // No secret -> no signature header at all.
  if (integration.webhookSecret) {
    headers[SIGNATURE_HEADER] = computeSignature(
      integration.webhookSecret,
      body,
    );
  }

  let attempt = 1;
  for (;;) {
    try {
      const response = await fetch(integration.webhookUrl!, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.ok) {
        await markDelivery(deliveryId, {
          attempt,
          httpStatus: response.status,
          delivered: true,
        });
        return "delivered";
      }

      const transient =
        response.status >= 500 || response.status === 429;
      if (transient && attempt < MAX_ATTEMPTS) {
        attempt += 1;
        await sleep(RETRY_PAUSE_MS);
        continue;
      }

      // 4xx (except 429) is permanent: no retry at all.
      await markDelivery(deliveryId, {
        attempt,
        httpStatus: response.status,
      });
      return "failed";
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        attempt += 1;
        await sleep(RETRY_PAUSE_MS);
        continue;
      }
      await markDelivery(deliveryId, { attempt, error: "timeout" });
      return "failed";
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function markDelivery(
  deliveryId: string,
  outcome: {
    attempt?: number;
    httpStatus?: number;
    error?: string;
    delivered?: boolean;
  },
) {
  await db
    .update(webhookDeliveries)
    .set({
      attempt: outcome.attempt ?? 1,
      httpStatus: outcome.httpStatus ?? null,
      error: outcome.error ?? null,
      deliveredAt: outcome.delivered ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(webhookDeliveries.id, deliveryId)));
}
