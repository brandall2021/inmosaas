import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Client } from "@/db/schema";

import { StageBadge } from "./stage-badge";
import { clientTypeLabels, getInitials } from "../constants";

export function ClientCard({ client }: { client: Client }) {
  return (
    <Link href={`/crm/${client.id}`} className="block">
      <Card className="h-full transition-colors hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="truncate font-heading text-base font-medium">
                  {client.name}
                </h2>
                <StageBadge stage={client.stage} />
              </div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {clientTypeLabels[client.type]}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {client.email ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{client.email}</span>
            </p>
          ) : null}
          {client.phone ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </p>
          ) : null}
          {!client.email && !client.phone ? (
            <p className="text-sm text-muted-foreground">Sin datos de contacto</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
