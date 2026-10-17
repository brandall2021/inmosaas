/** Document rules shared by the upload form (client) and the storage layer. */

import type { DocumentType } from "@/db/schema";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "docx",
  "odt",
  "xlsx",
  "txt",
] as const;

export type AllowedDocumentExtension =
  (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number];

export const DOCUMENT_MIME_BY_EXTENSION: Record<
  AllowedDocumentExtension,
  string
> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};

export const ACCEPTED_DOCUMENT_ATTRIBUTE = ALLOWED_DOCUMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

export const DOCUMENT_EXTENSIONS_LABEL = "PDF, DOCX, ODT, XLSX o TXT";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  contrato_alquiler: "Contrato de alquiler",
  propuesta: "Propuesta",
  archivo: "Archivo",
};

export const DOCUMENT_TYPE_FILTER_OPTIONS: {
  value: DocumentType;
  label: string;
}[] = (Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABELS[value],
}));

export const PDF_MIME_TYPE = "application/pdf";

export function extensionOf(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isAllowedDocumentExtension(
  extension: string,
): extension is AllowedDocumentExtension {
  return (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(
    extension,
  );
}
