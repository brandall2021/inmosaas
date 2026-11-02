CREATE TABLE "cash_box_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"closing_date" date NOT NULL,
	"opening_amount" numeric(14, 2) NOT NULL,
	"total_income" numeric(14, 2) NOT NULL,
	"total_expense" numeric(14, 2) NOT NULL,
	"theoretical_balance" numeric(14, 2) NOT NULL,
	"real_balance" numeric(14, 2) NOT NULL,
	"difference" numeric(14, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_box_closings_closing_date_unique" UNIQUE("closing_date")
);
--> statement-breakpoint
CREATE TABLE "cash_box_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"concept" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text NOT NULL,
	"category" text NOT NULL,
	"date" date NOT NULL,
	"client_id" uuid,
	"rental_id" uuid,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_box_closings" ADD CONSTRAINT "cash_box_closings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_box_entries" ADD CONSTRAINT "cash_box_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_box_entries" ADD CONSTRAINT "cash_box_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_box_entries" ADD CONSTRAINT "cash_box_entries_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_box_closings_organization_idx" ON "cash_box_closings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cash_box_entries_organization_idx" ON "cash_box_entries" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cash_box_entries_org_date_idx" ON "cash_box_entries" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "cash_box_entries_org_type_idx" ON "cash_box_entries" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "cash_box_entries_org_status_idx" ON "cash_box_entries" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "cash_box_entries_client_idx" ON "cash_box_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "cash_box_entries_rental_idx" ON "cash_box_entries" USING btree ("rental_id");