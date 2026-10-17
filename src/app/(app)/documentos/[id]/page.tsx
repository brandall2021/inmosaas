import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Download,
  FileText,
  KeyRound,
  User,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteDocumentButton } from "@/features/documentos/components/delete-document-button";
import { DocumentTypeBadge } from "@/features/documentos/components/document-type-badge";
import { formatFileSize, formatDateTime } from "@/features/documentos/constants";
import {
  getDocument,
  documentRentalLabel,
} from "@/features/documentos/data";
import {
  getActiveOrganization,
  hasRole,
  requireMembership,
  requireUser,
} from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default async function DocumentoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const role = await requireMembership(user.id, org.id);
  const canDelete = hasRole(role, ["owner", "admin"]);

  const { id } = await params;
  const row = await getDocument(org.id, id);
  if (!row) {
    notFound();
  }

  const { document } = row;
  const rentalLabel = documentRentalLabel(row);

  const links: { key: string; icon: typeof Building2; label: string }[] = [];
  if (row.propertyTitle) {
    links.push({
      key: "property",
      icon: Building2,
      label: row.propertyTitle,
    });
  }
  if (row.clientName) {
    links.push({ key: "client", icon: User, label: row.clientName });
  }
  if (rentalLabel) {
    links.push({ key: "rental", icon: KeyRound, label: rentalLabel });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/documentos"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <DocumentTypeBadge type={document.type} />
          <h1 className="text-2xl font-semibold tracking-tight">
            {document.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/documentos/${document.storageKey}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Download className="size-4" />
            Descargar
          </a>
          {canDelete ? <DeleteDocumentButton id={document.id} /> : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <DetailRow
              label="Formato"
              value={<span className="uppercase">{document.mimeType}</span>}
            />
            <DetailRow
              label="Tamaño"
              value={formatFileSize(document.sizeBytes)}
            />
            <DetailRow
              label="Creado"
              value={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {formatDateTime(document.createdAt)}
                </span>
              }
            />
            <DetailRow
              label="Vence"
              value={
                document.expiresAt ? (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-muted-foreground" />
                    {document.expiresAt}
                  </span>
                ) : null
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vinculado a</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="size-3.5" />
              Sin entidad vinculada
            </p>
          ) : (
            <ul className="space-y-2">
              {links.map((link) => (
                <li
                  key={link.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <link.icon className="size-4 text-muted-foreground" />
                  {link.label}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
