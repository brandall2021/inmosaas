import "server-only";

import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  cashBoxEntries,
  cashBoxClosings,
  clients,
  properties,
  rentals,
  type CashBoxEntryType,
  type CashBoxCategory,
  type CashBoxEntryStatus,
} from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CashBoxEntryRow = typeof cashBoxEntries.$inferSelect & {
  clientName: string | null;
  clientType: string | null;
  rentalTitle: string | null;
  propertyTitle: string | null;
};

export type CashBoxClosingRow = typeof cashBoxClosings.$inferSelect;

export type CashBoxFilters = {
  type?: string;
  category?: string;
  status?: CashBoxEntryStatus;
  dateFrom?: string;
  dateTo?: string;
};

export type CashBoxBalance = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
};

export async function listCashBoxEntries(
  organizationId: string,
  filters: CashBoxFilters = {},
): Promise<CashBoxEntryRow[]> {
  const conditions: SQL[] = [
    eq(cashBoxEntries.organizationId, organizationId),
  ];

  if (filters.type) {
    conditions.push(eq(cashBoxEntries.type, filters.type as CashBoxEntryType));
  }
  if (filters.category) {
    conditions.push(eq(cashBoxEntries.category, filters.category as CashBoxCategory));
  }
  if (filters.status) {
    conditions.push(eq(cashBoxEntries.status, filters.status));
  }
  if (filters.dateFrom) {
    conditions.push(sql`${cashBoxEntries.date} >= ${filters.dateFrom}`);
  }
  if (filters.dateTo) {
    conditions.push(sql`${cashBoxEntries.date} <= ${filters.dateTo}`);
  }

  return db
    .select({
      id: cashBoxEntries.id,
      organizationId: cashBoxEntries.organizationId,
      type: cashBoxEntries.type,
      concept: cashBoxEntries.concept,
      amount: cashBoxEntries.amount,
      currency: cashBoxEntries.currency,
      category: cashBoxEntries.category,
      date: cashBoxEntries.date,
      clientId: cashBoxEntries.clientId,
      rentalId: cashBoxEntries.rentalId,
      notes: cashBoxEntries.notes,
      status: cashBoxEntries.status,
      createdAt: cashBoxEntries.createdAt,
      updatedAt: cashBoxEntries.updatedAt,
      clientName: clients.name,
      clientType: clients.type,
      rentalTitle: rentals.id,
      propertyTitle: properties.title,
    })
    .from(cashBoxEntries)
    .leftJoin(clients, eq(cashBoxEntries.clientId, clients.id))
    .leftJoin(rentals, eq(cashBoxEntries.rentalId, rentals.id))
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .where(and(...conditions))
    .orderBy(desc(cashBoxEntries.date), desc(cashBoxEntries.createdAt));
}

export async function getCashBoxBalance(
  organizationId: string,
  filters: CashBoxFilters = {},
): Promise<CashBoxBalance> {
  const conditions: SQL[] = [
    eq(cashBoxEntries.organizationId, organizationId),
  ];

  if (filters.type) {
    conditions.push(eq(cashBoxEntries.type, filters.type as CashBoxEntryType));
  }
  if (filters.category) {
    conditions.push(eq(cashBoxEntries.category, filters.category as CashBoxCategory));
  }
  if (filters.status) {
    conditions.push(eq(cashBoxEntries.status, filters.status));
  }
  if (filters.dateFrom) {
    conditions.push(sql`${cashBoxEntries.date} >= ${filters.dateFrom}`);
  }
  if (filters.dateTo) {
    conditions.push(sql`${cashBoxEntries.date} <= ${filters.dateTo}`);
  }

  const [row] = await db
    .select({
      totalIncome: sql<number>`coalesce(sum(case when ${cashBoxEntries.type} = 'ingreso' then ${cashBoxEntries.amount} else 0 end), 0)`,
      totalExpense: sql<number>`coalesce(sum(case when ${cashBoxEntries.type} = 'egreso' then ${cashBoxEntries.amount} else 0 end), 0)`,
    })
    .from(cashBoxEntries)
    .where(and(...conditions));

  const totalIncome = row?.totalIncome ? Number(row.totalIncome) : 0;
  const totalExpense = row?.totalExpense ? Number(row.totalExpense) : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}

export async function getCashBoxEntry(
  organizationId: string,
  id: string,
): Promise<CashBoxEntryRow | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [row] = await db
    .select({
      id: cashBoxEntries.id,
      organizationId: cashBoxEntries.organizationId,
      type: cashBoxEntries.type,
      concept: cashBoxEntries.concept,
      amount: cashBoxEntries.amount,
      currency: cashBoxEntries.currency,
      category: cashBoxEntries.category,
      date: cashBoxEntries.date,
      clientId: cashBoxEntries.clientId,
      rentalId: cashBoxEntries.rentalId,
      notes: cashBoxEntries.notes,
      status: cashBoxEntries.status,
      createdAt: cashBoxEntries.createdAt,
      updatedAt: cashBoxEntries.updatedAt,
      clientName: clients.name,
      clientType: clients.type,
      rentalTitle: rentals.id,
      propertyTitle: properties.title,
    })
    .from(cashBoxEntries)
    .leftJoin(clients, eq(cashBoxEntries.clientId, clients.id))
    .leftJoin(rentals, eq(cashBoxEntries.rentalId, rentals.id))
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .where(
      and(
        eq(cashBoxEntries.organizationId, organizationId),
        eq(cashBoxEntries.id, id),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function listCashBoxClosings(
  organizationId: string,
): Promise<CashBoxClosingRow[]> {
  return db
    .select()
    .from(cashBoxClosings)
    .where(eq(cashBoxClosings.organizationId, organizationId))
    .orderBy(desc(cashBoxClosings.closingDate));
}

export async function getCashBoxClosing(
  organizationId: string,
  closingDate: string,
): Promise<CashBoxClosingRow | null> {
  const [row] = await db
    .select()
    .from(cashBoxClosings)
    .where(
      and(
        eq(cashBoxClosings.organizationId, organizationId),
        eq(cashBoxClosings.closingDate, closingDate),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function createCashBoxClosing(input: {
  organizationId: string;
  closingDate: string;
  openingAmount: number;
  realBalance: number;
  notes?: string | null;
}): Promise<CashBoxClosingRow> {
  const [existing] = await db
    .select({ id: cashBoxClosings.id })
    .from(cashBoxClosings)
    .where(
      and(
        eq(cashBoxClosings.organizationId, input.organizationId),
        eq(cashBoxClosings.closingDate, input.closingDate),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error(`Ya existe un cierre para la fecha ${input.closingDate}`);
  }

  const balance = await getCashBoxBalance(input.organizationId, {
    dateFrom: input.closingDate,
    dateTo: input.closingDate,
  });

  const theoreticalBalance =
    input.openingAmount + balance.totalIncome - balance.totalExpense;
  const difference = input.realBalance - theoreticalBalance;

  const [created] = await db
    .insert(cashBoxClosings)
    .values({
      organizationId: input.organizationId,
      closingDate: input.closingDate,
      openingAmount: input.openingAmount,
      totalIncome: balance.totalIncome,
      totalExpense: balance.totalExpense,
      theoreticalBalance,
      realBalance: input.realBalance,
      difference,
      notes: input.notes ?? null,
    })
    .returning();

  return created;
}

export async function conciliateEntries(
  organizationId: string,
  closingDate: string,
): Promise<void> {
  await db
    .update(cashBoxEntries)
    .set({ status: "conciliado", updatedAt: new Date() })
    .where(
      and(
        eq(cashBoxEntries.organizationId, organizationId),
        eq(cashBoxEntries.status, "pendiente"),
        sql`${cashBoxEntries.date} <= ${closingDate}`,
      ),
    );
}
