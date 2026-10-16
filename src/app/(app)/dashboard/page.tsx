import { Building2, Library, Search, Users, Calculator, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countProperties } from "@/features/properties/data";
import { countClients } from "@/features/clients/data";
import { countValuations } from "@/features/tasaciones/data";
import { countRentals } from "@/features/alquileres/data";
import { getActiveOrganization } from "@/lib/dal";

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

export const instant = false;

export default async function DashboardPage() {
  const org = await getActiveOrganization();
  const propertyCount = org ? await countProperties(org.id) : 0;
  const clientCount = org ? await countClients(org.id) : 0;
  const valuationCount = org ? await countValuations(org.id) : 0;
  const activeRentalCount = org ? await countRentals(org.id, "vigente") : 0;

  const stats: Stat[] = [
    {
      label: "Propiedades activas",
      value: String(propertyCount),
      hint:
        propertyCount > 0
          ? "Propiedades cargadas en esta inmobiliaria"
          : "Cargá tu primera propiedad para empezar",
      icon: Building2,
    },
    {
      label: "Alquileres vigentes",
      value: String(activeRentalCount),
      hint:
        activeRentalCount > 0
          ? "Contratos de alquiler en curso"
          : "Registrá un alquiler para administrar tus contratos",
      icon: KeyRound,
    },
    {
      label: "Clientes en cartera",
      value: String(clientCount),
      hint:
        clientCount > 0
          ? "Contactos registrados en tu CRM"
          : "Cargá tu primer contacto para empezar",
      icon: Users,
    },
    {
      label: "Tasaciones",
      value: String(valuationCount),
      hint:
        valuationCount > 0
          ? "Registros de tasación en tu cartera"
          : "Calculá valor por m² con una nueva tasación",
      icon: Calculator,
    },
    {
      label: "Búsquedas guardadas",
      value: "0",
      hint: "Guardá criterios de búsqueda frecuentes",
      icon: Search,
    },
    {
      label: "Catálogos publicados",
      value: "0",
      hint: "Compartí listados con tus clientes",
      icon: Library,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {org?.name ?? "Panel"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu operación inmobiliaria.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{stat.label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-3xl font-semibold">
                  {stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
