import Link from "next/link";
import { Calculator, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Valuation } from "@/db/schema";

import { StatusBadge } from "./status-badge";
import { formatCurrency } from "../constants";

export function ValuationCard({ valuation }: { valuation: Valuation }) {
  return (
    <Link href={`/tasaciones/${valuation.id}`} className="block">
      <Card className="h-full transition-colors hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-base font-medium">
                {valuation.title}
              </h2>
              {valuation.address ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{valuation.address}</span>
                </p>
              ) : null}
            </div>
            <StatusBadge status={valuation.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calculator className="size-3.5 shrink-0" />
            <span>
              {valuation.areaM2 != null ? `${valuation.areaM2} m² · ` : ""}
              {valuation.pricePerM2 != null
                ? `${formatCurrency(valuation.pricePerM2)} / m²`
                : ""}
            </span>
          </p>
          {valuation.totalPrice != null ? (
            <p className="text-sm font-medium">
              Total estimado: {formatCurrency(valuation.totalPrice)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
