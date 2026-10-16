import {
  ActivityList,
  AutomationAlerts,
  IntegrationsForm,
} from "@/features/configuracion";
import { ALERT_EXPIRING_DAYS } from "@/features/configuracion/constants";
import {
  countExpiringRentals,
  countPropertiesWithoutImages,
  getIntegration,
  listActivity,
} from "@/features/configuracion/data";
import { getActiveOrganization, requireUser } from "@/lib/dal";

export const instant = false;

export default async function ConfiguracionPage() {
  await requireUser();
  const org = await getActiveOrganization();
  if (!org) {
    return null;
  }

  const [integration, activity, expiringRentals, propertiesWithoutImages] =
    await Promise.all([
      getIntegration(org.id),
      listActivity(org.id),
      countExpiringRentals(org.id, ALERT_EXPIRING_DAYS),
      countPropertiesWithoutImages(org.id),
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

      <AutomationAlerts
        expiringRentals={expiringRentals}
        propertiesWithoutImages={propertiesWithoutImages}
      />

      <ActivityList entries={activity} />
    </div>
  );
}
