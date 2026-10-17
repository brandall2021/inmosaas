import { Badge } from "@/components/ui/badge";
import type { DocumentType } from "@/db/schema";
import { DOCUMENT_TYPE_LABELS } from "../document-constants";

const variantByType: Record<
  DocumentType,
  "default" | "secondary" | "outline"
> = {
  contrato_alquiler: "default",
  propuesta: "secondary",
  archivo: "outline",
};

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  return (
    <Badge variant={variantByType[type]}>{DOCUMENT_TYPE_LABELS[type]}</Badge>
  );
}
