"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { seedCatalogAction } from "../actions";

export function SeedCatalogButton() {
  return (
    <form action={seedCatalogAction}>
      <Button type="submit" variant="outline">
        <Sparkles />
        Cargar ejemplos
      </Button>
    </form>
  );
}
