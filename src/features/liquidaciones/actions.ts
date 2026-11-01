"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  documents,
  properties,
  rentals,
  settlements,
  settlementExpenses,
} from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import { getProperty } from "@/features/properties/data";
import { getClient } from "@/features/clients/data";
import { getRentalLabel } from "@/features/alquileres/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { saveDocumentFile, deleteDocumentFile } from "@/lib/storage";
import { PDF_MIME_TYPE } from "@/features/documentos/document-constants";
import { buildSettlementPdf } from "@/features/documentos/pdf/settlement";
import {
  settlementSchema,
  settlementExpenseSchema,
  settlementPaidSchema,
} from "@/lib/validation";

import {
  getSettlement,
  listExpenses,
  settlementSummary,
} from "./data";

async function getOrgSettlement(organizationId: string, settlementId: string) {
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(
      and(
        eq(settlements.organizationId, organizationId),
        eq(settlements.id, settlementId),
      ),
    )
    .limit(1);
  return settlement ?? null;
}

function auditInput({
  organizationId,
  actorId,
  actorName,
  action,
  settlementId,
  summary,
}: {
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  settlementId: string;
  summary: string;
}) {
  return logActivity({
    organizationId,
    actorId,
    actorName,
    action,
    entityType: "settlement",
    entityId: settlementId,
    summary,
  });
}

export async function createSettlementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = settlementSchema.safeParse({
    rentalId: formData.get("rentalId"),
    ownerId: formData.get("ownerId"),
    period: formData.get("period"),
    grossAmount: formData.get("grossAmount"),
    feePercent: formData.get("feePercent"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // The rental and the owner must belong to this organization (the id alone is
  // never enough). Owner is also validated as client type `propietario`.
  const [rental] = await db
    .select({ id: settlements.rentalId })
    .from(settlements)
    .limit(1);
  const [owner] = await db
    .select({ id: clients.id, type: clients.type })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, org.id),
        eq(clients.id, parsed.data.ownerId),
      ),
    )
    .limit(1);
  if (!owner || owner.type !== "propietario") {
    return { success: false, errors: { ownerId: ["El propietario no existe"] } };
  }

  const [rentalRow] = await db
    .select({ id: rentals.id, currency: rentals.currency })
    .from(rentals)
    .where(
      and(
        eq(rentals.organizationId, org.id),
        eq(rentals.id, parsed.data.rentalId),
      ),
    )
    .limit(1);
  if (!rentalRow) {
    return { success: false, errors: { rentalId: ["El alquiler no existe"] } };
  }

  // One settlement per contract and period.
  const [existing] = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(
      and(
        eq(settlements.organizationId, org.id),
        eq(settlements.rentalId, rentalRow.id),
        eq(settlements.period, parsed.data.period),
      ),
    )
    .limit(1);
  if (existing) {
    return {
      success: false,
      message: `Ya existe una liquidación para ${parsed.data.period} sobre este alquiler`,
    };
  }

  const feePercent = parsed.data.feePercent ?? 0;
  const [created] = await db
    .insert(settlements)
    .values({
      organizationId: org.id,
      rentalId: rentalRow.id,
      propertyId: rentalRow.propertyId ?? null,
      ownerClientId: owner.id,
      period: parsed.data.period,
      grossAmount: parsed.data.grossAmount,
      feePercent,
      currency: rentalRow.currency,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: settlements.id });

  const label = (await getRentalLabel(org.id, rentalRow.id)) ?? "Alquiler";
  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.created",
    settlementId: created.id,
    summary: `${label} · ${parsed.data.period}`,
  });

  revalidatePath("/liquidaciones");
  revalidatePath("/dashboard");
  redirect(`/liquidaciones/${created.id}`);
}

export async function updateSettlementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");
  const settlement = id ? await getOrgSettlement(org.id, id) : null;
  if (!settlement) {
    redirect("/liquidaciones");
  }

  if (settlement.status !== "pendiente") {
    return { success: false, message: "Solo se editan liquidaciones pendientes" };
  }

  const parsed = settlementSchema.safeParse({
    rentalId: formData.get("rentalId"),
    ownerId: formData.get("ownerId"),
    period: formData.get("period"),
    grossAmount: formData.get("grossAmount"),
    feePercent: formData.get("feePercent"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [owner] = await db
    .select({ id: clients.id, type: clients.type })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, org.id),
        eq(clients.id, parsed.data.ownerId),
      ),
    )
    .limit(1);
  if (!owner || owner.type !== "propietario") {
    return { success: false, errors: { ownerId: ["El propietario no existe"] } };
  }

  const [rentalRow] = await db
    .select({ id: rentals.id, currency: rentals.currency })
    .from(rentals)
    .where(
      and(
        eq(rentals.organizationId, org.id),
        eq(rentals.id, parsed.data.rentalId),
      ),
    )
    .limit(1);
  if (!rentalRow) {
    return { success: false, errors: { rentalId: ["El alquiler no existe"] } };
  }

  const [existing] = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(
      and(
        eq(settlements.organizationId, org.id),
        eq(settlements.rentalId, rentalRow.id),
        eq(settlements.period, parsed.data.period),
        eq(settlements.id, id),
      ),
    )
    .limit(1);
  if (!existing) {
    const [duplicate] = await db
      .select({ id: settlements.id })
      .from(settlements)
      .where(
        and(
          eq(settlements.organizationId, org.id),
          eq(settlements.rentalId, rentalRow.id),
          eq(settlements.period, parsed.data.period),
        ),
      )
      .limit(1);
    if (duplicate) {
      return {
        success: false,
        message: `Ya existe una liquidación para ${parsed.data.period} sobre este alquiler`,
      };
    }
  }

  await db
    .update(settlements)
    .set({
      rentalId: rentalRow.id,
      propertyId: rentalRow.propertyId ?? null,
      ownerClientId: owner.id,
      period: parsed.data.period,
      grossAmount: parsed.data.grossAmount,
      feePercent: parsed.data.feePercent ?? 0,
      currency: rentalRow.currency,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(settlements.id, settlement.id));

  const label = (await getRentalLabel(org.id, rentalRow.id)) ?? "Alquiler";
  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.updated",
    settlementId: settlement.id,
    summary: `${label} · ${parsed.data.period}`,
  });

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${settlement.id}`);
  redirect(`/liquidaciones/${settlement.id}`);
}

export async function addSettlementExpenseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const settlementId = String(formData.get("settlementId") ?? "");
  const settlement = settlementId ? await getOrgSettlement(org.id, settlementId) : null;
  if (!settlement) {
    return { success: false, message: "La liquidación no existe" };
  }
  if (settlement.status !== "pendiente") {
    return { success: false, message: "Solo se agregan ítems a liquidaciones pendientes" };
  }

  const parsed = settlementExpenseSchema.safeParse({
    concept: formData.get("concept"),
    amount: formData.get("amount"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(settlementExpenses).values({
    organizationId: org.id,
    settlementId: settlement.id,
    concept: parsed.data.concept,
    amount: parsed.data.amount,
    type: parsed.data.type,
  });

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.expense_added",
    settlementId: settlement.id,
    summary: parsed.data.concept,
  });

  revalidatePath(`/liquidaciones/${settlement.id}`);
  return { success: true, message: "Ítem agregado" };
}

export async function updateSettlementExpenseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const [expense] = await db
    .select()
    .from(settlementExpenses)
    .where(
      and(
        eq(settlementExpenses.id, id),
        eq(settlementExpenses.organizationId, org.id),
      ),
    )
    .limit(1);
  if (!expense) {
    return { success: false, message: "El ítem no existe" };
  }

  const settlement = await getOrgSettlement(org.id, expense.settlementId);
  if (!settlement || settlement.status !== "pendiente") {
    return { success: false, message: "El ítem no se puede editar" };
  }

  const parsed = settlementExpenseSchema.safeParse({
    concept: formData.get("concept"),
    amount: formData.get("amount"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(settlementExpenses)
    .set({
      concept: parsed.data.concept,
      amount: parsed.data.amount,
      type: parsed.data.type,
      updatedAt: new Date(),
    })
    .where(eq(settlementExpenses.id, expense.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.expense_updated",
    settlementId: expense.settlementId,
    summary: parsed.data.concept,
  });

  revalidatePath(`/liquidaciones/${settlement.id}`);
  return { success: true, message: "Ítem actualizado" };
}

export async function deleteSettlementExpenseAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  const [expense] = await db
    .select()
    .from(settlementExpenses)
    .where(
      and(
        eq(settlementExpenses.id, id),
        eq(settlementExpenses.organizationId, org.id),
      ),
    )
    .limit(1);
  if (!expense) {
    redirect("/liquidaciones");
  }

  const settlement = await getOrgSettlement(org.id, expense.settlementId);
  if (!settlement || settlement.status !== "pendiente") {
    redirect(`/liquidaciones/${settlement?.id ?? "liquidaciones"}`);
  }

  await db
    .delete(settlementExpenses)
    .where(eq(settlementExpenses.id, expense.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.expense_deleted",
    settlementId: expense.settlementId,
    summary: expense.concept,
  });

  revalidatePath(`/liquidaciones/${settlement.id}`);
  redirect(`/liquidaciones/${settlement.id}`);
}

export async function markSettlementPaidAction(
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
    return { success: false, message: "Solo owner o admin pueden confirmar pagos" };
  }

  const id = String(formData.get("id") ?? "");
  const settlement = id ? await getOrgSettlement(org.id, id) : null;
  if (!settlement) {
    return { success: false, message: "La liquidación no existe" };
  }
  if (settlement.status !== "pendiente") {
    return { success: false, message: "La liquidación ya está pagada" };
  }

  const parsed = settlementPaidSchema.safeParse({
    paidDate: formData.get("paidDate"),
    method: formData.get("method"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(settlements)
    .set({
      status: "pagada",
      paidDate: parsed.data.paidDate,
      paidMethod: parsed.data.method,
      updatedAt: new Date(),
    })
    .where(eq(settlements.id, settlement.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.paid",
    settlementId: settlement.id,
    summary: `${settlement.period} · ${parsed.data.method}`,
  });

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${settlement.id}`);
  redirect(`/liquidaciones/${settlement.id}`);
}

export async function deleteSettlementAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");
  const settlement = id ? await getOrgSettlement(org.id, id) : null;
  if (!settlement) {
    redirect("/liquidaciones");
  }

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/liquidaciones/${settlement.id}`);
  }
  if (settlement.status !== "pendiente") {
    redirect(`/liquidaciones/${settlement.id}`);
  }

  await db.delete(settlements).where(eq(settlements.id, settlement.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.deleted",
    settlementId: settlement.id,
    summary: `${settlement.period} · ${settlement.ownerClientId ?? "sin propietario"}`,
  });

  revalidatePath("/liquidaciones");
  redirect("/liquidaciones");
}

export async function generateSettlementDocumentAction(
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
  const settlement = await getSettlement(org.id, id);
  if (!settlement) {
    return { success: false, message: "La liquidación no existe" };
  }

  const expenses = await listExpenses(org.id, id);
  const summary = settlementSummary(settlement, expenses);

  const property = settlement.propertyId
    ? await getProperty(org.id, settlement.propertyId)
    : null;
  const owner = settlement.ownerClientId
    ? await getClient(org.id, settlement.ownerClientId)
    : null;

  const pdf = await buildSettlementPdf({
    organizationName: org.name,
    period: settlement.period,
    property: property
      ? {
          title: property.title,
          address: property.address,
          city: property.city,
          province: property.province,
        }
      : null,
    owner: owner
      ? { name: owner.name, email: owner.email, phone: owner.phone }
      : null,
    grossAmount: summary.gross,
    feePercent: Number(settlement.feePercent ?? 0),
    feeAmount: summary.feeAmount,
    expensesTotal: summary.expensesTotal,
    additionsTotal: summary.additionsTotal,
    net: summary.net,
    currency: settlement.currency,
    status: settlement.status,
    paidDate: settlement.paidDate,
    paidMethod: settlement.paidMethod,
    items: expenses.map((e) => ({
      concept: e.concept,
      amount: e.amount,
      type: e.type,
    })),
    notes: settlement.notes,
  });

  const storageKey = await saveDocumentFile(pdf, "pdf");

  let created: { id: string };
  try {
    const [inserted] = await db
      .insert(documents)
      .values({
        organizationId: org.id,
        title: `Liquidación ${settlement.period} — ${settlement.ownerName ?? "propietario"}`.slice(0, 120),
        type: "archivo",
        storageKey,
        mimeType: PDF_MIME_TYPE,
        sizeBytes: pdf.length,
        propertyId: settlement.propertyId ?? null,
        clientId: settlement.ownerClientId ?? null,
        rentalId: settlement.rentalId ?? null,
      })
      .returning({ id: documents.id });
    created = inserted;
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "settlement.document_generated",
    settlementId: settlement.id,
    summary: `PDF ${settlement.period}`,
  });

  revalidatePath(`/liquidaciones/${settlement.id}`);
  revalidatePath("/documentos");
  redirect(`/documentos/${created.id}`);
}
