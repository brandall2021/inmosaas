import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * A person who can sign in. Identity is global across tenants; which tenants
 * they belong to is expressed through `memberships`.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A tenant. Every tenant-owned row in the app carries this `id` so that all
 * reads and writes can be scoped to the active organization.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    plan: text("plan").notNull().default("trial"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)],
);

export type MembershipRole = "owner" | "admin" | "member";

/**
 * Join table between users and organizations. `role` is the authorization
 * source of truth for what a user may do inside a given tenant.
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").$type<MembershipRole>().notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("memberships_user_org_idx").on(
      table.userId,
      table.organizationId,
    ),
    index("memberships_organization_idx").on(table.organizationId),
  ],
);

/**
 * Server-side sessions. The browser only receives a random opaque token; only
 * its hash is stored here, so a database leak cannot be replayed as a login.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: uuid("active_organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
  ],
);

export type PropertyOperation = "venta" | "alquiler";

export type PropertyType =
  | "departamento"
  | "casa"
  | "ph"
  | "terreno"
  | "local"
  | "oficina"
  | "cochera"
  | "campo";

export type PropertyStatus =
  | "disponible"
  | "reservada"
  | "vendida"
  | "alquilada";

export type Currency = "ARS" | "USD";

/**
 * A listing owned by a tenant. Every read and write is scoped by
 * `organizationId` so one tenant can never see another tenant's portfolio.
 */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    operation: text("operation").$type<PropertyOperation>().notNull(),
    propertyType: text("property_type").$type<PropertyType>().notNull(),
    status: text("status")
      .$type<PropertyStatus>()
      .notNull()
      .default("disponible"),
    price: numeric("price", { precision: 14, scale: 2, mode: "number" }),
    currency: text("currency").$type<Currency>().notNull().default("USD"),
    address: text("address"),
    city: text("city"),
    province: text("province"),
    rooms: integer("rooms"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    areaM2: integer("area_m2"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("properties_organization_idx").on(table.organizationId),
    index("properties_org_status_idx").on(table.organizationId, table.status),
  ],
);

/**
 * Photos attached to a listing. Only the storage key is persisted; the binary
 * lives in the storage backend and is served through an authenticated route.
 */
export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("property_images_storage_key_idx").on(table.storageKey),
    index("property_images_property_idx").on(table.propertyId),
  ],
);

export type ClientType =
  | "comprador"
  | "vendedor"
  | "inquilino"
  | "propietario";

export type ClientStage =
  | "nuevo"
  | "contactado"
  | "visitando"
  | "negociacion"
  | "cerrado";

/**
 * A contact in the tenant's pipeline (buyers, sellers, tenants, owners).
 * Scoped by `organizationId` like every other tenant-owned record.
 */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    type: text("type").$type<ClientType>().notNull().default("comprador"),
    stage: text("stage").$type<ClientStage>().notNull().default("nuevo"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clients_organization_idx").on(table.organizationId),
    index("clients_org_stage_idx").on(table.organizationId, table.stage),
  ],
);

export type ValuationStatus = "pendiente" | "en_revision" | "completada";

/**
 * Property valuations (tasaciones) scoped to a tenant. Can reference an existing
 * property; all fields are stored org-scoped for multi-tenant isolation.
 */
export const valuations = pgTable(
  "valuations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    address: text("address"),
    areaM2: numeric("area_m2", { precision: 10, scale: 2, mode: "number" }),
    pricePerM2: numeric("price_per_m2", {
      precision: 14,
      scale: 2,
      mode: "number",
    }),
    totalPrice: numeric("total_price", {
      precision: 14,
      scale: 2,
      mode: "number",
    }),
    status: text("status").$type<ValuationStatus>().notNull().default("pendiente"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("valuations_organization_idx").on(table.organizationId),
    index("valuations_property_idx").on(table.propertyId),
  ],
);

export type RentalStatus = "vigente" | "finalizado" | "rescindido";

/**
 * A lease/rental managed by the tenant. Optionally links to a property and to
 * the tenant's client (the renter). Org-scoped for multi-tenant isolation.
 */
export const rentals = pgTable(
  "rentals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    rentAmount: numeric("rent_amount", {
      precision: 14,
      scale: 2,
      mode: "number",
    }),
    currency: text("currency").$type<Currency>().notNull().default("ARS"),
    status: text("status").$type<RentalStatus>().notNull().default("vigente"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("rentals_organization_idx").on(table.organizationId),
    index("rentals_org_status_idx").on(table.organizationId, table.status),
  ],
);

export type DocumentType = "contrato_alquiler" | "propuesta" | "archivo";

/**
 * A document belonging to a tenant: generated (contract/proposal PDF) or
 * uploaded (office file). Only the storage key is persisted; the binary lives
 * in the storage backend and is served through an authenticated route. Entity
 * links are cleared (set null) when the linked record is deleted.
 */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type").$type<DocumentType>().notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    expiresAt: date("expires_at"),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    rentalId: uuid("rental_id").references(() => rentals.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("documents_storage_key_idx").on(table.storageKey),
    index("documents_organization_idx").on(table.organizationId),
    index("documents_org_type_idx").on(table.organizationId, table.type),
    index("documents_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

/**
 * Append-only audit trail of tenant-scoped mutations. Written best-effort by
 * server actions so a logging failure never breaks the primary flow.
 */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorName: text("actor_name"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_logs_organization_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

/**
 * Per-tenant integration settings (outgoing webhooks and future connectors).
 * One row per organization, enforced by a unique index.
 */
export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    webhookUrl: text("webhook_url"),
    webhookEnabled: boolean("webhook_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("integrations_organization_idx").on(table.organizationId),
  ],
);

export type CatalogKind = "zona" | "amenity" | "servicio" | "etiqueta";

/**
 * Tenant-owned reference data (zonas, amenities, servicios, etiquetas) used to
 * organise listings and contacts. Same tenant boundary as the rest of the app.
 */
export const catalogEntries = pgTable(
  "catalog_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    kind: text("kind").$type<CatalogKind>().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("catalog_entries_organization_idx").on(
      table.organizationId,
      table.kind,
    ),
    uniqueIndex("catalog_entries_unique_idx").on(
      table.organizationId,
      table.kind,
      table.name,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  sessions: many(sessions),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  properties: many(properties),
  clients: many(clients),
  valuations: many(valuations),
  rentals: many(rentals),
  activityLogs: many(activityLogs),
  integrations: many(integrations),
  catalogEntries: many(catalogEntries),
  documents: many(documents),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [properties.organizationId],
    references: [organizations.id],
  }),
  images: many(propertyImages),
  rentals: many(rentals),
  documents: many(documents),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  rentals: many(rentals),
  documents: many(documents),
}));

export const valuationsRelations = relations(valuations, ({ one }) => ({
  organization: one(organizations, {
    fields: [valuations.organizationId],
    references: [organizations.id],
  }),
  property: one(properties, {
    fields: [valuations.propertyId],
    references: [properties.id],
  }),
}));

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [rentals.organizationId],
    references: [organizations.id],
  }),
  property: one(properties, {
    fields: [rentals.propertyId],
    references: [properties.id],
  }),
  client: one(clients, {
    fields: [rentals.clientId],
    references: [clients.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  rental: one(rentals, {
    fields: [documents.rentalId],
    references: [rentals.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [activityLogs.organizationId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const catalogEntriesRelations = relations(
  catalogEntries,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [catalogEntries.organizationId],
      references: [organizations.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Valuation = typeof valuations.$inferSelect;
export type NewValuation = typeof valuations.$inferInsert;
export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type CatalogEntry = typeof catalogEntries.$inferSelect;
export type NewCatalogEntry = typeof catalogEntries.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
