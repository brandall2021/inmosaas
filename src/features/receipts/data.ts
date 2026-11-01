import "server-only";

import { and, desc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  documents,
  properties,
  receipts,
  rentals,
  type ReceiptStatus,
} from "@/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReceiptRow = typeof receipts.$inferSelect & {
  clientName: string | null;
  clientType: string | null;
  propertyTitle: string | null;
  rentalTitle: string | null;
  documentTitle: string | null;
  documentStorageKey: string | null;
};

export type ReceiptFilters = {
  status?: ReceiptStatus;
  clientId?: string;
  period?: string;
};

export async function listReceipts(
  organizationId: string,
  filters: ReceiptFilters = {},
): Promise<ReceiptRow[]> {
  const conditions = [eq(receipts.organizationId, organizationId)];

  if (filters.status) {
    conditions.push(eq(receipts.status, filters.status));
  }
  if (filters.clientId) {
    conditions.push(eq(receipts.clientId, filters.clientId));
  }
  if (filters.period) {
    conditions.push(eq(receipts.period, filters.period));
  }

  const rows = await db
    .select({
      id: receipts.id,
      organizationId: receipts.organizationId,
      clientId: receipts.clientId,
      rentalId: receipts.rentalId,
      documentId: receipts.documentId,
      period: receipts.period,
      amount: receipts.amount,
      currency: receipts.currency,
      method: receipts.method,
      issuedDate: receipts.issuedDate,
      paidDate: receipts.paidDate,
      status: receipts.status,
      notes: receipts.notes,
      createdAt: receipts.createdAt,
      updatedAt: receipts.updatedAt,
      clientName: clients.name,
      clientType: clients.type,
      propertyTitle: properties.title,
      rentalTitle: properties.title,
      documentTitle: documents.title,
      documentStorageKey: documents.storageKey,
    })
    .from(receipts)
    .leftJoin(clients, eq(receipts.clientId, clients.id))
    .leftJoin(rentals, eq(receipts.rentalId, rentals.id))
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(documents, eq(receipts.documentId, documents.id))
    .where(and(...conditions))
    .orderBy(desc(receipts.issuedDate), desc(receipts.createdAt));

  return rows;
}

export async function countReceiptsByStatus(
  organizationId: string,
  status: ReceiptStatus,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(receipts)
    .where(
      and(
        eq(receipts.organizationId, organizationId),
        eq(receipts.status, status),
      ),
    );
  return row?.value ?? 0;
}

export async function getReceipt(
  organizationId: string,
  id: string,
): Promise<ReceiptRow | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const [row] = await db
    .select({
      id: receipts.id,
      organizationId: receipts.organizationId,
      clientId: receipts.clientId,
      rentalId: receipts.rentalId,
      documentId: receipts.documentId,
      period: receipts.period,
      amount: receipts.amount,
      currency: receipts.currency,
      method: receipts.method,
      issuedDate: receipts.issuedDate,
      paidDate: receipts.paidDate,
      status: receipts.status,
      notes: receipts.notes,
      createdAt: receipts.createdAt,
      updatedAt: receipts.updatedAt,
      clientName: clients.name,
      clientType: clients.type,
      propertyTitle: properties.title,
      rentalTitle: properties.title,
      documentTitle: documents.title,
      documentStorageKey: documents.storageKey,
    })
    .from(receipts)
    .leftJoin(clients, eq(receipts.clientId, clients.id))
    .leftJoin(rentals, eq(receipts.rentalId, rentals.id))
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(documents, eq(receipts.documentId, documents.id))
    .where(
      and(
        eq(receipts.organizationId, organizationId),
        eq(receipts.id, id),
      ),
    )
    .limit(1);

  return row ?? null;
}
