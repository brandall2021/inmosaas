"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { catalogEntries, type CatalogKind } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { catalogEntrySchema } from "@/lib/validation";

import { DEFAULT_CATALOG_ENTRIES } from "./constants";

function parseCatalogForm(formData: FormData) {
  return catalogEntrySchema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
}

async function nameTaken(
  organizationId: string,
  kind: CatalogKind,
  name: string,
  excludeId?: string,
) {
  const conditions = [
    eq(catalogEntries.organizationId, organizationId),
    eq(catalogEntries.kind, kind),
    eq(catalogEntries.name, name),
  ];
  if (excludeId) {
    conditions.push(ne(catalogEntries.id, excludeId));
  }

  const [row] = await db
    .select({ id: catalogEntries.id })
    .from(catalogEntries)
    .where(and(...conditions))
    .limit(1);

  return Boolean(row);
}

export async function createCatalogEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = parseCatalogForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { kind, name, description } = parsed.data;
  if (await nameTaken(org.id, kind, name)) {
    return {
      success: false,
      errors: { name: ["Ya existe un elemento con ese nombre"] },
    };
  }

  const [created] = await db
    .insert(catalogEntries)
    .values({ organizationId: org.id, kind, name, description })
    .returning({ id: catalogEntries.id });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "catalog.created",
    entityType: "catalog_entry",
    entityId: created.id,
    summary: name,
  });

  revalidatePath("/catalogos");
  redirect("/catalogos");
}

export async function updateCatalogEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { success: false, message: "Elemento inválido" };
  }

  const parsed = parseCatalogForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { kind, name, description } = parsed.data;
  if (await nameTaken(org.id, kind, name, id)) {
    return {
      success: false,
      errors: { name: ["Ya existe un elemento con ese nombre"] },
    };
  }

  const [updated] = await db
    .update(catalogEntries)
    .set({ kind, name, description, updatedAt: new Date() })
    .where(
      and(eq(catalogEntries.id, id), eq(catalogEntries.organizationId, org.id)),
    )
    .returning({ id: catalogEntries.id });

  if (!updated) {
    return { success: false, message: "El elemento no existe" };
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "catalog.updated",
    entityType: "catalog_entry",
    entityId: updated.id,
    summary: name,
  });

  revalidatePath("/catalogos");
  redirect("/catalogos");
}

export async function deleteCatalogEntryAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");

  if (!hasRole(role, ["owner", "admin"])) {
    redirect("/catalogos");
  }

  if (id) {
    const [deleted] = await db
      .delete(catalogEntries)
      .where(
        and(
          eq(catalogEntries.id, id),
          eq(catalogEntries.organizationId, org.id),
        ),
      )
      .returning({ name: catalogEntries.name });

    if (deleted) {
      await logActivity({
        organizationId: org.id,
        actorId: user.id,
        actorName: user.name,
        action: "catalog.deleted",
        entityType: "catalog_entry",
        entityId: id,
        summary: deleted.name,
      });
    }
  }

  revalidatePath("/catalogos");
  redirect("/catalogos");
}

export async function seedCatalogAction(): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const inserted = await db
    .insert(catalogEntries)
    .values(
      DEFAULT_CATALOG_ENTRIES.map((entry) => ({
        organizationId: org.id,
        kind: entry.kind,
        name: entry.name,
        description: entry.description,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: catalogEntries.id });

  if (inserted.length > 0) {
    await logActivity({
      organizationId: org.id,
      actorId: user.id,
      actorName: user.name,
      action: "catalog.seeded",
      entityType: "catalog_entry",
      summary: `${inserted.length} elementos`,
    });
  }

  revalidatePath("/catalogos");
  redirect("/catalogos");
}
