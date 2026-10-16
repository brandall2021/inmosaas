import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { activityActionLabel } from "../constants";
import type { ActivityRow } from "../data";

function formatWhen(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function ActivityList({ entries }: { entries: ActivityRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actividad reciente</CardTitle>
        <CardDescription>
          Registro de cambios realizados por el equipo en esta organización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay actividad registrada.
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {activityActionLabel(entry.action)}
                  </Badge>
                  <span className="text-sm">{entry.summary}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{entry.actorName ?? "Sistema"}</span>
                  <span>{formatWhen(entry.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
