"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { properties, propertyImages } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
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

function parsePropertyForm(formData: FormData) {
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
  });
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

  const [created] = await db
    .insert(properties)
    .values({ ...parsed.data, organizationId: org.id })
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

  const [updated] = await db
    .update(properties)
    .set({ ...parsed.data, updatedAt: new Date() })
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
