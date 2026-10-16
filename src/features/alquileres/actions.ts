"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { rentals } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { rentalSchema } from "@/lib/validation";

import { getRentalLabel } from "./data";

const NONE_VALUE = "none";

function refFromForm(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  return !value || value === NONE_VALUE ? undefined : value;
}

function parseRentalForm(formData: FormData) {
  return rentalSchema.safeParse({
    propertyId: refFromForm(formData, "propertyId"),
    clientId: refFromForm(formData, "clientId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rentAmount: formData.get("rentAmount"),
    currency: formData.get("currency"),
    status: formData.get("status") ?? undefined,
    notes: formData.get("notes"),
  });
}

export async function createRentalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = parseRentalForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [created] = await db
    .insert(rentals)
    .values({
      organizationId: org.id,
      propertyId: parsed.data.propertyId ?? null,
      clientId: parsed.data.clientId ?? null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate ?? null,
      rentAmount: parsed.data.rentAmount ?? null,
      currency: parsed.data.currency,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: rentals.id });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "rental.created",
    entityType: "rental",
    entityId: created.id,
    summary: (await getRentalLabel(org.id, created.id)) ?? "Alquiler",
  });

  revalidatePath("/alquileres");
  revalidatePath("/dashboard");
  redirect(`/alquileres/${created.id}`);
}

export async function updateRentalAction(
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
    return { success: false, message: "Alquiler inválido" };
  }

  const parsed = parseRentalForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(rentals)
    .set({
      propertyId: parsed.data.propertyId ?? null,
      clientId: parsed.data.clientId ?? null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate ?? null,
      rentAmount: parsed.data.rentAmount ?? null,
      currency: parsed.data.currency,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(rentals.id, id), eq(rentals.organizationId, org.id)))
    .returning({ id: rentals.id });

  if (!updated) {
    return { success: false, message: "El alquiler no existe" };
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "rental.updated",
    entityType: "rental",
    entityId: updated.id,
    summary: (await getRentalLabel(org.id, updated.id)) ?? "Alquiler",
  });

  revalidatePath("/alquileres");
  revalidatePath(`/alquileres/${id}`);
  revalidatePath("/dashboard");
  redirect(`/alquileres/${id}`);
}

export async function deleteRentalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/alquileres/${id}`);
  }

  if (id) {
    const label = await getRentalLabel(org.id, id);
    const [deleted] = await db
      .delete(rentals)
      .where(and(eq(rentals.id, id), eq(rentals.organizationId, org.id)))
      .returning({ id: rentals.id });

    if (deleted) {
      await logActivity({
        organizationId: org.id,
        actorId: user.id,
        actorName: user.name,
        action: "rental.deleted",
        entityType: "rental",
        entityId: id,
        summary: label ?? "Alquiler",
      });
    }
  }

  revalidatePath("/alquileres");
  revalidatePath("/dashboard");
  redirect("/alquileres");
}
