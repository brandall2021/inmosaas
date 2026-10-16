"use client";

import { useActionState, useEffect, useRef } from "react";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/action-state";

import { uploadPropertyImageAction } from "../actions";
import { ACCEPTED_IMAGE_ATTRIBUTE } from "../image-constants";

const fileInputClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground outline-none transition-colors file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm file:text-foreground hover:file:bg-muted/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ImageUploadForm({ propertyId }: { propertyId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    uploadPropertyImageAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="file">Imagen</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept={ACCEPTED_IMAGE_ATTRIBUTE}
            required
            className={fileInputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alt">Texto alternativo</Label>
          <Input
            id="alt"
            name="alt"
            placeholder="Frente del edificio"
          />
        </div>
        <Button type="submit" disabled={pending}>
          <ImagePlus className="size-4" />
          {pending ? "Subiendo..." : "Subir"}
        </Button>
      </div>
      {state && !state.success && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
