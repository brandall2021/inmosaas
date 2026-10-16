import Link from "next/link";
import { Bath, BedDouble, LayoutGrid, MapPin, Ruler } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Property } from "@/db/schema";

import { StatusBadge } from "./status-badge";
import { formatPrice, operationLabels, typeLabels } from "../constants";

function Feature({
  icon: Icon,
  value,
}: {
  icon: typeof MapPin;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      {value}
    </span>
  );
}

export function PropertyCard({ property }: { property: Property }) {
  const location = [property.city, property.province]
    .filter(Boolean)
    .join(", ");

  return (
    <Link href={`/propiedades/${property.id}`} className="block">
      <Card className="h-full transition-colors hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {operationLabels[property.operation]} ·{" "}
              {typeLabels[property.propertyType]}
            </span>
            <StatusBadge status={property.status} />
          </div>
          <h2 className="truncate font-heading text-base font-medium">
            {property.title}
          </h2>
          {location ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-semibold">
            {formatPrice(property.price, property.currency)}
          </p>
          <div className="flex flex-wrap gap-3">
            {property.rooms ? (
              <Feature icon={LayoutGrid} value={`${property.rooms} amb.`} />
            ) : null}
            {property.bedrooms ? (
              <Feature icon={BedDouble} value={`${property.bedrooms} dorm.`} />
            ) : null}
            {property.bathrooms ? (
              <Feature icon={Bath} value={`${property.bathrooms} baños`} />
            ) : null}
            {property.areaM2 ? (
              <Feature icon={Ruler} value={`${property.areaM2} m²`} />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
