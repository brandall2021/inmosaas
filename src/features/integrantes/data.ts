import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  invites,
  memberships,
  organizations,
  users,
  type InviteStatus,
  type MembershipRole,
} from "@/db/schema";

import { hashInviteToken } from "./token";

export type MemberRow = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: MembershipRole;
  joinedAt: Date;
};

export type PendingInviteRow = {
  id: string;
  email: string;
  role: MembershipRole;
  expiresAt: Date;
  createdAt: Date;
};

/** Pending invite resolved through a raw token (the shared link). */
export type InviteSnapshot = {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: MembershipRole;
  expiresAt: Date;
  status: InviteStatus;
};

const ROLES_ORDER: Record<MembershipRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

/** Every member of the organization, owners first, then by join date. */
export async function listMembers(
  organizationId: string,
): Promise<MemberRow[]> {
  const rows = await db
    .select({
      membershipId: memberships.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, organizationId));

  return rows.sort(
    (a, b) =>
      ROLES_ORDER[a.role] - ROLES_ORDER[b.role] ||
      a.joinedAt.getTime() - b.joinedAt.getTime(),
  );
}

/** Still-pending and not-yet-expired invitations of the organization. */
export async function listPendingInvites(
  organizationId: string,
): Promise<PendingInviteRow[]> {
  return db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
      createdAt: invites.createdAt,
    })
    .from(invites)
    .where(
      and(
        eq(invites.organizationId, organizationId),
        eq(invites.status, "pending"),
        gt(invites.expiresAt, sql`now()`),
      ),
    );
}

/** Number of owners — used to guard the last-owner protection. */
export async function countOwners(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.role, "owner"),
      ),
    );

  return row?.value ?? 0;
}

/**
 * Resolves a raw token from the shared link into the invite it belongs to.
 * Only pending, non-expired invites are returned; anything else comes back as
 * `null` so the page can show a generic "invalid invitation" without leaking
 * organization details.
 */
export async function getPendingInviteByToken(
  token: string,
): Promise<InviteSnapshot | null> {
  if (!token || token.length > 200) {
    return null;
  }

  const [row] = await db
    .select({
      id: invites.id,
      organizationId: invites.organizationId,
      organizationName: organizations.name,
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
      status: invites.status,
    })
    .from(invites)
    .innerJoin(
      organizations,
      eq(organizations.id, invites.organizationId),
    )
    .where(
      and(
        eq(invites.tokenHash, hashInviteToken(token)),
        eq(invites.status, "pending"),
        gt(invites.expiresAt, sql`now()`),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** True when the user with that email is already a member of the org. */
export async function isAlreadyMember(
  organizationId: string,
  email: string,
): Promise<boolean> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(users.email, email),
      ),
    );

  return (row?.value ?? 0) > 0;
}
