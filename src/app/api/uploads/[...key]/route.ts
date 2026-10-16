import { getPropertyImageByKey } from "@/features/properties/data";
import { getActiveOrganization, getCurrentUser } from "@/lib/dal";
import { readImage } from "@/lib/storage";

/**
 * Serves a stored image only to members of the organization that owns it.
 * The URL is not enough: the session cookie is required, so one tenant can
 * never read another tenant's photos.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const org = await getActiveOrganization();
  if (!org) {
    return new Response(null, { status: 403 });
  }

  const { key } = await params;
  const storageKey = key.join("/");

  const owned = await getPropertyImageByKey(org.id, storageKey);
  if (!owned) {
    return new Response(null, { status: 404 });
  }

  const file = await readImage(storageKey);
  if (!file) {
    return new Response(null, { status: 404 });
  }

  const body = new Blob([new Uint8Array(file.data)], {
    type: file.contentType,
  });

  return new Response(body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.data.byteLength),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
