import {
  ActivityList,
  AutomationAlerts,
  DeliveriesList,
  IntegrationsForm,
} from "@/features/configuracion";
import { ALERT_EXPIRING_DAYS } from "@/features/configuracion/constants";
import { countPendingSettlements } from "@/features/liquidaciones";
import {
  countExpiringRentals,
  countPropertiesWithoutImages,
  getIntegration,
  listActivity,
  listDeliveries,
} from "@/features/configuracion/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";

export const instant = false;

export default async function ConfiguracionPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const [integration, activity, deliveries, expiringRentals, propertiesWithoutImages, pendingSettlements] =
    await Promise.all([
      getIntegration(org.id),
      listActivity(org.id),
      listDeliveries(org.id),
      countExpiringRentals(org.id, ALERT_EXPIRING_DAYS),
      countPropertiesWithoutImages(org.id),
      countPendingSettlements(org.id),
    ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Integraciones, automatizaciones y actividad de la organización.
        </p>
      </div>

      <IntegrationsForm integration={integration ?? undefined} />

      <DeliveriesList deliveries={deliveries} />

      <AutomationAlerts
        expiringRentals={expiringRentals}
        propertiesWithoutImages={propertiesWithoutImages}
        pendingSettlements={pendingSettlements}
      />

      <ActivityList entries={activity} />
    </div>
  );
}
