"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { cashBoxEntries, clients, rentals, type Currency, type CashBoxEntryType, type CashBoxCategory } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";

import {
  createCashBoxClosing,
  conciliateEntries,
} from "./data";

async function getOrgEntry(organizationId: string, entryId: string) {
  const [entry] = await db
    .select()
    .from(cashBoxEntries)
    .where(
      and(
        eq(cashBoxEntries.organizationId, organizationId),
        eq(cashBoxEntries.id, entryId),
      ),
    )
    .limit(1);
  return entry ?? null;
}

function auditInput({
  organizationId,
  actorId,
  actorName,
  action,
  entryId,
  summary,
}: {
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  entryId: string;
  summary: string;
}) {
  return logActivity({
    organizationId,
    actorId,
    actorName,
    action,
    entityType: "cash_box_entry",
    entityId: entryId,
    summary,
  });
}

export async function createCashBoxEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const type = String(formData.get("type") ?? "");
  const concept = String(formData.get("concept") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "");
  const currency = String(formData.get("currency") ?? "ARS");
  const category = String(formData.get("category") ?? "");
  const date = String(formData.get("date") ?? "");
  const clientIdRaw = String(formData.get("clientId") ?? "");
  const rentalIdRaw = String(formData.get("rentalId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const validTypes = ["ingreso", "egreso"];
  const validCategories = [
    "ventas", "alquileres", "servicios", "expensas", "impuestos",
    "sueldos", "mantenimiento", "otros",
  ];

  if (!validTypes.includes(type)) {
    return { success: false, errors: { type: ["Tipo inválido"] } };
  }
  if (!concept) {
    return { success: false, errors: { concept: ["Concepto requerido"] } };
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, errors: { amount: ["Monto inválido"] } };
  }
  if (!currency) {
    return { success: false, errors: { currency: ["Moneda requerida"] } };
  }
  if (!validCategories.includes(category)) {
    return { success: false, errors: { category: ["Categoría inválida"] } };
  }
  if (!date) {
    return { success: false, errors: { date: ["Fecha requerida"] } };
  }

  let clientId: string | null = null;
  let rentalId: string | null = null;

  if (clientIdRaw) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, org.id),
          eq(clients.id, clientIdRaw),
        ),
      )
      .limit(1);
    if (!client) {
      return { success: false, errors: { clientId: ["Cliente no existe"] } };
    }
    clientId = client.id;
  }

  if (rentalIdRaw) {
    const [rental] = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.organizationId, org.id),
          eq(rentals.id, rentalIdRaw),
        ),
      )
      .limit(1);
    if (!rental) {
      return { success: false, errors: { rentalId: ["Alquiler no existe"] } };
    }
    rentalId = rental.id;
  }

  const [created] = await db
    .insert(cashBoxEntries)
    .values({
      organizationId: org.id,
      type: type as CashBoxEntryType,
      concept,
      amount,
      currency: currency as Currency,
      category: category as CashBoxCategory,
      date,
      clientId,
      rentalId,
      notes: notes || null,
      status: "pendiente",
    })
    .returning({ id: cashBoxEntries.id });

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "cash_box.created",
    entryId: created.id,
    summary: `${type} ${concept}`,
  });

  revalidatePath("/caja");
  revalidatePath("/dashboard");
  redirect(`/caja/${created.id}`);
}

export async function updateCashBoxEntryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const entry = id ? await getOrgEntry(org.id, id) : null;
  if (!entry) {
    redirect("/caja");
  }

  if (entry.status !== "pendiente") {
    return { success: false, message: "Solo se editan movimientos pendientes" };
  }

  const type = String(formData.get("type") ?? "");
  const concept = String(formData.get("concept") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "");
  const currency = String(formData.get("currency") ?? "ARS");
  const category = String(formData.get("category") ?? "");
  const date = String(formData.get("date") ?? "");
  const clientIdRaw = String(formData.get("clientId") ?? "");
  const rentalIdRaw = String(formData.get("rentalId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const validTypes = ["ingreso", "egreso"];
  const validCategories = [
    "ventas", "alquileres", "servicios", "expensas", "impuestos",
    "sueldos", "mantenimiento", "otros",
  ];

  if (!validTypes.includes(type)) {
    return { success: false, errors: { type: ["Tipo inválido"] } };
  }
  if (!concept) {
    return { success: false, errors: { concept: ["Concepto requerido"] } };
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, errors: { amount: ["Monto inválido"] } };
  }
  if (!currency) {
    return { success: false, errors: { currency: ["Moneda requerida"] } };
  }
  if (!validCategories.includes(category)) {
    return { success: false, errors: { category: ["Categoría inválida"] } };
  }
  if (!date) {
    return { success: false, errors: { date: ["Fecha requerida"] } };
  }

  let clientId: string | null = null;
  let rentalId: string | null = null;

  if (clientIdRaw) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, org.id),
          eq(clients.id, clientIdRaw),
        ),
      )
      .limit(1);
    if (!client) {
      return { success: false, errors: { clientId: ["Cliente no existe"] } };
    }
    clientId = client.id;
  }

  if (rentalIdRaw) {
    const [rental] = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.organizationId, org.id),
          eq(rentals.id, rentalIdRaw),
        ),
      )
      .limit(1);
    if (!rental) {
      return { success: false, errors: { rentalId: ["Alquiler no existe"] } };
    }
    rentalId = rental.id;
  }

  await db
    .update(cashBoxEntries)
    .set({
      type: type as CashBoxEntryType,
      concept,
      amount,
      currency: currency as Currency,
      category: category as CashBoxCategory,
      date,
      clientId,
      rentalId,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(cashBoxEntries.id, entry.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "cash_box.updated",
    entryId: entry.id,
    summary: `${type} ${concept}`,
  });

  revalidatePath("/caja");
  revalidatePath(`/caja/${entry.id}`);
  redirect(`/caja/${entry.id}`);
}

export async function deleteCashBoxEntryAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const entry = id ? await getOrgEntry(org.id, id) : null;
  if (!entry) {
    redirect("/caja");
  }

  const role = await requireMembership(user.id, org.id);
  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/caja/${entry.id}`);
  }
  if (entry.status !== "pendiente") {
    redirect(`/caja/${entry.id}`);
  }

  await db.delete(cashBoxEntries).where(eq(cashBoxEntries.id, entry.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "cash_box.deleted",
    entryId: entry.id,
    summary: `${entry.type} ${entry.concept}`,
  });

  revalidatePath("/caja");
  redirect("/caja");
}

export async function createCashBoxClosingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  if (!hasRole(role, ["owner", "admin"])) {
    return { success: false, message: "Solo owner o admin pueden cerrar caja" };
  }

  const closingDate = String(formData.get("closingDate") ?? "");
  const openingAmountRaw = String(formData.get("openingAmount") ?? "");
  const realBalanceRaw = String(formData.get("realBalance") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!closingDate) {
    return { success: false, errors: { closingDate: ["Fecha requerida"] } };
  }
  const openingAmount = Number(openingAmountRaw);
  if (!Number.isFinite(openingAmount)) {
    return { success: false, errors: { openingAmount: ["Monto inválido"] } };
  }
  const realBalance = Number(realBalanceRaw);
  if (!Number.isFinite(realBalance)) {
    return { success: false, errors: { realBalance: ["Saldo real inválido"] } };
  }

  try {
    await createCashBoxClosing({
      organizationId: org.id,
      closingDate,
      openingAmount,
      realBalance,
      notes: notes || null,
    });
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || "No se pudo cerrar la caja",
    };
  }

  await conciliateEntries(org.id, closingDate);

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "cash_box.closed",
    entryId: closingDate,
    summary: `Cierre ${closingDate}`,
  });

  revalidatePath("/caja");
  revalidatePath("/caja/cierres");
  redirect("/caja/cierres");
}
