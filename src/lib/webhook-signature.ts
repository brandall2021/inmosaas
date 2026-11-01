import { createHmac } from "node:crypto";

/**
 * Pure signing helpers — no database, no `"server-only"` guard — so callers
 * outside the server runtime (like the HMAC unit tests) can import them.
 */

export const SIGNATURE_HEADER = "X-InmoSaaS-Signature";

/** HMAC-SHA256 over the raw request body, hex encoded. */
export function computeSignature(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

/**
 * True when the receiver-side recomputation matches the header value;
 * survives the `sha256=` prefix convention too.
 */
export function verifySignature(
  secret: string,
  body: string,
  header: string | undefined,
): boolean {
  if (!header) {
    return false;
  }
  const expected = computeSignature(secret, body);
  const received = header.replace(/^sha256=/, "").trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && a.equals(b);
}
