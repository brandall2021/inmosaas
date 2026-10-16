import "server-only";

import { and, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { clients, properties, rentals, valuations } from "@/db/schema";
import { formatDate, rentalStatusLabels } from "@/features/alquileres/constants";
import { clientTypeLabels } from "@/features/clients/constants";
import { formatPrice, operationLabels } from "@/features/properties/constants";
import {
  formatCurrency,
  valuationStatusLabels,
} from "@/features/tasaciones/constants";

import type { SearchPlan } from "./query";

export type SearchResultItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
};

export type SearchResults = {
  properties: SearchResultItem[];
  clients: SearchResultItem[];
  valuations: SearchResultItem[];
  rentals: SearchResultItem[];
};

const LIMIT = 6;

type Col = Parameters<typeof ilike>[0];

/** Every token must appear in at least one of the given columns. */
function textMatches(tokens: string[], columns: Col[]): SQL | undefined {
  if (tokens.length === 0) {
    return undefined;
  }

  const perToken = tokens.map((token) => {
    const term = `%${token}%`;
    return or(...columns.map((column) => ilike(column, term)));
  });

  return and(...perToken);
}

async function searchProperties(
  organizationId: string,
  plan: SearchPlan,
): Promise<SearchResultItem[]> {
  const conditions: SQL[] = [eq(properties.organizationId, organizationId)];

  if (plan.operation) {
    conditions.push(eq(properties.operation, plan.operation));
  }
  if (plan.propertyTypes.length > 0) {
    conditions.push(inArray(properties.propertyType, plan.propertyTypes));
  }
  if (plan.city) {
    const term = `%${plan.city}%`;
    const cityMatch = or(
      ilike(properties.city, term),
      ilike(properties.address, term),
    );
    if (cityMatch) {
      conditions.push(cityMatch);
    }
  }
  if (plan.minPrice !== undefined) {
    conditions.push(gte(properties.price, plan.minPrice));
  }
  if (plan.maxPrice !== undefined) {
    conditions.push(lte(properties.price, plan.maxPrice));
  }
  if (plan.currency) {
    conditions.push(eq(properties.currency, plan.currency));
  }

  const text = textMatches(plan.tokens, [
    properties.title,
    properties.address,
    properties.city,
    properties.description,
  ]);
  if (text) {
    conditions.push(text);
  }

  // Nothing beyond the tenant boundary means the user hasn't asked anything.
  if (conditions.length === 1) {
    return [];
  }

  const rows = await db
    .select()
    .from(properties)
    .where(and(...conditions))
    .orderBy(desc(properties.createdAt))
    .limit(LIMIT);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    meta: [
      formatPrice(row.price, row.currency),
      operationLabels[row.operation],
      row.city,
    ]
      .filter(Boolean)
      .join(" · "),
    href: `/propiedades/${row.id}`,
  }));
}

async function searchClients(
  organizationId: string,
  plan: SearchPlan,
): Promise<SearchResultItem[]> {
  const text = textMatches(plan.tokens, [
    clients.name,
    clients.email,
    clients.phone,
    clients.notes,
  ]);
  if (!text) {
    return [];
  }

  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), text))
    .orderBy(desc(clients.createdAt))
    .limit(LIMIT);

  return rows.map((row) => ({
    id: row.id,
    title: row.name,
    meta: [
      clientTypeLabels[row.type],
      row.email,
      row.phone,
    ]
      .filter(Boolean)
      .join(" · "),
    href: `/crm/${row.id}`,
  }));
}

async function searchValuations(
  organizationId: string,
  plan: SearchPlan,
): Promise<SearchResultItem[]> {
  const text = textMatches(plan.tokens, [
    valuations.title,
    valuations.address,
    valuations.notes,
  ]);
  if (!text) {
    return [];
  }

  const rows = await db
    .select()
    .from(valuations)
    .where(and(eq(valuations.organizationId, organizationId), text))
    .orderBy(desc(valuations.createdAt))
    .limit(LIMIT);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    meta: [
      valuationStatusLabels[row.status],
      row.address,
      formatCurrency(row.totalPrice),
    ]
      .filter(Boolean)
      .join(" · "),
    href: `/tasaciones/${row.id}`,
  }));
}

async function searchRentals(
  organizationId: string,
  plan: SearchPlan,
): Promise<SearchResultItem[]> {
  const text = textMatches(plan.tokens, [
    properties.title,
    clients.name,
    rentals.notes,
  ]);
  if (!text) {
    return [];
  }

  const rows = await db
    .select({
      id: rentals.id,
      status: rentals.status,
      startDate: rentals.startDate,
      rentAmount: rentals.rentAmount,
      currency: rentals.currency,
      propertyTitle: properties.title,
      clientName: clients.name,
    })
    .from(rentals)
    .leftJoin(properties, eq(rentals.propertyId, properties.id))
    .leftJoin(clients, eq(rentals.clientId, clients.id))
    .where(and(eq(rentals.organizationId, organizationId), text))
    .orderBy(desc(rentals.createdAt))
    .limit(LIMIT);

  return rows.map((row) => ({
    id: row.id,
    title: row.propertyTitle ?? row.clientName ?? "Alquiler sin asignar",
    meta: [
      rentalStatusLabels[row.status],
      formatDate(row.startDate),
      formatCurrency(row.rentAmount, row.currency),
    ]
      .filter(Boolean)
      .join(" · "),
    href: `/alquileres/${row.id}`,
  }));
}

export async function searchEverything(
  organizationId: string,
  plan: SearchPlan,
): Promise<SearchResults> {
  const [propertyResults, clientResults, valuationResults, rentalResults] =
    await Promise.all([
      searchProperties(organizationId, plan),
      searchClients(organizationId, plan),
      searchValuations(organizationId, plan),
      searchRentals(organizationId, plan),
    ]);

  return {
    properties: propertyResults,
    clients: clientResults,
    valuations: valuationResults,
    rentals: rentalResults,
  };
}
