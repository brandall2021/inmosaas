import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DeliveryRow } from "../data";
import { TestConnectionButton } from "./test-connection-button";

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

function statusLabel(delivery: DeliveryRow): string {
  return delivery.deliveredAt
    ? `Entregado${delivery.attempt > 1 ? ` (${delivery.attempt} intentos)` : ""}`
    : delivery.httpStatus
      ? `Fallido (HTTP ${delivery.httpStatus})`
      : (delivery.error === "timeout"
          ? "Fallido (sin respuesta)"
          : "Fallido");
}

function statusTone(delivery: DeliveryRow): string {
  return delivery.deliveredAt
    ? "text-emerald-600"
    : "text-destructive";
}

export function DeliveriesList({ deliveries }: { deliveries: DeliveryRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Entregas</CardTitle>
        <CardDescription>
          Últimos intentos de entrega de eventos hacia el webhook de la
          organización, con el código HTTP de respuesta o el tipo de error.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TestConnectionButton />

        {deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay entregas registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Fecha</th>
                  <th className="py-2 pr-3 font-medium">Evento</th>
                  <th className="py-2 pr-3 font-medium">Estado</th>
                  <th className="py-2 font-medium">HTTP / Error</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {dateTimeFormatter.format(delivery.createdAt)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {delivery.event}
                    </td>
                    <td
                      className={`py-2 pr-3 font-medium whitespace-nowrap ${statusTone(delivery)}`}
                    >
                      {statusLabel(delivery)}
                    </td>
                    <td className="py-2 font-mono text-xs whitespace-nowrap">
                      {delivery.httpStatus
                        ? String(delivery.httpStatus)
                        : (delivery.error ?? "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
