"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { clientSchema } from "@/lib/validation";

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    type: formData.get("type"),
    stage: formData.get("stage") ?? undefined,
    notes: formData.get("notes"),
  });
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [created] = await db
    .insert(clients)
    .values({ ...parsed.data, organizationId: org.id })
    .returning({ id: clients.id });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "client.created",
    entityType: "client",
    entityId: created.id,
    summary: parsed.data.name,
  });

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  redirect(`/crm/${created.id}`);
}

export async function updateClientAction(
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
    return { success: false, message: "Cliente inválido" };
  }

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [updated] = await db
    .update(clients)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.organizationId, org.id)))
    .returning({ id: clients.id });

  if (!updated) {
    return { success: false, message: "El cliente no existe" };
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "client.updated",
    entityType: "client",
    entityId: updated.id,
    summary: parsed.data.name,
  });

  revalidatePath("/crm");
  revalidatePath(`/crm/${id}`);
  revalidatePath("/dashboard");
  redirect(`/crm/${id}`);
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/crm/${id}`);
  }

  if (id) {
    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.organizationId, org.id)))
      .returning({ name: clients.name });

    if (deleted) {
      await logActivity({
        organizationId: org.id,
        actorId: user.id,
        actorName: user.name,
        action: "client.deleted",
        entityType: "client",
        entityId: id,
        summary: deleted.name,
      });
    }
  }

  revalidatePath("/crm");
  revalidatePath("/dashboard");
  redirect("/crm");
}
