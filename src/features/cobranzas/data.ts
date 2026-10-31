import "server-only";

import { and, desc, eq, max, sql, sum, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { rentalPayments, type PaymentMethod } from "@/db/schema";
import { paymentMethodLabels } from "@/features/cobranzas/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RentalPayment = typeof rentalPayments.$inferSelect;

/** Chronological listing: newest collection date first. */
export async function listPayments(
  organizationId: string,
  rentalId: string,
): Promise<RentalPayment[]> {
  if (!UUID_PATTERN.test(rentalId)) {
    return [];
  }

  return db
    .select()
    .from(rentalPayments)
    .where(
      and(
        eq(rentalPayments.organizationId, organizationId),
        eq(rentalPayments.rentalId, rentalId),
      ),
    )
    .orderBy(desc(rentalPayments.paidDate), desc(rentalPayments.createdAt));
}

export async function getPayment(
  organizationId: string,
  id: string,
): Promise<RentalPayment | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [payment] = await db
    .select()
    .from(rentalPayments)
    .where(
      and(
        eq(rentalPayments.organizationId, organizationId),
        eq(rentalPayments.id, id),
      ),
    )
    .limit(1);

  return payment ?? null;
}

export type PaymentSummary = {
  collected: number;
  lastPaymentDate: string | null;
  /** Distinct rental-period months that have at least one payment. */
  monthsCovered: number;
};

/**
 * Aggregated in one SQL query so rendering the summary does not pull the whole
 * history of payments.
 */
export async function getPaymentSummary(
  organizationId: string,
  rentalId: string,
): Promise<PaymentSummary> {
  const empty: PaymentSummary = {
    collected: 0,
    lastPaymentDate: null,
    monthsCovered: 0,
  };
  if (!UUID_PATTERN.test(rentalId)) {
    return empty;
  }

  const conditions: SQL[] = [
    eq(rentalPayments.organizationId, organizationId),
    eq(rentalPayments.rentalId, rentalId),
  ];

  const [row] = await db
    .select({
      collected: sum(rentalPayments.amount),
      lastPaymentDate: max(rentalPayments.paidDate),
      months: sql<string>`count(distinct date_trunc('month', ${rentalPayments.paidDate}))`,
    })
    .from(rentalPayments)
    .where(and(...conditions));

  return {
    collected: row?.collected ? Number(row.collected) : 0,
    lastPaymentDate: row?.lastPaymentDate ?? null,
    monthsCovered: row?.months ? Number(row.months) : 0,
  };
}

/** Months between the rental's start and end (or today when ongoing). */
export function rentalPeriodMonths(
  startDate: string,
  endDate: string | null,
  today = new Date(),
): number {
  const start = parseIsoMonth(startDate);
  if (!start) {
    return 0;
  }

  // With a defined end date the period is the contract's; only ongoing
  // rentals (no end date) are counted up to today.
  const end = endDate ? parseIsoMonth(endDate) : null;
  if (endDate && !end) {
    return 0;
  }
  const endYm =
    end ?? today.getFullYear() * 12 + today.getMonth();

  return Math.max(endYm - start + 1, 0);
}

function parseIsoMonth(value: string): number | null {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) {
    return null;
  }
  return year * 12 + month;
}

/** Method label used by tables: delegates on the shared constants. */
export function formatMethod(method: PaymentMethod): string {
  return paymentMethodLabels[method];
}
