"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { invites, memberships, users, type MembershipRole } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import type { ActionState } from "@/lib/action-state";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { inviteSchema } from "@/lib/validation";

import {
  clearActiveOrganizationForUser,
  acceptInvite,
} from "./accept";
import { countOwners } from "./data";
import { newInviteToken } from "./token";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreateInviteResult = ActionState & { inviteUrl?: string };

/**
 * Owner/admin creates a single-use invitation. The raw token is part of the
 * link that is shown once (the UI offers copy + mailto); only the hash is
 * persisted.
 */
export async function createInviteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<CreateInviteResult> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  if (!hasRole(role, ["owner", "admin"])) {
    redirect("/dashboard");
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") ?? undefined,
  });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const inviteRole = parsed.data.role;

  // A still-pending invite for the same email exists: field error, no second
  // invite (also enforced by the partial unique index).
  const [pendingDupe] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        eq(invites.organizationId, org.id),
        eq(invites.email, email),
        eq(invites.status, "pending"),
      ),
    )
    .limit(1);

  if (pendingDupe) {
    return {
      success: false,
      errors: {
        email: ["Ese correo ya tiene una invitación pendiente"],
      },
    };
  }

  // Already part of the team.
  const [member] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.organizationId, org.id),
        eq(users.email, email),
      ),
    )
    .limit(1);

  if (member) {
    return {
      success: false,
      errors: { email: ["Esa persona ya es integrante de la organización"] },
    };
  }

  const { token, tokenHash, expiresAt } = newInviteToken();

  let created: { id: string } | undefined;
  try {
    // The partial unique index keeps a race from producing two pending
    // invites for the same email.
    [created] = await db
      .insert(invites)
      .values({
        organizationId: org.id,
        email,
        role: inviteRole,
        tokenHash,
        invitedBy: user.id,
        expiresAt,
      })
      .returning({ id: invites.id });
  } catch {
    created = undefined;
  }

  if (!created) {
    return {
      success: false,
      errors: { email: ["Ese correo ya tiene una invitación pendiente"] },
    };
  }

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "invite.created",
    entityType: "invite",
    entityId: created.id,
    summary: `${email} (${inviteRole})`,
  });

  revalidatePath("/configuracion/integrantes");

  return {
    success: true,
    message: "Invitación creada — compartí este enlace (no vuelve a mostrarse):",
    inviteUrl: `/invitacion/${token}`,
  };
}

/** Revokes a pending invite: the shared link stops working immediately. */
export async function revokeInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const role = await requireMembership(user.id, org.id);
  if (!hasRole(role, ["owner", "admin"])) {
    redirect("/dashboard");
  }

  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) {
    redirect("/configuracion/integrantes");
  }

  const [revoked] = await db
    .update(invites)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(
      and(
        eq(invites.id, id),
        eq(invites.organizationId, org.id),
        eq(invites.status, "pending"),
      ),
    )
    .returning({ id: invites.id, email: invites.email });

  if (revoked) {
    await logActivity({
      organizationId: org.id,
      actorId: user.id,
      actorName: user.name,
      action: "invite.revoked",
      entityType: "invite",
      entityId: revoked.id,
      summary: revoked.email,
    });
  }

  revalidatePath("/configuracion/integrantes");
  redirect("/configuracion/integrantes");
}

/** Owner/admin changes a member's role; the last owner cannot be degraded. */
export async function updateMemberRoleAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const actorRole = await requireMembership(user.id, org.id);
  if (!hasRole(actorRole, ["owner", "admin"])) {
    redirect("/dashboard");
  }

  const membershipId = String(formData.get("membershipId") ?? "");
  const targetRole = String(formData.get("role") ?? "") as MembershipRole;

  const failure = (message: string) =>
    redirect(`/configuracion/integrantes?error=${encodeURIComponent(message)}`);

  if (
    !UUID_PATTERN.test(membershipId) ||
    (targetRole !== "admin" && targetRole !== "member")
  ) {
    failure("Datos de la acción inválidos");
  }

  const [target] = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.organizationId, org.id),
      ),
    )
    .limit(1);

  if (!target) {
    failure("El integrante no pertenece a esta organización");
  }

  if (target.role === "owner") {
    const owners = await countOwners(org.id);
    if (owners <= 1) {
      failure(
        "No podés degradar al único owner de la organización: transferí primero el rol a otro integrante",
      );
    }
  }

  await db
    .update(memberships)
    .set({ role: targetRole })
    .where(eq(memberships.id, membershipId));

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "member.role_changed",
    entityType: "membership",
    entityId: membershipId,
    summary: `${target.role} → ${targetRole}`,
  });

  revalidatePath("/configuracion/integrantes");
  redirect("/configuracion/integrantes");
}

/** Owner/admin removes a member; the last owner cannot be removed. */
export async function removeMemberAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    redirect("/login");
  }

  const actorRole = await requireMembership(user.id, org.id);
  if (!hasRole(actorRole, ["owner", "admin"])) {
    redirect("/dashboard");
  }

  const membershipId = String(formData.get("membershipId") ?? "");

  const failure = (message: string) =>
    redirect(`/configuracion/integrantes?error=${encodeURIComponent(message)}`);

  if (!UUID_PATTERN.test(membershipId)) {
    failure("Datos de la acción inválidos");
  }

  const [target] = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.organizationId, org.id),
      ),
    )
    .limit(1);

  if (!target) {
    failure("El integrante no pertenece a esta organización");
  }

  if (target.role === "owner") {
    const owners = await countOwners(org.id);
    if (owners <= 1) {
      failure(
        "No podés remover al único owner de la organización: transferí primero el rol a otro integrante",
      );
    }
  }

  // The removed member keeps their session (they may belong to other
  // organizations); only this tenant pointer is cleared server-side.
  const [removedName] = await db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.id, membershipId))
    .limit(1);

  await db.delete(memberships).where(eq(memberships.id, membershipId));

  // The removed user's session must no longer act inside this tenant.
  await clearActiveOrganizationForUser(target.userId, org.id);

  await logActivity({
    organizationId: org.id,
    actorId: user.id,
    actorName: user.name,
    action: "member.removed",
    entityType: "membership",
    entityId: membershipId,
    summary: removedName?.email ?? "",
  });

  revalidatePath("/configuracion/integrantes");
  redirect("/configuracion/integrantes");
}

/**
 * Link-resolution entry point used by `/invitacion/[token]` for a user that
 * is already signed in. Kept as a server action wrapper so the page stays a
 * pure render component.
 */
export async function consumeInviteLink(
  token: string,
  sessionUser: { id: string; email: string; sessionId: string },
): Promise<{ ok: boolean; reason?: "invalid" | "email_mismatch" }> {
  const result = await acceptInvite(token, sessionUser);
  if (result.ok) {
    revalidatePath("/dashboard");
  }
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
}
