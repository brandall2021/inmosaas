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

import { getIntegration, logActivity, saveIntegration } from "./data";
import { testWebhookConnection } from "@/lib/webhook";

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

  // The stored secret is never returned to the client: an empty field keeps
  // the existing one (masked), a non-empty one replaces it.
  const rawSecret = String(formData.get("webhookSecret") ?? "").trim();
  const current = await getIntegration(org.id);
  const webhookSecret =
    rawSecret || current?.webhookSecret || null;

  await saveIntegration(org.id, { webhookUrl, webhookEnabled, webhookSecret });

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

export async function pingWebhookAction(
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const result = await testWebhookConnection(org.id);
  revalidatePath("/configuracion");

  if (result === null) {
    return {
      success: false,
      message: "Configurá la URL y activá el webhook para probar la conexión.",
    };
  }

  return result === "delivered"
    ? { success: true, message: "El receptor respondió OK — la entrega quedó en el registro." }
    : { success: false, message: "El receptor no respondió OK — revisá el detalle en Entregas." };
}
