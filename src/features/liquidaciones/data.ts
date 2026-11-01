import "server-only";

import { and, asc, count, desc, eq, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  properties,
  rentalPayments,
  settlementExpenses,
  settlements,
  type Settlement,
  type SettlementItemType,
} from "@/db/schema";
import {
  settlementItemTypeLabels,
  settlementStatusLabels,
} from "./constants";
import { formatPrice } from "@/features/properties/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SettlementRow = Settlement & {
  propertyTitle: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyProvince: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
};

export type ExpenseRow = {
  id: string;
  concept: string;
  amount: number;
  type: SettlementItemType;
};

export type SettlementSummary = {
  gross: number;
  feeAmount: number;
  expensesTotal: number;
  additionsTotal: number;
  net: number;
};

export async function listSettlements(
  organizationId: string,
  filters: {
    status?: string;
    ownerId?: string;
  } = {},
): Promise<SettlementRow[]> {
  const conditions = [eq(settlements.organizationId, organizationId)];

  if (filters.status) {
    conditions.push(eq(settlements.status, filters.status));
  }
  if (filters.ownerId) {
    conditions.push(eq(settlements.ownerClientId, filters.ownerId));
  }

  const rows = await db
    .select({
      id: settlements.id,
      organizationId: settlements.organizationId,
      rentalId: settlements.rentalId,
      propertyId: settlements.propertyId,
      ownerClientId: settlements.ownerClientId,
      period: settlements.period,
      grossAmount: settlements.grossAmount,
      feePercent: settlements.feePercent,
      currency: settlements.currency,
      status: settlements.status,
      paidDate: settlements.paidDate,
      paidMethod: settlements.paidMethod,
      notes: settlements.notes,
      createdAt: settlements.createdAt,
      updatedAt: settlements.updatedAt,
      propertyTitle: properties.title,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyProvince: properties.province,
      ownerName: clients.name,
      ownerEmail: clients.email,
      ownerPhone: clients.phone,
    })
    .from(settlements)
    .leftJoin(properties, eq(settlements.propertyId, properties.id))
    .leftJoin(clients, eq(settlements.ownerClientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(settlements.period), desc(settlements.createdAt));

  return rows;
}

export async function countPendingSettlements(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(settlements)
    .where(
      and(
        eq(settlements.organizationId, organizationId),
        eq(settlements.status, "pendiente"),
      ),
    );
  return row?.value ?? 0;
}

export async function getSettlement(
  organizationId: string,
  id: string,
): Promise<SettlementRow | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [row] = await db
    .select({
      id: settlements.id,
      organizationId: settlements.organizationId,
      rentalId: settlements.rentalId,
      propertyId: settlements.propertyId,
      ownerClientId: settlements.ownerClientId,
      period: settlements.period,
      grossAmount: settlements.grossAmount,
      feePercent: settlements.feePercent,
      currency: settlements.currency,
      status: settlements.status,
      paidDate: settlements.paidDate,
      paidMethod: settlements.paidMethod,
      notes: settlements.notes,
      createdAt: settlements.createdAt,
      updatedAt: settlements.updatedAt,
      propertyTitle: properties.title,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyProvince: properties.province,
      ownerName: clients.name,
      ownerEmail: clients.email,
      ownerPhone: clients.phone,
    })
    .from(settlements)
    .leftJoin(properties, eq(settlements.propertyId, properties.id))
    .leftJoin(clients, eq(settlements.ownerClientId, clients.id))
    .where(
      and(
        eq(settlements.organizationId, organizationId),
        eq(settlements.id, id),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function listExpenses(
  organizationId: string,
  settlementId: string,
): Promise<ExpenseRow[]> {
  const conditions = [
    eq(settlementExpenses.organizationId, organizationId),
    eq(settlementExpenses.settlementId, settlementId),
  ];

  return db
    .select()
    .from(settlementExpenses)
    .where(and(...conditions))
    .orderBy(asc(settlementExpenses.createdAt));
}

/** Suggested gross = sum of payments whose paid_date falls inside the period. */
export async function suggestGrossForPeriod(
  organizationId: string,
  rentalId: string,
  period: string,
): Promise<{ suggested: number; paidCount: number }> {
  const [yearMonth] = period.split("-").map(Number);
  if (!yearMonth || period.split("-").length !== 2) {
    return { suggested: 0, paidCount: 0 };
  }

  const [row] = await db
    .select({
      collected: sql<number>`coalesce(sum(${rentalPayments.amount}), 0)`,
      count: sql<number>`count(${rentalPayments.id})`,
    })
    .from(rentalPayments)
    .where(
      and(
        eq(rentalPayments.organizationId, organizationId),
        eq(rentalPayments.rentalId, rentalId),
        sql`date_trunc('month', ${rentalPayments.paid_date}) = ${new Date(
          `${period}-01`,
        ).toISOString()}`,
      ),
    );

  return {
    suggested: row?.collected ? Number(row.collected) : 0,
    paidCount: row?.count ? Number(row.count) : 0,
  };
}

export function settlementSummary(row: SettlementRow, expenses: ExpenseRow[]): SettlementSummary {
  const gross = Number(row.grossAmount);
  const feePercent = Number(row.feePercent ?? 0);
  const feeAmount = gross * (feePercent / 100);
  const expensesTotal = expenses
    .filter((e) => e.type === "gasto")
    .reduce((acc, e) => acc + e.amount, 0);
  const additionsTotal = expenses
    .filter((e) => e.type === "adicional")
    .reduce((acc, e) => acc + e.amount, 0);
  const net = gross - feeAmount - expensesTotal + additionsTotal;

  return {
    gross,
    feeAmount,
    expensesTotal,
    additionsTotal,
    net,
  };
}

export function formatSummary(summary: SettlementSummary, currency: string): string {
  return [
    `Bruto: ${formatPrice(summary.gross, currency)}`,
    `Honorarios: ${formatPrice(summary.feeAmount, currency)}`,
    `Gastos: ${formatPrice(summary.expensesTotal, currency)}`,
    `Adicionales: ${formatPrice(summary.additionsTotal, currency)}`,
    `Neto: ${formatPrice(summary.net, currency)}`,
  ].join(" · ");
}
