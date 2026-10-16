"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { valuations } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { valuationSchema } from "@/lib/validation";

function parseValuationForm(formData: FormData) {
  return valuationSchema.safeParse({
    title: formData.get("title"),
    address: formData.get("address"),
    areaM2: formData.get("areaM2"),
    pricePerM2: formData.get("pricePerM2"),
    totalPrice: formData.get("totalPrice"),
    status: formData.get("status") ?? undefined,
    notes: formData.get("notes"),
  });
}

export async function createValuationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = parseValuationForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [created] = await db
    .insert(valuations)
    .values({ ...parsed.data, organizationId: org.id })
    .returning({ id: valuations.id });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "valuation.created",
    entityType: "valuation",
    entityId: created.id,
    summary: parsed.data.title,
  });

  revalidatePath("/tasaciones");
  revalidatePath("/dashboard");
  redirect(`/tasaciones/${created.id}`);
}

export async function updateValuationAction(
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
    return { success: false, message: "Tasación inválida" };
  }

  const parsed = parseValuationForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(valuations)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(valuations.id, id), eq(valuations.organizationId, org.id)))
    .returning({ id: valuations.id });

  if (!updated) {
    return { success: false, message: "La tasación no existe" };
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "valuation.updated",
    entityType: "valuation",
    entityId: updated.id,
    summary: parsed.data.title,
  });

  revalidatePath("/tasaciones");
  revalidatePath(`/tasaciones/${id}`);
  revalidatePath("/dashboard");
  redirect(`/tasaciones/${id}`);
}

export async function deleteValuationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/tasaciones/${id}`);
  }

  if (id) {
    const [deleted] = await db
      .delete(valuations)
      .where(
        and(eq(valuations.id, id), eq(valuations.organizationId, org.id)),
      )
      .returning({ title: valuations.title });

    if (deleted) {
      await logActivity({
        organizationId: org.id,
        actorId: user.id,
        actorName: user.name,
        action: "valuation.deleted",
        entityType: "valuation",
        entityId: id,
        summary: deleted.title,
      });
    }
  }

  revalidatePath("/tasaciones");
  revalidatePath("/dashboard");
  redirect("/tasaciones");
}
