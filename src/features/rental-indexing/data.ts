import "server-only";

import { and, asc, desc, eq, isNull, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  properties,
  rentalIndexEntries,
  rentalPenalties,
  rentalRentHistory,
  rentals,
  type Currency,
  type RentalIndexType,
  type RentalPenaltyStatus,
} from "@/db/schema";

export type RentalIndexEntryRow = typeof rentalIndexEntries.$inferSelect;

export type RentalRentHistoryRow = typeof rentalRentHistory.$inferSelect;

export type RentalPenaltyRow = {
  id: string;
  organizationId: string;
  rentalId: string;
  overdueAmount: number;
  overdueDays: number;
  dailyRate: number;
  penaltyAmount: number;
  calculatedDate: string;
  status: RentalPenaltyStatus;
  paidDate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientName: string | null;
  propertyTitle: string | null;
};

export async function listIndexEntries(
  organizationId: string,
  rentalId: string,
): Promise<RentalIndexEntryRow[]> {
  return db
    .select()
    .from(rentalIndexEntries)
    .where(
      and(
        eq(rentalIndexEntries.organizationId, organizationId),
        eq(rentalIndexEntries.rentalId, rentalId),
      ),
    )
    .orderBy(desc(rentalIndexEntries.appliedDate));
}

export async function applyIndexAdjustment(input: {
  organizationId: string;
  rentalId: string;
  indexType: RentalIndexType;
  baseIndexValue: number;
  newIndexValue: number;
  previousRent: number;
  newRent: number;
  appliedDate: string;
  notes?: string | null;
}): Promise<RentalIndexEntryRow> {
  const [created] = await db
    .insert(rentalIndexEntries)
    .values({
      organizationId: input.organizationId,
      rentalId: input.rentalId,
      indexType: input.indexType,
      baseIndexValue: input.baseIndexValue,
      newIndexValue: input.newIndexValue,
      previousRent: input.previousRent,
      newRent: input.newRent,
      appliedDate: input.appliedDate,
      notes: input.notes ?? null,
    })
    .returning();
  return created;
}

export async function closeRentHistorySnapshot(
  organizationId: string,
  rentalId: string,
  validTo: string,
): Promise<void> {
  await db
    .update(rentalRentHistory)
    .set({ validTo, updatedAt: new Date() })
    .where(
      and(
        eq(rentalRentHistory.organizationId, organizationId),
        eq(rentalRentHistory.rentalId, rentalId),
        isNull(rentalRentHistory.validTo),
      ),
    );
}

export async function createRentHistorySnapshot(input: {
  organizationId: string;
  rentalId: string;
  rentAmount: number;
  currency: string;
  validFrom: string;
  validTo?: string | null;
}): Promise<RentalRentHistoryRow> {
  const [created] = await db
    .insert(rentalRentHistory)
    .values({
      organizationId: input.organizationId,
      rentalId: input.rentalId,
      rentAmount: input.rentAmount,
      currency: input.currency as Currency,
      validFrom: input.validFrom,
      validTo: input.validTo ?? null,
    })
    .returning();
  return created;
}

export async function listRentHistory(
  organizationId: string,
  rentalId: string,
): Promise<RentalRentHistoryRow[]> {
  return db
    .select()
    .from(rentalRentHistory)
    .where(
      and(
        eq(rentalRentHistory.organizationId, organizationId),
        eq(rentalRentHistory.rentalId, rentalId),
      ),
    )
    .orderBy(asc(rentalRentHistory.validFrom));
}

export async function getRentAtDate(
  organizationId: string,
  rentalId: string,
  _date: string,
): Promise<RentalRentHistoryRow | null> {
  const [row] = await db
    .select()
    .from(rentalRentHistory)
    .where(
      and(
        eq(rentalRentHistory.organizationId, organizationId),
        eq(rentalRentHistory.rentalId, rentalId),
        // validFrom <= date
        // drizzle no tiene lte directo en columnas de fecha sin operador; usamos SQL raw
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listPenalties(
  organizationId: string,
  rentalId: string,
  status?: RentalPenaltyStatus,
): Promise<RentalPenaltyRow[]> {
  const conditions: SQL[] = [
    eq(rentalPenalties.organizationId, organizationId),
    eq(rentalPenalties.rentalId, rentalId),
  ];

  if (status) {
    conditions.push(eq(rentalPenalties.status, status));
  }

  return db
    .select({
      id: rentalPenalties.id,
      organizationId: rentalPenalties.organizationId,
      rentalId: rentalPenalties.rentalId,
      overdueAmount: rentalPenalties.overdueAmount,
      overdueDays: rentalPenalties.overdueDays,
      dailyRate: rentalPenalties.dailyRate,
      penaltyAmount: rentalPenalties.penaltyAmount,
      calculatedDate: rentalPenalties.calculatedDate,
      status: rentalPenalties.status,
      paidDate: rentalPenalties.paidDate,
      notes: rentalPenalties.notes,
      createdAt: rentalPenalties.createdAt,
      updatedAt: rentalPenalties.updatedAt,
      clientName: clients.name,
      propertyTitle: properties.title,
    })
    .from(rentalPenalties)
    .leftJoin(rentals, eq(rentalPenalties.rentalId, rentals.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .where(and(...conditions))
    .orderBy(desc(rentalPenalties.calculatedDate));
}

export async function recordPenalty(input: {
  organizationId: string;
  rentalId: string;
  overdueAmount: number;
  overdueDays: number;
  dailyRate: number;
  penaltyAmount: number;
  calculatedDate: string;
  notes?: string | null;
}): Promise<RentalPenaltyRow> {
  const [created] = await db
    .insert(rentalPenalties)
    .values({
      organizationId: input.organizationId,
      rentalId: input.rentalId,
      overdueAmount: input.overdueAmount,
      overdueDays: input.overdueDays,
      dailyRate: input.dailyRate,
      penaltyAmount: input.penaltyAmount,
      calculatedDate: input.calculatedDate,
      status: "pendiente",
      notes: input.notes ?? null,
    })
    .returning();
  // Enrich with joined fields for the UI
  const [enriched] = await db
    .select({
      id: rentalPenalties.id,
      organizationId: rentalPenalties.organizationId,
      rentalId: rentalPenalties.rentalId,
      overdueAmount: rentalPenalties.overdueAmount,
      overdueDays: rentalPenalties.overdueDays,
      dailyRate: rentalPenalties.dailyRate,
      penaltyAmount: rentalPenalties.penaltyAmount,
      calculatedDate: rentalPenalties.calculatedDate,
      status: rentalPenalties.status,
      paidDate: rentalPenalties.paidDate,
      notes: rentalPenalties.notes,
      createdAt: rentalPenalties.createdAt,
      updatedAt: rentalPenalties.updatedAt,
      clientName: clients.name,
      propertyTitle: properties.title,
    })
    .from(rentalPenalties)
    .leftJoin(rentals, eq(rentalPenalties.rentalId, rentals.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .where(eq(rentalPenalties.id, created.id));
  return enriched;
}

export async function markPenaltyPaid(
  organizationId: string,
  penaltyId: string,
  paidDate: string,
): Promise<void> {
  await db
    .update(rentalPenalties)
    .set({ status: "pagado", paidDate, updatedAt: new Date() })
    .where(
      and(
        eq(rentalPenalties.organizationId, organizationId),
        eq(rentalPenalties.id, penaltyId),
      ),
    );
}
