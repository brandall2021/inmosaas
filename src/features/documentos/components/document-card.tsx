import Link from "next/link";
import { Building2, FileText, User } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { formatFileSize, formatDateTime } from "../constants";
import { DocumentTypeBadge } from "./document-type-badge";
import type { DocumentRow } from "../data";

export function DocumentCard({ row }: { row: DocumentRow }) {
  const { document } = row;

  const subject =
    row.propertyTitle ??
    row.clientName ??
    row.rentalPropertyTitle ??
    row.rentalClientName ??
    null;

  const Icon = row.propertyTitle ? Building2 : row.clientName ? User : FileText;

  return (
    <Link href={`/documentos/${document.id}`} className="block">
      <Card className="h-full transition-colors hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-base font-medium">
                {document.title}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">
                  {subject ?? "Sin entidad vinculada"}
                </span>
              </p>
            </div>
            <DocumentTypeBadge type={document.type} />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="truncate">{formatDateTime(document.createdAt)}</span>
          <span className="shrink-0">{formatFileSize(document.sizeBytes)}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
