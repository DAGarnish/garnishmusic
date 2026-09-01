import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_product_type" AS ENUM('simple', 'variable');
  CREATE TYPE "public"."enum_bot_admins_allowed_fields" AS ENUM('price', 'schedule', 'text');
  CREATE TYPE "public"."enum_bot_audit_log_document_collection" AS ENUM('pages', 'products');
  CREATE TYPE "public"."enum_bot_audit_log_outcome" AS ENUM('applied', 'denied_permission', 'denied_anchor_mismatch', 'denied_rate_limit', 'denied_error');
  CREATE TYPE "public"."enum_bot_pending_changes_document_collection" AS ENUM('pages', 'products');
  CREATE TYPE "public"."enum_bot_pending_changes_status" AS ENUM('pending', 'confirmed', 'cancelled', 'expired', 'failed');
  CREATE TABLE "products_variations_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"attribute_name" varchar,
  	"attribute_value" varchar
  );
  
  CREATE TABLE "products_variations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" numeric,
  	"sale_price" numeric,
  	"sku" varchar,
  	"stock_quantity" numeric
  );
  
  CREATE TABLE "bot_admins_allowed_fields" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_bot_admins_allowed_fields",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "bot_admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"telegram_user_id" varchar NOT NULL,
  	"telegram_username" varchar,
  	"site_id" integer NOT NULL,
  	"unrestricted_content_access" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"message_count_today" numeric DEFAULT 0,
  	"message_count_reset_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bot_admins_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer
  );
  
  CREATE TABLE "bot_audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"telegram_user_id" varchar NOT NULL,
  	"telegram_username" varchar,
  	"site_id" integer,
  	"document_collection" "enum_bot_audit_log_document_collection",
  	"page_id" integer,
  	"product_id" integer,
  	"field" varchar,
  	"old_value" varchar,
  	"new_value" varchar,
  	"outcome" "enum_bot_audit_log_outcome" NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bot_pending_changes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"telegram_user_id" varchar NOT NULL,
  	"telegram_chat_id" varchar NOT NULL,
  	"site_id" integer NOT NULL,
  	"document_collection" "enum_bot_pending_changes_document_collection" NOT NULL,
  	"page_id" integer,
  	"product_id" integer,
  	"field" varchar NOT NULL,
  	"old_snippet" varchar NOT NULL,
  	"new_snippet" varchar NOT NULL,
  	"status" "enum_bot_pending_changes_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "product_type" "enum_products_product_type" DEFAULT 'simple';
  ALTER TABLE "orders_line_items" ADD COLUMN "variation_id" varchar;
  ALTER TABLE "orders_line_items" ADD COLUMN "variation_name" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bot_admins_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bot_audit_log_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bot_pending_changes_id" integer;
  ALTER TABLE "products_variations_attributes" ADD CONSTRAINT "products_variations_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_variations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_variations" ADD CONSTRAINT "products_variations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bot_admins_allowed_fields" ADD CONSTRAINT "bot_admins_allowed_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bot_admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bot_admins" ADD CONSTRAINT "bot_admins_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bot_admins_rels" ADD CONSTRAINT "bot_admins_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bot_admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bot_admins_rels" ADD CONSTRAINT "bot_admins_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bot_audit_log" ADD CONSTRAINT "bot_audit_log_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bot_audit_log" ADD CONSTRAINT "bot_audit_log_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bot_audit_log" ADD CONSTRAINT "bot_audit_log_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bot_pending_changes" ADD CONSTRAINT "bot_pending_changes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bot_pending_changes" ADD CONSTRAINT "bot_pending_changes_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bot_pending_changes" ADD CONSTRAINT "bot_pending_changes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_variations_attributes_order_idx" ON "products_variations_attributes" USING btree ("_order");
  CREATE INDEX "products_variations_attributes_parent_id_idx" ON "products_variations_attributes" USING btree ("_parent_id");
  CREATE INDEX "products_variations_order_idx" ON "products_variations" USING btree ("_order");
  CREATE INDEX "products_variations_parent_id_idx" ON "products_variations" USING btree ("_parent_id");
  CREATE INDEX "bot_admins_allowed_fields_order_idx" ON "bot_admins_allowed_fields" USING btree ("order");
  CREATE INDEX "bot_admins_allowed_fields_parent_idx" ON "bot_admins_allowed_fields" USING btree ("parent_id");
  CREATE UNIQUE INDEX "bot_admins_telegram_user_id_idx" ON "bot_admins" USING btree ("telegram_user_id");
  CREATE INDEX "bot_admins_site_idx" ON "bot_admins" USING btree ("site_id");
  CREATE INDEX "bot_admins_updated_at_idx" ON "bot_admins" USING btree ("updated_at");
  CREATE INDEX "bot_admins_created_at_idx" ON "bot_admins" USING btree ("created_at");
  CREATE INDEX "bot_admins_rels_order_idx" ON "bot_admins_rels" USING btree ("order");
  CREATE INDEX "bot_admins_rels_parent_idx" ON "bot_admins_rels" USING btree ("parent_id");
  CREATE INDEX "bot_admins_rels_path_idx" ON "bot_admins_rels" USING btree ("path");
  CREATE INDEX "bot_admins_rels_pages_id_idx" ON "bot_admins_rels" USING btree ("pages_id");
  CREATE INDEX "bot_audit_log_site_idx" ON "bot_audit_log" USING btree ("site_id");
  CREATE INDEX "bot_audit_log_page_idx" ON "bot_audit_log" USING btree ("page_id");
  CREATE INDEX "bot_audit_log_product_idx" ON "bot_audit_log" USING btree ("product_id");
  CREATE INDEX "bot_audit_log_updated_at_idx" ON "bot_audit_log" USING btree ("updated_at");
  CREATE INDEX "bot_audit_log_created_at_idx" ON "bot_audit_log" USING btree ("created_at");
  CREATE INDEX "bot_pending_changes_site_idx" ON "bot_pending_changes" USING btree ("site_id");
  CREATE INDEX "bot_pending_changes_page_idx" ON "bot_pending_changes" USING btree ("page_id");
  CREATE INDEX "bot_pending_changes_product_idx" ON "bot_pending_changes" USING btree ("product_id");
  CREATE INDEX "bot_pending_changes_updated_at_idx" ON "bot_pending_changes" USING btree ("updated_at");
  CREATE INDEX "bot_pending_changes_created_at_idx" ON "bot_pending_changes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bot_admins_fk" FOREIGN KEY ("bot_admins_id") REFERENCES "public"."bot_admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bot_audit_log_fk" FOREIGN KEY ("bot_audit_log_id") REFERENCES "public"."bot_audit_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bot_pending_changes_fk" FOREIGN KEY ("bot_pending_changes_id") REFERENCES "public"."bot_pending_changes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bot_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("bot_admins_id");
  CREATE INDEX "payload_locked_documents_rels_bot_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("bot_audit_log_id");
  CREATE INDEX "payload_locked_documents_rels_bot_pending_changes_id_idx" ON "payload_locked_documents_rels" USING btree ("bot_pending_changes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_variations_attributes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_variations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bot_admins_allowed_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bot_admins" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bot_admins_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bot_audit_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bot_pending_changes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_variations_attributes" CASCADE;
  DROP TABLE "products_variations" CASCADE;
  DROP TABLE "bot_admins_allowed_fields" CASCADE;
  DROP TABLE "bot_admins" CASCADE;
  DROP TABLE "bot_admins_rels" CASCADE;
  DROP TABLE "bot_audit_log" CASCADE;
  DROP TABLE "bot_pending_changes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bot_admins_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bot_audit_log_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bot_pending_changes_fk";
  
  DROP INDEX "payload_locked_documents_rels_bot_admins_id_idx";
  DROP INDEX "payload_locked_documents_rels_bot_audit_log_id_idx";
  DROP INDEX "payload_locked_documents_rels_bot_pending_changes_id_idx";
  ALTER TABLE "products" DROP COLUMN "product_type";
  ALTER TABLE "orders_line_items" DROP COLUMN "variation_id";
  ALTER TABLE "orders_line_items" DROP COLUMN "variation_name";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bot_admins_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bot_audit_log_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bot_pending_changes_id";
  DROP TYPE "public"."enum_products_product_type";
  DROP TYPE "public"."enum_bot_admins_allowed_fields";
  DROP TYPE "public"."enum_bot_audit_log_document_collection";
  DROP TYPE "public"."enum_bot_audit_log_outcome";
  DROP TYPE "public"."enum_bot_pending_changes_document_collection";
  DROP TYPE "public"."enum_bot_pending_changes_status";`)
}
