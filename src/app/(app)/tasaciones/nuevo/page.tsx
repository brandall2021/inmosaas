import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ValuationForm } from "@/features/tasaciones/components/valuation-form";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NuevaTasacionPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/tasaciones"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <ValuationForm />
    </div>
  );
}
