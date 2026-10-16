/** Image rules shared by the upload form (client) and the storage layer. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const ACCEPTED_IMAGE_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(",");

export function isAllowedImageType(
  type: string,
): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}
