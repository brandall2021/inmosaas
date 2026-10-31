ALTER TABLE "properties" ADD COLUMN "zone" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "amenities" jsonb DEFAULT '[]'::jsonb NOT NULL;