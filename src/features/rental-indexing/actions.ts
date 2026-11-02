"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { rentals } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { RentalIndexType } from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";

import {
  applyIndexAdjustment,
  closeRentHistorySnapshot,
  createRentHistorySnapshot,
  markPenaltyPaid,
  recordPenalty,
} from "./data";

async function getOrgRental(organizationId: string, rentalId: string) {
  const [rental] = await db
    .select()
    .from(rentals)
    .where(
      and(
        eq(rentals.organizationId, organizationId),
        eq(rentals.id, rentalId),
      ),
    )
    .limit(1);
  return rental ?? null;
}

function auditInput({
  organizationId,
  actorId,
  actorName,
  action,
  rentalId,
  summary,
}: {
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  rentalId: string;
  summary: string;
}) {
  return logActivity({
    organizationId,
    actorId,
    actorName,
    action,
    entityType: "rental_index",
    entityId: rentalId,
    summary,
  });
}

export async function setRentalIndexingAction(
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
    return { success: false, message: "Solo owner o admin pueden configurar el índice" };
  }

  const id = String(formData.get("id") ?? "");
  const rental = id ? await getOrgRental(org.id, id) : null;
  if (!rental) {
    return { success: false, message: "El alquiler no existe" };
  }
  if (rental.status !== "vigente") {
    return { success: false, message: "Solo se puede configurar en alquileres vigentes" };
  }

  const indexType = String(formData.get("indexType") ?? "ninguno");
  const adjustmentDayRaw = String(formData.get("adjustmentDay") ?? "");
  const penaltyRateRaw = String(formData.get("penaltyRate") ?? "");

  const validIndexTypes = [
    "ninguno", "icl", "ipc", "casa_propia", "cer", "uva", "otro",
  ] as const;
  if (!validIndexTypes.includes(indexType as RentalIndexType)) {
    return { success: false, errors: { indexType: ["Tipo de índice inválido"] } };
  }

  let adjustmentDay: number | null = null;
  if (adjustmentDayRaw) {
    const d = Number(adjustmentDayRaw);
    if (!Number.isInteger(d) || d < 1 || d > 28) {
      return { success: false, errors: { adjustmentDay: ["Día inválido (1-28)"] } };
    }
    adjustmentDay = d;
  }

  let penaltyRate: number | null = null;
  if (penaltyRateRaw) {
    const p = Number(penaltyRateRaw);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      return { success: false, errors: { penaltyRate: ["Tasa inválida (0-100)"] } };
    }
    penaltyRate = p;
  }

  await db
    .update(rentals)
    .set({
      indexType: indexType as RentalIndexType,
      adjustmentDay,
      penaltyRate: penaltyRate !== null ? penaltyRate : undefined,
      updatedAt: new Date(),
    })
    .where(eq(rentals.id, rental.id));

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "rental.indexing_configured",
    rentalId: rental.id,
    summary: `índice ${indexType}, día ${adjustmentDay ?? "—"}, punitorio ${penaltyRate ?? "—"}%`,
  });

  revalidatePath(`/alquileres/${rental.id}`);
  redirect(`/alquileres/${rental.id}`);
}

export async function applyIndexAdjustmentAction(
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
    return { success: false, message: "Solo owner o admin pueden aplicar ajustes" };
  }

  const id = String(formData.get("id") ?? "");
  const rental = id ? await getOrgRental(org.id, id) : null;
  if (!rental) {
    return { success: false, message: "El alquiler no existe" };
  }

  const indexType = String(formData.get("indexType") ?? "");
  const baseIndexValueRaw = String(formData.get("baseIndexValue") ?? "");
  const newIndexValueRaw = String(formData.get("newIndexValue") ?? "");
  const previousRentRaw = String(formData.get("previousRent") ?? "");
  const newRentRaw = String(formData.get("newRent") ?? "");
  const appliedDate = String(formData.get("appliedDate") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const validIndexTypes = [
    "ninguno", "icl", "ipc", "casa_propia", "cer", "uva", "otro",
  ] as const;
  if (!validIndexTypes.includes(indexType as RentalIndexType)) {
    return { success: false, errors: { indexType: ["Tipo de índice inválido"] } };
  }

  const baseIndexValue = Number(baseIndexValueRaw);
  const newIndexValue = Number(newIndexValueRaw);
  const previousRent = Number(previousRentRaw);
  const newRent = Number(newRentRaw);

  if (!Number.isFinite(baseIndexValue) || baseIndexValue <= 0) {
    return { success: false, errors: { baseIndexValue: ["Valor base inválido"] } };
  }
  if (!Number.isFinite(newIndexValue) || newIndexValue <= 0) {
    return { success: false, errors: { newIndexValue: ["Valor nuevo inválido"] } };
  }
  if (!Number.isFinite(previousRent) || previousRent <= 0) {
    return { success: false, errors: { previousRent: ["Monto anterior inválido"] } };
  }
  if (!Number.isFinite(newRent) || newRent <= 0) {
    return { success: false, errors: { newRent: ["Monto nuevo inválido"] } };
  }
  if (!appliedDate) {
    return { success: false, errors: { appliedDate: ["Fecha requerida"] } };
  }

  // Cerrar snapshot vigente y crear uno nuevo con el monto ajustado.
  await closeRentHistorySnapshot(org.id, rental.id, appliedDate);
  await createRentHistorySnapshot({
    organizationId: org.id,
    rentalId: rental.id,
    rentAmount: newRent,
    currency: rental.currency,
    validFrom: appliedDate,
  });

  // Actualizar el canon vigente del alquiler.
  await db
    .update(rentals)
    .set({ rentAmount: newRent, updatedAt: new Date() })
    .where(eq(rentals.id, rental.id));

  await applyIndexAdjustment({
    organizationId: org.id,
    rentalId: rental.id,
    indexType: indexType as RentalIndexType,
    baseIndexValue,
    newIndexValue,
    previousRent,
    newRent,
    appliedDate,
    notes: notes || null,
  });

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "rental.index_applied",
    rentalId: rental.id,
    summary: `${indexType} ${previousRent} → ${newRent} (${appliedDate})`,
  });

  revalidatePath(`/alquileres/${rental.id}`);
  revalidatePath(`/alquileres/${rental.id}/ajustes`);
  redirect(`/alquileres/${rental.id}/ajustes`);
}

export async function recordPenaltyAction(
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
    return { success: false, message: "Solo owner o admin pueden registrar punitorios" };
  }

  const id = String(formData.get("id") ?? "");
  const rental = id ? await getOrgRental(org.id, id) : null;
  if (!rental) {
    return { success: false, message: "El alquiler no existe" };
  }

  const overdueAmountRaw = String(formData.get("overdueAmount") ?? "");
  const overdueDaysRaw = String(formData.get("overdueDays") ?? "");
  const dailyRateRaw = String(formData.get("dailyRate") ?? "");
  const calculatedDate = String(formData.get("calculatedDate") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const overdueAmount = Number(overdueAmountRaw);
  const overdueDays = Number(overdueDaysRaw);
  const dailyRate = Number(dailyRateRaw);

  if (!Number.isFinite(overdueAmount) || overdueAmount <= 0) {
    return { success: false, errors: { overdueAmount: ["Monto adeudado inválido"] } };
  }
  if (!Number.isInteger(overdueDays) || overdueDays <= 0) {
    return { success: false, errors: { overdueDays: ["Días de mora inválidos"] } };
  }
  if (!Number.isFinite(dailyRate) || dailyRate < 0 || dailyRate > 100) {
    return { success: false, errors: { dailyRate: ["Tasa diaria inválida (0-100)"] } };
  }
  if (!calculatedDate) {
    return { success: false, errors: { calculatedDate: ["Fecha requerida"] } };
  }

  const penaltyAmount = Math.round(
    (overdueAmount * dailyRate * overdueDays) / 100 * 100,
  ) / 100;

  await recordPenalty({
    organizationId: org.id,
    rentalId: rental.id,
    overdueAmount,
    overdueDays,
    dailyRate,
    penaltyAmount,
    calculatedDate,
    notes: notes || null,
  });

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "rental.penalty_recorded",
    rentalId: rental.id,
    summary: `punitorio ${penaltyAmount} (${overdueDays} días, ${dailyRate}% diario)`,
  });

  revalidatePath(`/alquileres/${rental.id}`);
  revalidatePath(`/alquileres/${rental.id}/ajustes`);
  redirect(`/alquileres/${rental.id}/ajustes`);
}

export async function markPenaltyPaidAction(
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
  const penaltyId = String(formData.get("penaltyId") ?? "");
  const paidDate = String(formData.get("paidDate") ?? "");

  if (!penaltyId) {
    return { success: false, message: "Punitorio no especificado" };
  }

  await markPenaltyPaid(org.id, penaltyId, paidDate || new Date().toISOString().split("T")[0]);

  await auditInput({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "rental.penalty_paid",
    rentalId: id,
    summary: `punitorio ${penaltyId} pagado`,
  });

  revalidatePath(`/alquileres/${id}`);
  revalidatePath(`/alquileres/${id}/ajustes`);
  redirect(`/alquileres/${id}/ajustes`);
}
