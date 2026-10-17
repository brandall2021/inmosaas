import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DocumentUploadForm } from "@/features/documentos/components/document-upload-form";
import {
  listDocumentClientOptions,
  listDocumentPropertyOptions,
  listDocumentRentalOptions,
} from "@/features/documentos/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NuevoDocumentoPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const [propertyOptions, clientOptions, rentalOptions] = await Promise.all([
    listDocumentPropertyOptions(org.id),
    listDocumentClientOptions(org.id),
    listDocumentRentalOptions(org.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/documentos"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <DocumentUploadForm
        propertyOptions={propertyOptions}
        clientOptions={clientOptions}
        rentalOptions={rentalOptions}
      />
    </div>
  );
}
