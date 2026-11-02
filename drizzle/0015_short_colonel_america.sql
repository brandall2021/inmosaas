CREATE TABLE "rental_index_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"index_type" text NOT NULL,
	"base_index_value" numeric(14, 4) NOT NULL,
	"new_index_value" numeric(14, 4) NOT NULL,
	"previous_rent" numeric(14, 2) NOT NULL,
	"new_rent" numeric(14, 2) NOT NULL,
	"applied_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_penalties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"overdue_amount" numeric(14, 2) NOT NULL,
	"overdue_days" integer NOT NULL,
	"daily_rate" numeric(5, 2) NOT NULL,
	"penalty_amount" numeric(14, 2) NOT NULL,
	"calculated_date" date NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"paid_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_rent_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"rent_amount" numeric(14, 2) NOT NULL,
	"currency" text NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "index_type" text DEFAULT 'ninguno';--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "adjustment_day" integer;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "penalty_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "rental_index_entries" ADD CONSTRAINT "rental_index_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_index_entries" ADD CONSTRAINT "rental_index_entries_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_penalties" ADD CONSTRAINT "rental_penalties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_penalties" ADD CONSTRAINT "rental_penalties_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_rent_history" ADD CONSTRAINT "rental_rent_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_rent_history" ADD CONSTRAINT "rental_rent_history_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rental_index_entries_organization_idx" ON "rental_index_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rental_index_entries_rental_idx" ON "rental_index_entries" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "rental_penalties_organization_idx" ON "rental_penalties" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rental_penalties_rental_idx" ON "rental_penalties" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "rental_penalties_rental_status_idx" ON "rental_penalties" USING btree ("rental_id","status");--> statement-breakpoint
CREATE INDEX "rental_rent_history_organization_idx" ON "rental_rent_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "rental_rent_history_rental_idx" ON "rental_rent_history" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "rental_rent_history_rental_valid_idx" ON "rental_rent_history" USING btree ("rental_id","valid_from");