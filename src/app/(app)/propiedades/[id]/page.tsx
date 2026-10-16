import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActiveOrganization, requireUser } from "@/lib/dal";
import { DeletePropertyButton } from "@/features/properties/components/delete-property-button";
import { ImageUploadForm } from "@/features/properties/components/image-upload-form";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { StatusBadge } from "@/features/properties/components/status-badge";
import {
  formatPrice,
  operationLabels,
  typeLabels,
} from "@/features/properties/constants";
import { getProperty, listPropertyImages } from "@/features/properties/data";
import { cn } from "@/lib/utils";

export const instant = false;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
});

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default async function PropiedadDetallePage({
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
  const property = await getProperty(org.id, id);
  if (!property) {
    notFound();
  }

  const images = await listPropertyImages(org.id, property.id);

  const location = [property.address, property.city, property.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/propiedades"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={property.status} />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {operationLabels[property.operation]} ·{" "}
              {typeLabels[property.propertyType]}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {property.title}
          </h1>
          {location ? (
            <p className="text-sm text-muted-foreground">{location}</p>
          ) : null}
          <p className="text-xl font-semibold">
            {formatPrice(property.price, property.currency)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/propiedades/${property.id}/editar`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="size-4" />
            Editar
          </Link>
          <DeletePropertyButton id={property.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Galería</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PropertyGallery images={images} />
          <ImageUploadForm propertyId={property.id} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Ambientes" value={property.rooms} />
              <DetailRow label="Dormitorios" value={property.bedrooms} />
              <DetailRow label="Baños" value={property.bathrooms} />
              <DetailRow
                label="Superficie"
                value={property.areaM2 ? `${property.areaM2} m²` : null}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow
                label="Creada"
                value={dateFormatter.format(property.createdAt)}
              />
              <DetailRow
                label="Última edición"
                value={dateFormatter.format(property.updatedAt)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {property.description ? (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {property.description}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
