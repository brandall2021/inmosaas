import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ClientForm } from "@/features/clients/components/client-form";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NuevoClientePage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/crm"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <ClientForm />
    </div>
  );
}
