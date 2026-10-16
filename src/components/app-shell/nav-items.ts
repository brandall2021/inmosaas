import {
  Building2,
  Calculator,
  Contact,
  KeyRound,
  LayoutDashboard,
  Library,
  Search,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export const primaryNav: NavItem[] = [
  { title: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { title: "Propiedades", href: "/propiedades", icon: Building2 },
  { title: "Alquileres", href: "/alquileres", icon: KeyRound },
  { title: "Buscador IA", href: "/buscador", icon: Search },
  { title: "Tasaciones", href: "/tasaciones", icon: Calculator },
  { title: "CRM", href: "/crm", icon: Contact },
  { title: "Catálogos", href: "/catalogos", icon: Library },
];

export const secondaryNav: NavItem[] = [
  { title: "Configuración", href: "/configuracion", icon: Settings },
];
