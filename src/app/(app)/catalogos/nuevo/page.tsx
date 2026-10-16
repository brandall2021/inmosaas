import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CatalogEntryForm } from "@/features/catalogos/components/catalog-entry-form";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NuevoCatalogEntryPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/catalogos"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <CatalogEntryForm />
    </div>
  );
}
