import { ImageOff } from "lucide-react";

import { DeleteImageButton } from "./delete-image-button";

type GalleryImage = {
  id: string;
  storageKey: string;
  alt: string | null;
};

export function PropertyGallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
        <ImageOff className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Sin imágenes cargadas todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image) => (
        <figure
          key={image.id}
          className="relative overflow-hidden rounded-lg ring-1 ring-foreground/10"
        >
          {/* Image is served by an authenticated route, so next/image cannot
              fetch it server-side. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/uploads/${image.storageKey}`}
            alt={image.alt ?? ""}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute top-1.5 right-1.5">
            <DeleteImageButton id={image.id} />
          </div>
        </figure>
      ))}
    </div>
  );
}
