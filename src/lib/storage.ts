import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { isAllowedImageType } from "@/features/properties/image-constants";

/**
 * Local filesystem storage. Uploads live outside `public/` and are read back
 * through an authenticated route handler, so binaries are never served to
 * tenants that do not own them. Swap this module for object storage later
 * without touching callers.
 */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|gif)$/;

function uploadDir(): string {
  return (
    process.env.UPLOAD_DIR ??
    path.join(/*turbopackIgnore: true*/ process.cwd(), ".uploads")
  );
}

/** Guards against path traversal before any key reaches the filesystem. */
export function isSafeImageKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

export async function saveImage(
  data: Buffer,
  contentType: string,
): Promise<string> {
  if (!isAllowedImageType(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const key = `${randomUUID()}.${EXTENSION_BY_TYPE[contentType]}`;
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, key), data);
  return key;
}

export async function readImage(
  key: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!isSafeImageKey(key)) {
    return null;
  }

  const extension = key.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return null;
  }

  try {
    const data = await readFile(
      path.join(/*turbopackIgnore: true*/ uploadDir(), key),
    );
    return { data, contentType };
  } catch {
    return null;
  }
}

export async function deleteImage(key: string): Promise<void> {
  if (!isSafeImageKey(key)) {
    return;
  }

  try {
    await unlink(path.join(/*turbopackIgnore: true*/ uploadDir(), key));
  } catch {
    // A missing file is not an error: the row is the source of truth.
  }
}
