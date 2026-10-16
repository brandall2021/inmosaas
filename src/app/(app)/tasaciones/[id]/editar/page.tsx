import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ValuationForm } from "@/features/tasaciones/components/valuation-form";
import { getValuation } from "@/features/tasaciones/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function EditarTasacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const { id } = await params;
  const valuation = await getValuation(org.id, id);
  if (!valuation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/tasaciones/${valuation.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <ValuationForm valuation={valuation} />
    </div>
  );
}
