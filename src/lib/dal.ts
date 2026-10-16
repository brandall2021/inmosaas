import "server-only";

import { cache } from "react";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  memberships,
  organizations,
  users,
  type MembershipRole,
} from "@/db/schema";
import { getSession } from "@/lib/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  sessionId: string;
  activeOrganizationId: string | null;
};

export type UserOrganization = {
  id: string;
  name: string;
  slug: string;
  role: MembershipRole;
};

/**
 * Resolves the signed-in user from the session. Never trusts client input;
 * identity always originates from the server-side session cookie.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    ...user,
    sessionId: session.id,
    activeOrganizationId: session.activeOrganizationId,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export const getUserOrganizations = cache(
  async (userId: string): Promise<UserOrganization[]> => {
    return db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(
        organizations,
        eq(organizations.id, memberships.organizationId),
      )
      .where(eq(memberships.userId, userId));
  },
);

/**
 * The organization the user is currently acting within. Falls back to their
 * first membership when the session has no (or a stale) active tenant.
 */
export const getActiveOrganization = cache(
  async (): Promise<UserOrganization | null> => {
    const user = await requireUser();
    const orgs = await getUserOrganizations(user.id);
    if (orgs.length === 0) {
      return null;
    }
    return (
      orgs.find((org) => org.id === user.activeOrganizationId) ?? orgs[0]
    );
  },
);

/**
 * Authorization guard: confirms the user really belongs to the tenant they are
 * trying to act on, and returns their role. Redirects otherwise.
 */
export async function requireMembership(
  userId: string,
  organizationId: string,
): Promise<MembershipRole> {
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    redirect("/dashboard");
  }

  return membership.role;
}

export function hasRole(
  role: MembershipRole,
  allowed: readonly MembershipRole[],
): boolean {
  return allowed.includes(role);
}
