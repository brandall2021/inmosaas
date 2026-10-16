import { redirect } from "next/navigation";

import { MobileNav } from "@/components/app-shell/mobile-nav";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { OrgSwitcher } from "@/features/organizations/components/org-switcher";
import { UserMenu } from "@/features/auth/components/user-menu";
import {
  getActiveOrganization,
  getUserOrganizations,
  requireUser,
} from "@/lib/dal";

/**
 * The authenticated area reads the session cookie and can redirect to /login,
 * so it cannot render an instant static shell. Opt the segment out of instant
 * navigation / static-shell validation (Next.js 16 Cache Components).
 */
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [activeOrg, orgs] = await Promise.all([
    getActiveOrganization(),
    getUserOrganizations(user.id),
  ]);

  if (!activeOrg) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="text-lg font-semibold tracking-tight">
            InmoSaaS
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden">
            <MobileNav />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden w-64 sm:block">
              <OrgSwitcher
                organizations={orgs}
                activeOrganizationId={activeOrg.id}
              />
            </div>
            <UserMenu name={user.name} email={user.email} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
