"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { rentalPayments, rentals } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import { getRentalLabel } from "@/features/alquileres/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { paymentSchema } from "@/lib/validation";

import { getPayment } from "./data";

/** Rental existence is re-checked per action so a payment can never be
 * attached to another tenant's rental (the id being a UUID is not enough). */
async function getOrgRental(organizationId: string, rentalId: string) {
  const [rental] = await db
    .select()
    .from(rentals)
    .where(
      and(eq(rentals.organizationId, organizationId), eq(rentals.id, rentalId)),
    )
    .limit(1);
  return rental ?? null;
}

function parsePaymentForm(formData: FormData) {
  return paymentSchema.safeParse({
    amount: formData.get("amount"),
    paidDate: formData.get("paidDate"),
    method: formData.get("method") ?? undefined,
    notes: formData.get("notes"),
  });
}

async function audit(input: {
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  paymentId: string;
  summary: string;
}) {
  await logActivity({
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.action,
    entityType: "rental_payment",
    entityId: input.paymentId,
    summary: input.summary,
  });
}

export async function createPaymentAction(
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
  const rental = rentalId ? await getOrgRental(org.id, rentalId) : null;
  if (!rental) {
    return { success: false, message: "El alquiler no existe" };
  }

  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const [created] = await db
    .insert(rentalPayments)
    .values({
      organizationId: org.id,
      rentalId: rental.id,
      amount: parsed.data.amount,
      currency: rental.currency,
      paidDate: parsed.data.paidDate,
      method: parsed.data.method,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: rentalPayments.id });

  const label = (await getRentalLabel(org.id, rental.id)) ?? "Alquiler";
  await audit({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "payment.created",
    paymentId: created.id,
    summary: label,
  });

  revalidatePath(`/alquileres/${rental.id}`);
  redirect(`/alquileres/${rental.id}`);
}

export async function updatePaymentAction(
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
  const payment = id ? await getPayment(org.id, id) : null;
  if (!payment) {
    return { success: false, message: "El pago no existe" };
  }

  const role = await requireMembership(user.id, org.id);
  if (!hasRole(role, ["owner", "admin"])) {
    return { success: false, message: "No podés editar pagos" };
  }

  const parsed = parsePaymentForm(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(rentalPayments)
    .set({
      amount: parsed.data.amount,
      paidDate: parsed.data.paidDate,
      method: parsed.data.method,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(rentalPayments.id, payment.id), eq(rentalPayments.organizationId, org.id)),
    );

  const label = (await getRentalLabel(org.id, payment.rentalId)) ?? "Alquiler";
  await audit({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "payment.updated",
    paymentId: payment.id,
    summary: label,
  });

  revalidatePath(`/alquileres/${payment.rentalId}`);
  redirect(`/alquileres/${payment.rentalId}`);
}

export async function deletePaymentAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  const id = String(formData.get("id") ?? "");
  const payment = id ? await getPayment(org.id, id) : null;
  if (!payment) {
    redirect("/alquileres");
  }

  if (!hasRole(role, ["owner", "admin"])) {
    redirect(`/alquileres/${payment.rentalId}`);
  }

  await db
    .delete(rentalPayments)
    .where(
      and(
        eq(rentalPayments.id, payment.id),
        eq(rentalPayments.organizationId, org.id),
      ),
    );

  const label = (await getRentalLabel(org.id, payment.rentalId)) ?? "Alquiler";
  await audit({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "payment.deleted",
    paymentId: payment.id,
    summary: label,
  });

  revalidatePath(`/alquileres/${payment.rentalId}`);
  redirect(`/alquileres/${payment.rentalId}`);
}
