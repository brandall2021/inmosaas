import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";

import { and, eq, gt, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { connection } from "next/server";

import { db } from "@/db";
import { sessions } from "@/db/schema";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type SessionData = {
  id: string;
  userId: string;
  activeOrganizationId: string | null;
  expiresAt: Date;
};

/**
 * Only the hash of the token is stored server-side. The browser holds the raw
 * token, so a leaked database row cannot be replayed as a valid session.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  activeOrganizationId: string | null,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    activeOrganizationId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Reads the session for the current request. Memoized with React `cache` so
 * repeated calls within a render pass hit the database at most once.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  // Reading the session is inherently per-request. `connection()` forces the
  // surrounding route out of prerendering before any database access, so
  // libraries that touch the wall clock (e.g. the embedded PGlite engine
  // initialising) don't trip Next.js' unstable-value guard.
  await connection();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const [row] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        // Evaluate expiry in the database so this render-time read does not
        // depend on the wall clock (Next.js forbids unstable values like
        // `Date.now()` while prerendering).
        gt(sessions.expiresAt, sql`now()`),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    activeOrganizationId: row.activeOrganizationId,
    expiresAt: row.expiresAt,
  };
});

export async function setActiveOrganization(
  sessionId: string,
  organizationId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ activeOrganizationId: organizationId })
    .where(eq(sessions.id, sessionId));
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Housekeeping helper to drop expired sessions. */
export async function pruneExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
