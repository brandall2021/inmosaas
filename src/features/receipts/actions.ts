"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  documents,
  receipts,
  rentals,
} from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { saveDocumentFile, deleteDocumentFile } from "@/lib/storage";
import { PDF_MIME_TYPE } from "@/features/documentos/document-constants";
import { buildReceiptPdf } from "@/features/documentos/pdf/receipt";
import {
  receiptSchema,
  receiptPaidSchema,
  receiptVoidSchema,
} from "@/lib/validation";

async function getOrgReceipt(organizationId: string, receiptId: string) {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(
      and(
        eq(receipts.organizationId, organizationId),
        eq(receipts.id, receiptId),
      ),
    )
    .limit(1);
  return receipt ?? null;
}

function auditInput({
  organizationId,
  actorId,
  actorName,
  action,
  receiptId,
  summary,
}: {
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  receiptId: string;
  summary: string;
}) {
  return logActivity({
    organizationId,
    actorId,
    actorName,
    action,
    entityType: "receipt",
    entityId: receiptId,
    summary,
  });
}

export async function createReceiptAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = receiptSchema.safeParse({
    clientId: formData.get("clientId"),
    rentalId: formData.get("rentalId"),
    period: formData.get("period"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    method: formData.get("method"),
    issuedDate: formData.get("issuedDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // The client must belong to this organization and be of type inquilino or
  // propietario. The rental, if present, must belong to this organization.
  const [client] = await db
    .select({ id: clients.id, name: clients.name, type: clients.type })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, org.id),
        eq(clients.id, parsed.data.clientId),
      ),
    )
    .limit(1);
  if (!client || (client.type !== "inquilino" && client.type !== "propietario")) {
    return {
      success: false,
      errors: { clientId: ["El cliente debe ser inquilino o propietario"] },
    };
  }

  let rentalCurrency = parsed.data.currency;
  const rentalId = parsed.data.rentalId ?? null;
  if (rentalId) {
    const [rentalRow] = await db
      .select({ id: rentals.id, currency: rentals.currency })
      .from(rentals)
      .where(
        and(
          eq(rentals.organizationId, org.id),
          eq(rentals.id, rentalId),
        ),
      )
      .limit(1);
    if (!rentalRow) {
      return { success: false, errors: { rentalId: ["El alquiler no existe"] } };
    }
    rentalCurrency = rentalRow.currency;
  }

  const [existing] = await db
    .select({ id: receipts.id })
    .from(receipts)
    .where(
      and(
        eq(receipts.organizationId, org.id),
        eq(receipts.clientId, client.id),
        eq(receipts.period, parsed.data.period),
        eq(receipts.status, "emitido"),
      ),
    )
    .limit(1);
  if (existing) {
    return {
      success: false,
      message: `Ya existe un recibo emitido para ${parsed.data.period} a este cliente`,
    };
  }

  // Generate the PDF receipt document first.
  const pdfData = {
    organizationName: org.name,
    period: parsed.data.period,
    client: {
      name: client.name,
      type: client.type,
    },
    propertyTitle: null as string | null,
    amount: parsed.data.amount,
    currency: rentalCurrency,
    method: parsed.data.method,
    issuedDate: parsed.data.issuedDate,
    paidDate: null,
    status: "emitido",
    notes: parsed.data.notes ?? null,
  };

  const pdf = await buildReceiptPdf(pdfData);
  const storageKey = await saveDocumentFile(pdf, "pdf");

  let createdDocument: { id: string };
  try {
    const [inserted] = await db
      .insert(documents)
      .values({
        organizationId: org.id,
        title: `Recibo ${parsed.data.period} — ${client.name ?? "cliente"}`.slice(0, 120),
        type: "archivo",
        storageKey,
        mimeType: PDF_MIME_TYPE,
        sizeBytes: pdf.length,
        clientId: client.id,
        rentalId,
      })
      .returning({ id: documents.id });
    createdDocument = inserted;
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }

  const [created] = await db
    .insert(receipts)
    .values({
      organizationId: org.id,
      clientId: client.id,
      rentalId,
      documentId: createdDocument.id,
      period: parsed.data.period,
      amount: parsed.data.amount,
      currency: rentalCurrency,
      method: parsed.data.method,
      issuedDate: parsed.data.issuedDate,
      status: "emitido",
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: receipts.id });

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "receipt.created",
    receiptId: created.id,
    summary: `${client.name} · ${parsed.data.period}`,
  });

  revalidatePath("/recibos");
  revalidatePath("/dashboard");
  redirect(`/recibos/${created.id}`);
}

export async function markReceiptPaidAction(
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
    return { success: false, message: "Solo owner o admin pueden marcar pagos" };
  }

  const id = String(formData.get("id") ?? "");
  const receipt = id ? await getOrgReceipt(org.id, id) : null;
  if (!receipt) {
    return { success: false, message: "El recibo no existe" };
  }
  if (receipt.status !== "emitido") {
    return { success: false, message: "Solo se pueden pagar recibos emitidos" };
  }

  const parsed = receiptPaidSchema.safeParse({
    paidDate: formData.get("paidDate"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(receipts)
    .set({
      status: "pagado",
      paidDate: parsed.data.paidDate ?? new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(eq(receipts.id, receipt.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "receipt.paid",
    receiptId: receipt.id,
    summary: `${receipt.period} · ${receipt.amount}`,
  });

  revalidatePath("/recibos");
  revalidatePath(`/recibos/${receipt.id}`);
  redirect(`/recibos/${receipt.id}`);
}

export async function voidReceiptAction(
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
    return { success: false, message: "Solo owner o admin pueden anular recibos" };
  }

  const id = String(formData.get("id") ?? "");
  const receipt = id ? await getOrgReceipt(org.id, id) : null;
  if (!receipt) {
    return { success: false, message: "El recibo no existe" };
  }
  if (receipt.status !== "emitido") {
    return { success: false, message: "Solo se pueden anular recibos emitidos" };
  }

  const parsed = receiptVoidSchema.safeParse({
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(receipts)
    .set({
      status: "anulado",
      notes: parsed.data.reason
        ? `${receipt.notes ?? ""} | Anulación: ${parsed.data.reason}`.trim()
        : receipt.notes,
      updatedAt: new Date(),
    })
    .where(eq(receipts.id, receipt.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "receipt.voided",
    receiptId: receipt.id,
    summary: `${receipt.period} · ${receipt.amount}`,
  });

  revalidatePath("/recibos");
  revalidatePath(`/recibos/${receipt.id}`);
  redirect(`/recibos/${receipt.id}`);
}

export async function deleteReceiptAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");
  const receipt = id ? await getOrgReceipt(org.id, id) : null;
  if (!receipt) {
    redirect("/recibos");
  }

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/recibos/${receipt.id}`);
  }
  if (receipt.status !== "emitido") {
    redirect(`/recibos/${receipt.id}`);
  }

  // Delete the linked document file if any.
  if (receipt.documentId) {
    const [documentRow] = await db
      .select({ storageKey: documents.storageKey })
      .from(documents)
      .where(
        and(
          eq(documents.id, receipt.documentId),
          eq(documents.organizationId, org.id),
        ),
      )
      .limit(1);
    if (documentRow) {
      await db
        .delete(documents)
        .where(
          and(
            eq(documents.id, receipt.documentId),
            eq(documents.organizationId, org.id),
          ),
        );
      await deleteDocumentFile(documentRow.storageKey);
    }
  }

  await db.delete(receipts).where(eq(receipts.id, receipt.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "receipt.deleted",
    receiptId: receipt.id,
    summary: `${receipt.period} · ${receipt.clientId ?? "sin cliente"}`,
  });

  revalidatePath("/recibos");
  redirect("/recibos");
}
