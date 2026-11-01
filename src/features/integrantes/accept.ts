import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { invites, memberships, sessions } from "@/db/schema";
import { logActivity } from "@/features/configuracion/data";
import { setActiveOrganization } from "@/lib/session";

import { hashInviteToken } from "./token";

type InviteUser = { id: string; email: string; sessionId: string };

/**
 * Joins the signed-in user to the organization of a pending invite. Single
 * use: the invite is only consumable while it is `pending` and not expired.
 * The matching of the invitation email is case-insensitive to absorb typos.
 */
export async function acceptInvite(
  token: string,
  user: InviteUser,
): Promise<
  { ok: true; organizationId: string } | { ok: false; reason: "invalid" | "email_mismatch" }
> {
  const [invite] = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.tokenHash, hashInviteToken(token)),
        eq(invites.status, "pending"),
        gt(invites.expiresAt, sql`now()`),
      ),
    )
    .limit(1);

  if (!invite) {
    return { ok: false, reason: "invalid" };
  }

  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }

  await concedeInvite(invite, user.id);

  // The inviting organization becomes the new member's active one.
  await setActiveOrganization(user.sessionId, invite.organizationId);

  return { ok: true, organizationId: invite.organizationId };
}

/**
 * Signup variant: a brand-new user has no session yet, so the invite is
 * consumed at account creation time and the organization id is returned for
 * the freshly created session. Returns `null` when the invite is invalid,
 * expired, used or the emails do not match — the caller falls back to the
 * create-your-own-organization behaviour.
 */
export async function acceptSignupInvite(
  token: string,
  email: string,
  invitedUser: { id: string; name: string },
): Promise<string | null> {
  const [invite] = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.tokenHash, hashInviteToken(token)),
        eq(invites.status, "pending"),
        gt(invites.expiresAt, sql`now()`),
      ),
    )
    .limit(1);

  if (!invite || email.toLowerCase() !== invite.email.toLowerCase()) {
    return null;
  }

  await concedeInvite(invite, invitedUser.id);

  return invite.organizationId;
}

/** Creates (or keeps) the membership and marks the invite as accepted. */
async function concedeInvite(
  invite: typeof invites.$inferSelect,
  userId: string,
): Promise<void> {
  // Already a member (e.g. re-clicked the link): keep the invited role.
  await db
    .insert(memberships)
    .values({
      userId,
      organizationId: invite.organizationId,
      role: invite.role,
    })
    .onConflictDoNothing({
      target: [memberships.userId, memberships.organizationId],
    });

  await db
    .update(invites)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(invites.id, invite.id));

  await logActivity({
    organizationId: invite.organizationId,
    actorId: userId,
    actorName: null,
    action: "invite.accepted",
    entityType: "invite",
    entityId: invite.id,
    summary: invite.email,
  });
}

/**
 * Drops the removed member's active-organization pointer (without deleting
 * the session) so their next render resolves to "no active organization".
 */
export async function clearActiveOrganizationForUser(
  userId: string,
  organizationId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ activeOrganizationId: null })
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.activeOrganizationId, organizationId),
      ),
    );
}
