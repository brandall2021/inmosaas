import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { listCatalogFormOptions } from "@/features/catalogos/data";
import { PropertyForm } from "@/features/properties/components/property-form";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function NuevaPropiedadPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const [zoneOptions, characteristicOptions] = await Promise.all([
    listCatalogFormOptions(org.id, ["zona"]),
    listCatalogFormOptions(org.id, ["amenity", "servicio"]),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/propiedades"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <PropertyForm
        zoneOptions={zoneOptions.map((entry) => entry.name)}
        characteristicOptions={characteristicOptions.map((entry) => entry.name)}
      />
    </div>
  );
}
