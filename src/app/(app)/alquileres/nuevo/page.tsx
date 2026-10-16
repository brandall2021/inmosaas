import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { RentalForm } from "@/features/alquileres/components/rental-form";
import {
  listClientOptions,
  listPropertyOptions,
} from "@/features/alquileres/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NuevoAlquilerPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const [propertyOptions, clientOptions] = await Promise.all([
    listPropertyOptions(org.id),
    listClientOptions(org.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/alquileres"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <RentalForm
        propertyOptions={propertyOptions}
        clientOptions={clientOptions}
      />
    </div>
  );
}
