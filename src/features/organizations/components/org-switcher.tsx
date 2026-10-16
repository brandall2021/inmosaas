"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchOrganizationAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

type OrgOption = {
  id: string;
  name: string;
  role: string;
};

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: OrgOption[];
  activeOrganizationId: string | null;
}) {
  const active =
    organizations.find((org) => org.id === activeOrganizationId) ??
    organizations[0];

  if (!active) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between gap-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="size-4 shrink-0" />
          <span className="truncate">{active.name}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrganizationAction(org.id)}
              className="gap-2"
            >
              <Building2 className="size-4" />
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === active.id ? <Check className="size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="capitalize">
            Rol: {active.role}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
