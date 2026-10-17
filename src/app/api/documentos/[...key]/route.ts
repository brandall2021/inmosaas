import { getDocumentByKey } from "@/features/documentos/data";
import { getActiveOrganization, getCurrentUser } from "@/lib/dal";
import { readDocumentFile } from "@/lib/storage";

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

/** Strips characters that can't be represented in a plain ASCII filename. */
function asciiFallback(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["\\]/g, "")
    .trim();

  return normalized || "documento";
}

/**
 * Serves a stored document only to members of the organization that owns it.
 * The URL alone is never enough: the session cookie is required, so one tenant
 * can never read another tenant's files.
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

  const owned = await getDocumentByKey(org.id, storageKey);
  if (!owned) {
    return new Response(null, { status: 404 });
  }

  const file = await readDocumentFile(storageKey);
  if (!file) {
    return new Response(null, { status: 404 });
  }

  const extension = EXTENSION_BY_MIME[file.contentType] ?? "bin";
  const fileName = `${owned.title}.${extension}`;
  const disposition = file.contentType === "application/pdf" ? "inline" : "attachment";
  const contentDisposition = `${disposition}; filename="${asciiFallback(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;

  const body = new Blob([new Uint8Array(file.data)], {
    type: file.contentType,
  });

  return new Response(body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.data.byteLength),
      "Content-Disposition": contentDisposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
