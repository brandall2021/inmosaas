"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { integrationSchema } from "@/lib/validation";

import { logActivity, saveIntegration } from "./data";

export async function saveIntegrationsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = integrationSchema.safeParse({
    webhookUrl: formData.get("webhookUrl"),
    webhookEnabled: formData.get("webhookEnabled") === "on",
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const webhookUrl = parsed.data.webhookUrl ?? null;
  const webhookEnabled = parsed.data.webhookEnabled;

  await saveIntegration(org.id, { webhookUrl, webhookEnabled });

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "integration.updated",
    entityType: "integration",
    summary: webhookEnabled
      ? `Webhook activado en ${webhookUrl}`
      : webhookUrl
        ? `Webhook desactivado (${webhookUrl})`
        : "Integraciones actualizadas",
  });

  revalidatePath("/configuracion");

  return { success: true, message: "Configuración guardada" };
}
