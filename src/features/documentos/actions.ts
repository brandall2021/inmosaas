"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { getRental } from "@/features/alquileres/data";
import { getClient } from "@/features/clients/data";
import { logActivity } from "@/features/configuracion/data";
import { getProperty } from "@/features/properties/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { deleteDocumentFile, saveDocumentFile } from "@/lib/storage";
import {
  contractGenerateSchema,
  documentUploadSchema,
  proposalGenerateSchema,
} from "@/lib/validation";
import { operationLabels, typeLabels } from "@/features/properties/constants";

import {
  DOCUMENT_EXTENSIONS_LABEL,
  DOCUMENT_MIME_BY_EXTENSION,
  MAX_DOCUMENT_BYTES,
  PDF_MIME_TYPE,
  extensionOf,
  isAllowedDocumentExtension,
} from "./document-constants";
import { getDocument } from "./data";
import { buildContractPdf } from "./pdf/contract";
import { buildProposalPdf } from "./pdf/proposal";

const NONE_VALUE = "none";

function optionalRef(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  return !value || value === NONE_VALUE ? undefined : value;
}

export async function createDocumentUploadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const parsed = documentUploadSchema.safeParse({
    title: formData.get("title"),
    propertyId: optionalRef(formData, "propertyId"),
    clientId: optionalRef(formData, "clientId"),
    rentalId: optionalRef(formData, "rentalId"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, errors: { file: ["Seleccioná un archivo"] } };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { success: false, errors: { file: ["El archivo supera el límite de 10 MB"] } };
  }

  const extension = extensionOf(file.name);
  if (!isAllowedDocumentExtension(extension)) {
    return {
      success: false,
      errors: { file: [`Formato no permitido (${DOCUMENT_EXTENSIONS_LABEL})`] },
    };
  }

  const mimeType = DOCUMENT_MIME_BY_EXTENSION[extension];
  if (file.type && file.type !== mimeType) {
    return {
      success: false,
      errors: { file: ["El tipo de archivo no coincide con su extensión"] },
    };
  }

  const { propertyId, clientId, rentalId } = parsed.data;
  const errors: Record<string, string[]> = {};

  if (propertyId && !(await getProperty(org.id, propertyId))) {
    errors.propertyId = ["La propiedad seleccionada no existe"];
  }
  if (clientId && !(await getClient(org.id, clientId))) {
    errors.clientId = ["El cliente seleccionado no existe"];
  }
  if (rentalId && !(await getRental(org.id, rentalId))) {
    errors.rentalId = ["El alquiler seleccionado no existe"];
  }
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const storageKey = await saveDocumentFile(
    Buffer.from(await file.arrayBuffer()),
    extension,
  );

  let created: { id: string };
  try {
    const [row] = await db
      .insert(documents)
      .values({
        organizationId: org.id,
        title: parsed.data.title,
        type: "archivo",
        storageKey,
        mimeType,
        sizeBytes: file.size,
        propertyId: propertyId ?? null,
        clientId: clientId ?? null,
        rentalId: rentalId ?? null,
      })
      .returning({ id: documents.id });
    created = row;
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "document.uploaded",
    entityType: "document",
    entityId: created.id,
    summary: parsed.data.title,
  });

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  redirect(`/documentos/${created.id}`);
}

export async function generateContractAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  await requireMembership(user.id, org.id);

  const rentalId = String(formData.get("rentalId") ?? "");
  const parsed = contractGenerateSchema.safeParse({
    additionalNotes: formData.get("additionalNotes"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const row = rentalId ? await getRental(org.id, rentalId) : null;
  if (!row) {
    return { success: false, message: "El alquiler no existe" };
  }

  const { rental } = row;
  const property = rental.propertyId
    ? await getProperty(org.id, rental.propertyId)
    : null;
  const client = rental.clientId
    ? await getClient(org.id, rental.clientId)
    : null;

  const pdf = await buildContractPdf({
    organizationName: org.name,
    property: property
      ? {
          address: property.address,
          city: property.city,
          province: property.province,
          areaM2: property.areaM2,
        }
      : null,
    client: client
      ? { name: client.name, email: client.email, phone: client.phone }
      : null,
    rentAmount: rental.rentAmount,
    currency: rental.currency,
    startDate: rental.startDate,
    endDate: rental.endDate,
    additionalNotes: parsed.data.additionalNotes ?? null,
  });

  const subject = [row.propertyTitle, row.clientName].filter(Boolean).join(" · ");
  const title = `Contrato de alquiler${subject ? ` - ${subject}` : ""}`.slice(0, 120);

  const storageKey = await saveDocumentFile(pdf, "pdf");

  let created: { id: string };
  try {
    const [inserted] = await db
      .insert(documents)
      .values({
        organizationId: org.id,
        title,
        type: "contrato_alquiler",
        storageKey,
        mimeType: PDF_MIME_TYPE,
        sizeBytes: pdf.length,
        propertyId: rental.propertyId ?? null,
        clientId: rental.clientId ?? null,
        rentalId: rental.id,
      })
      .returning({ id: documents.id });
    created = inserted;
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "document.contract_generated",
    entityType: "document",
    entityId: created.id,
    summary: title,
  });

  revalidatePath("/documentos");
  revalidatePath(`/alquileres/${rental.id}`);
  revalidatePath("/dashboard");
  redirect(`/documentos/${created.id}`);
}

export async function generateProposalAction(
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
  const parsed = proposalGenerateSchema.safeParse({
    clientId: optionalRef(formData, "clientId"),
    expiresAt: formData.get("expiresAt"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const property = propertyId ? await getProperty(org.id, propertyId) : null;
  if (!property) {
    return { success: false, message: "La propiedad no existe" };
  }

  const { clientId } = parsed.data;
  const client = clientId ? await getClient(org.id, clientId) : null;
  if (clientId && !client) {
    return { success: false, errors: { clientId: ["El cliente seleccionado no existe"] } };
  }

  const pdf = await buildProposalPdf({
    organizationName: org.name,
    property: {
      title: property.title,
      address: property.address,
      city: property.city,
      province: property.province,
      propertyTypeLabel: typeLabels[property.propertyType],
      operationLabel: operationLabels[property.operation],
      areaM2: property.areaM2,
      price: property.price,
      currency: property.currency,
    },
    recipient: client
      ? { name: client.name, email: client.email, phone: client.phone }
      : null,
    expiresAt: parsed.data.expiresAt ?? null,
    message: parsed.data.message ?? null,
  });

  const title = `Propuesta - ${property.title}`.slice(0, 120);

  const storageKey = await saveDocumentFile(pdf, "pdf");

  let created: { id: string };
  try {
    const [inserted] = await db
      .insert(documents)
      .values({
        organizationId: org.id,
        title,
        type: "propuesta",
        storageKey,
        mimeType: PDF_MIME_TYPE,
        sizeBytes: pdf.length,
        propertyId: property.id,
        clientId: client?.id ?? null,
        expiresAt: parsed.data.expiresAt ?? null,
      })
      .returning({ id: documents.id });
    created = inserted;
  } catch (error) {
    await deleteDocumentFile(storageKey);
    throw error;
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "document.proposal_generated",
    entityType: "document",
    entityId: created.id,
    summary: title,
  });

  revalidatePath("/documentos");
  revalidatePath(`/propiedades/${property.id}`);
  revalidatePath("/dashboard");
  redirect(`/documentos/${created.id}`);
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(id ? `/documentos/${id}` : "/documentos");
  }

  if (id) {
    const row = await getDocument(org.id, id);

    if (row) {
      const [deleted] = await db
        .delete(documents)
        .where(
          and(eq(documents.id, id), eq(documents.organizationId, org.id)),
        )
        .returning({ storageKey: documents.storageKey });

      if (deleted) {
        await deleteDocumentFile(deleted.storageKey);
        await logActivity({
          organizationId: org.id,
          actorId: user.id,
          actorName: user.name,
          action: "document.deleted",
          entityType: "document",
          entityId: id,
          summary: row.document.title,
        });
      }
    }
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  redirect("/documentos");
}
