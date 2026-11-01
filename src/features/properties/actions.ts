"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { properties, propertyImages } from "@/db/schema";
import { listCatalogFormOptions } from "@/features/catalogos/data";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import { enqueueWebhook } from "@/lib/webhook";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { deleteImage, saveImage } from "@/lib/storage";
import { propertySchema } from "@/lib/validation";
import {
  MAX_IMAGE_BYTES,
  isAllowedImageType,
} from "./image-constants";
import { getProperty, getPropertyImage } from "./data";

/** The "sin zona" option of the zone select; it submits this sentinel. */
const NO_ZONE_VALUE = "__sin_zona__";

function parsePropertyForm(formData: FormData) {
  const zone = formData.get("zone");
  // The hidden marker separates "every checkbox unchecked" (clear the list)
  // from "the multiselection is not rendered" (keep whatever is stored).
  const amenitiesFieldRendered = formData.get("amenitiesPresent") === "1";
  const rawAmenities = amenitiesFieldRendered
    ? Array.from(formData.getAll("amenities"))
    : undefined;
  return propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    operation: formData.get("operation"),
    propertyType: formData.get("propertyType"),
    status: formData.get("status") ?? undefined,
    price: formData.get("price"),
    currency: formData.get("currency") ?? undefined,
    address: formData.get("address"),
    city: formData.get("city"),
    province: formData.get("province"),
    rooms: formData.get("rooms"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    areaM2: formData.get("areaM2"),
    zone: zone === NO_ZONE_VALUE ? "" : zone,
    amenities: rawAmenities,
  });
}

/**
 * Catalog-backed fields are stored by name, so the server re-checks them
 * against the active tenant's own catalog: no way to persist references from
 * another organization through the form. Zones fall back to free text only
 * when the tenant has no "zona" entries; used amenities still stored on the
 * property stay editable even after their catalog entry was removed.
 */
async function validateCatalogFields(
  organizationId: string,
  zone: string | undefined,
  amenities: string[] | undefined,
  currentAmenities: string[],
): Promise<{ ok: true; zone: string | null; amenities: string[] } | { ok: false; message: string }> {
  const [zoneEntries, characteristicEntries] = await Promise.all([
    listCatalogFormOptions(organizationId, ["zona"]),
    listCatalogFormOptions(organizationId, ["amenity", "servicio"]),
  ]);

  if (zone && zoneEntries.length > 0) {
    const zoneNames = zoneEntries.map((entry) => entry.name);
    if (!zoneNames.includes(zone)) {
      return {
        ok: false,
        message: "La zona no pertenece al catálogo de tu organización",
      };
    }
  }

  if (amenities) {
    const allowed = new Set(characteristicEntries.map((entry) => entry.name));
    for (const name of currentAmenities) {
      allowed.add(name);
    }
    const unknown = amenities.filter((name) => !allowed.has(name));
    if (unknown.length > 0) {
      return {
        ok: false,
        message: `Estas características no están en el catálogo de tu organización: ${unknown.join(", ")}`,
      };
    }
  }

  return { ok: true, zone: zone ?? null, amenities: amenities ?? currentAmenities };
}

export async function createPropertyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  // Confirms the caller really belongs to the tenant before writing to it.
  await requireMembership(user.id, org.id);

  const parsed = parsePropertyForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { zone, amenities, ...core } = parsed.data;
  const catalog = await validateCatalogFields(org.id, zone, amenities, []);
  if (!catalog.ok) {
    return { success: false, message: catalog.message };
  }

  const [created] = await db
    .insert(properties)
    .values({
      ...core,
      zone: catalog.zone,
      amenities: catalog.amenities,
      organizationId: org.id,
    })
    .returning({ id: properties.id });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "property.created",
    entityType: "property",
    entityId: created.id,
    summary: `${parsed.data.title} (${parsed.data.operation})`,
  });

  void enqueueWebhook(org.id, "property.created", created.id, {
    ...parsed.data,
  });

  revalidatePath("/propiedades");
  revalidatePath("/dashboard");
  redirect(`/propiedades/${created.id}`);
}

export async function updatePropertyAction(
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
    return { success: false, message: "Propiedad inválida" };
  }

  const parsed = parsePropertyForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [existing] = await db
    .select({ zone: properties.zone, amenities: properties.amenities })
    .from(properties)
    .where(
      and(eq(properties.id, id), eq(properties.organizationId, org.id)),
    )
    .limit(1);

  if (!existing) {
    return { success: false, message: "La propiedad no existe" };
  }

  const { zone, amenities, ...core } = parsed.data;
  const catalog = await validateCatalogFields(
    org.id,
    zone,
    amenities,
    existing.amenities ?? [],
  );
  if (!catalog.ok) {
    return { success: false, message: catalog.message };
  }

  const [updated] = await db
    .update(properties)
    .set({
      ...core,
      zone: catalog.zone,
      amenities: catalog.amenities,
      updatedAt: new Date(),
    })
    .where(
      and(eq(properties.id, id), eq(properties.organizationId, org.id)),
    )
    .returning({ id: properties.id });

  if (!updated) {
    return { success: false, message: "La propiedad no existe" };
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "property.updated",
    entityType: "property",
    entityId: updated.id,
    summary: `${parsed.data.title} (${parsed.data.operation})`,
  });

  void enqueueWebhook(org.id, "property.updated", updated.id, {
    ...parsed.data,
  });

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${id}`);
  revalidatePath("/dashboard");
  redirect(`/propiedades/${id}`);
}

export async function deletePropertyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");

  // Deleting inventory is restricted to tenant owners/admins.
  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/propiedades/${id}`);
  }

  if (id) {
    const [deleted] = await db
      .delete(properties)
      .where(
        and(eq(properties.id, id), eq(properties.organizationId, org.id)),
      )
      .returning({ title: properties.title });

    if (deleted) {
      await logActivity({
        organizationId: org.id,
        actorId: user.id,
        actorName: user.name,
        action: "property.deleted",
        entityType: "property",
        entityId: id,
        summary: deleted.title,
      });

      void enqueueWebhook(org.id, "property.deleted", id, {
        title: deleted.title,
      });
    }
  }

  revalidatePath("/propiedades");
  revalidatePath("/dashboard");
  redirect("/propiedades");
}

export async function uploadPropertyImageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const propertyId = String(formData.get("propertyId") ?? "");
  const property = await getProperty(org.id, propertyId);
  if (!property) {
    return { success: false, message: "La propiedad no existe" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Seleccioná una imagen" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, message: "La imagen supera el límite de 5 MB" };
  }
  if (!isAllowedImageType(file.type)) {
    return {
      success: false,
      message: "Formato no permitido (PNG, JPG, WEBP o GIF)",
    };
  }

  const storageKey = await saveImage(
    Buffer.from(await file.arrayBuffer()),
    file.type,
  );

  const [row] = await db
    .select({ value: count() })
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, property.id));

  const alt = String(formData.get("alt") ?? "")
    .trim()
    .slice(0, 160);

  await db.insert(propertyImages).values({
    propertyId: property.id,
    storageKey,
    alt: alt || null,
    position: row?.value ?? 0,
  });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "property.image_added",
    entityType: "property",
    entityId: property.id,
    summary: property.title,
  });

  revalidatePath(`/propiedades/${property.id}`);
  return { success: true };
}

export async function deletePropertyImageAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const imageId = String(formData.get("id") ?? "");
  const image = imageId ? await getPropertyImage(org.id, imageId) : null;

  if (!image) {
    redirect("/propiedades");
  }

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/propiedades/${image.propertyId}`);
  }

  await db.delete(propertyImages).where(eq(propertyImages.id, image.id));
  await deleteImage(image.storageKey);

  const property = await getProperty(org.id, image.propertyId);
  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "property.image_removed",
    entityType: "property",
    entityId: image.propertyId,
    summary: property?.title ?? "Imagen eliminada",
  });

  revalidatePath(`/propiedades/${image.propertyId}`);
  redirect(`/propiedades/${image.propertyId}`);
}
