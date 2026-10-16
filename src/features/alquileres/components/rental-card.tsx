import Link from "next/link";
import { Building2, CalendarDays, User } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/features/properties/constants";

import { StatusBadge } from "./status-badge";
import { formatDate } from "../constants";
import type { RentalRow } from "../data";

export function RentalCard({ row }: { row: RentalRow }) {
  const { rental, propertyTitle, clientName } = row;

  const period = [formatDate(rental.startDate), formatDate(rental.endDate)].join(
    " – ",
  );

  return (
    <Link href={`/alquileres/${rental.id}`} className="block">
      <Card className="h-full transition-colors hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-base font-medium">
                {propertyTitle ?? "Sin propiedad asignada"}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="size-3.5 shrink-0" />
                <span className="truncate">{clientName ?? "Sin inquilino"}</span>
              </p>
            </div>
            <StatusBadge status={rental.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="truncate">{period}</span>
          </p>
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Building2 className="size-3.5 shrink-0" />
            <span>{formatPrice(rental.rentAmount, rental.currency)}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
