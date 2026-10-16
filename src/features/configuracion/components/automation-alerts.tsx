import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ALERT_EXPIRING_DAYS } from "../constants";

type Alert = {
  label: string;
  value: number;
  hint: string;
};

export function AutomationAlerts({
  expiringRentals,
  propertiesWithoutImages,
}: {
  expiringRentals: number;
  propertiesWithoutImages: number;
}) {
  const alerts: Alert[] = [
    {
      label: `Alquileres por vencer`,
      value: expiringRentals,
      hint: `Vigentes con fin dentro de los próximos ${ALERT_EXPIRING_DAYS} días`,
    },
    {
      label: "Propiedades sin fotos",
      value: propertiesWithoutImages,
      hint: "Publicaciones que todavía no tienen imágenes",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Automatizaciones</CardTitle>
        <CardDescription>
          Señales calculadas al vuelo para que no se te escape nada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {alerts.map((alert) => (
            <div key={alert.label} className="rounded-md border p-4">
              <p className="text-3xl font-semibold tabular-nums">{alert.value}</p>
              <p className="mt-1 text-sm font-medium">{alert.label}</p>
              <p className="text-xs text-muted-foreground">{alert.hint}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
