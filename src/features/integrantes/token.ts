import { createHash, randomBytes } from "node:crypto";

/**
 * Invite token helpers — same pattern as sessions: the browser only ever sees
 * a random opaque token; the database stores its SHA-256 hash, so a leaked
 * row cannot be replayed as a valid invitation.
 */

export const INVITE_TTL_DAYS = 7;

const INVITE_TTL_MS = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newInviteToken(): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashInviteToken(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  };
}
