CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"operation" text NOT NULL,
	"property_type" text NOT NULL,
	"status" text DEFAULT 'disponible' NOT NULL,
	"price" numeric(14, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"address" text,
	"city" text,
	"province" text,
	"rooms" integer,
	"bedrooms" integer,
	"bathrooms" integer,
	"area_m2" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_organization_idx" ON "properties" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "properties_org_status_idx" ON "properties" USING btree ("organization_id","status");