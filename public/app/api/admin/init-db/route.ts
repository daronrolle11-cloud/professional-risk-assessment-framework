import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { staffUsers } from "@/db/schema";
import { count } from "drizzle-orm";
import { generateStaffCode } from "@/lib/staff-auth";

export async function POST() {
  const [{ value: existing }] = await db.select({ value: count() }).from(staffUsers);

  if (existing > 0) {
    return NextResponse.json(
      { error: "System already bootstrapped. Use your dashboard to create further accounts." },
      { status: 403 }
    );
  }

  // 1-Click Auto-Migration (Creates all tables if they don't exist)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "company_settings" (
        "id" serial PRIMARY KEY,
        "company_name" text DEFAULT 'Bahamas Compliance & Safety Oversight Ltd. (BCSO)' NOT NULL,
        "address" text DEFAULT 'Nassau, New Providence, The Bahamas' NOT NULL,
        "phone" text DEFAULT '' NOT NULL,
        "email" text DEFAULT '' NOT NULL,
        "website" text DEFAULT '' NOT NULL,
        "managing_director" text DEFAULT '' NOT NULL,
        "logo_data_url" text,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "contractors" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "trade" text NOT NULL,
        "island" text NOT NULL,
        "phone" text DEFAULT '' NOT NULL,
        "email" text DEFAULT '' NOT NULL,
        "access_code" text NOT NULL,
        "session_token" text,
        "active" text DEFAULT 'true' NOT NULL,
        "permissions" jsonb DEFAULT '{"allowedTrades": [], "canAddNotes": true, "maxActiveJobs": 0, "canViewHistory": true, "canSubmitPhotos": true, "restrictedToIslands": []}'::jsonb NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "created_by_staff_id" integer
    );
    CREATE TABLE IF NOT EXISTS "properties" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "address" text DEFAULT '' NOT NULL,
        "island" text NOT NULL,
        "property_type" text DEFAULT 'residential' NOT NULL,
        "client_name" text DEFAULT '' NOT NULL,
        "client_email" text DEFAULT '' NOT NULL,
        "square_feet" integer DEFAULT 0 NOT NULL,
        "year_built" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "staff_users" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "email" text DEFAULT '' NOT NULL,
        "phone" text DEFAULT '' NOT NULL,
        "title" text DEFAULT '' NOT NULL,
        "role" text DEFAULT 'reviewer' NOT NULL,
        "access_code" text NOT NULL,
        "session_token" text,
        "active" text DEFAULT 'true' NOT NULL,
        "last_login_at" timestamp,
        "login_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "created_by_staff_id" integer
    );
    CREATE TABLE IF NOT EXISTS "inspections" (
        "id" serial PRIMARY KEY,
        "code" text NOT NULL,
        "property_id" integer NOT NULL REFERENCES "properties"("id") ON DELETE cascade,
        "contractor_id" integer NOT NULL REFERENCES "contractors"("id") ON DELETE cascade,
        "trade" text NOT NULL,
        "status" text DEFAULT 'assigned' NOT NULL,
        "review_stage" text DEFAULT 'pending' NOT NULL,
        "scheduled_for" text DEFAULT '' NOT NULL,
        "admin_note" text DEFAULT '' NOT NULL,
        "compliance_score" integer,
        "report_no" text,
        "client_notified_at" timestamp,
        "started_at" timestamp,
        "submitted_at" timestamp,
        "reviewed_at" timestamp,
        "reviewed_by_staff_id" integer REFERENCES "staff_users"("id") ON DELETE set null,
        "approved_at" timestamp,
        "finalized_at" timestamp,
        "finalized_by_staff_id" integer REFERENCES "staff_users"("id") ON DELETE set null,
        "sent_by_staff_id" integer REFERENCES "staff_users"("id") ON DELETE set null,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "checklist_items" (
        "id" serial PRIMARY KEY,
        "inspection_id" integer NOT NULL REFERENCES "inspections"("id") ON DELETE cascade,
        "sort_order" integer DEFAULT 0 NOT NULL,
        "label" text NOT NULL,
        "requirement" text DEFAULT '' NOT NULL,
        "severity" text DEFAULT 'major' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "note" text DEFAULT '' NOT NULL,
        "photos" jsonb DEFAULT '[]'::jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "re_inspections" (
        "id" serial PRIMARY KEY,
        "cert_ref" text NOT NULL,
        "original_inspection_id" integer NOT NULL REFERENCES "inspections"("id") ON DELETE cascade,
        "contractor_id" integer NOT NULL REFERENCES "contractors"("id") ON DELETE cascade,
        "remediation_by" text DEFAULT 'outside' NOT NULL,
        "fee_charged" integer DEFAULT 250 NOT NULL,
        "status" text DEFAULT 'assigned' NOT NULL,
        "scheduled_for" text DEFAULT '' NOT NULL,
        "started_at" timestamp,
        "submitted_at" timestamp,
        "cert_issued_at" timestamp,
        "issued_by_staff_id" integer REFERENCES "staff_users"("id") ON DELETE set null,
        "managing_director" text DEFAULT '' NOT NULL,
        "admin_notes" text DEFAULT '' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "re_inspection_items" (
        "id" serial PRIMARY KEY,
        "re_inspection_id" integer NOT NULL REFERENCES "re_inspections"("id") ON DELETE cascade,
        "original_item_id" integer NOT NULL REFERENCES "checklist_items"("id") ON DELETE cascade,
        "label" text NOT NULL,
        "requirement" text DEFAULT '' NOT NULL,
        "severity" text DEFAULT 'major' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "note" text DEFAULT '' NOT NULL,
        "photos" jsonb DEFAULT '[]'::jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "report_deliveries" (
        "id" serial PRIMARY KEY,
        "inspection_id" integer NOT NULL REFERENCES "inspections"("id") ON DELETE cascade,
        "sent_by_staff_id" integer REFERENCES "staff_users"("id") ON DELETE set null,
        "recipient_name" text DEFAULT '' NOT NULL,
        "recipient_email" text DEFAULT '' NOT NULL,
        "subject" text DEFAULT '' NOT NULL,
        "message" text DEFAULT '' NOT NULL,
        "delivery_method" text DEFAULT 'smtp' NOT NULL,
        "delivery_status" text DEFAULT 'queued' NOT NULL,
        "provider_message_id" text,
        "sent_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "assessments" (
        "id" serial PRIMARY KEY,
        "assessment_no" text NOT NULL,
        "doc_type" text DEFAULT 'risk-assessment' NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "industry" text DEFAULT 'general' NOT NULL,
        "organization" text DEFAULT '' NOT NULL,
        "department" text DEFAULT '' NOT NULL,
        "location" text DEFAULT '' NOT NULL,
        "activity" text DEFAULT '' NOT NULL,
        "assessment_date" text DEFAULT '' NOT NULL,
        "review_date" text DEFAULT '' NOT NULL,
        "assessor" text DEFAULT '' NOT NULL,
        "responsible_manager" text DEFAULT '' NOT NULL,
        "employees_exposed" integer DEFAULT 0 NOT NULL,
        "jurisdiction" text DEFAULT 'both' NOT NULL,
        "regulations" text DEFAULT '' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "hazards" (
        "id" serial PRIMARY KEY,
        "assessment_id" integer NOT NULL REFERENCES "assessments"("id") ON DELETE cascade,
        "sort_order" integer DEFAULT 0 NOT NULL,
        "category" text DEFAULT '' NOT NULL,
        "description" text DEFAULT '' NOT NULL,
        "persons_at_risk" text DEFAULT '' NOT NULL,
        "existing_controls" text DEFAULT '' NOT NULL,
        "likelihood" integer DEFAULT 1 NOT NULL,
        "severity" integer DEFAULT 1 NOT NULL,
        "controls" jsonb DEFAULT '{"ppe": [], "elimination": [], "engineering": [], "substitution": [], "administrative": []}'::jsonb NOT NULL,
        "responsible_person" text DEFAULT '' NOT NULL,
        "due_date" text DEFAULT '' NOT NULL,
        "residual_likelihood" integer DEFAULT 1 NOT NULL,
        "residual_severity" integer DEFAULT 1 NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "workers" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "photo_url" text,
        "dob" text DEFAULT '' NOT NULL,
        "nationality" text DEFAULT 'Bahamian' NOT NULL,
        "primary_language" text DEFAULT 'English' NOT NULL,
        "employer" text DEFAULT '' NOT NULL,
        "trade" text NOT NULL,
        "qr_code" text UNIQUE,
        "active_site_id" integer REFERENCES "properties"("id") ON DELETE set null,
        "created_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "certifications" (
        "id" serial PRIMARY KEY,
        "worker_id" integer NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
        "course_name" text NOT NULL,
        "cert_number" text NOT NULL,
        "issue_date" text NOT NULL,
        "expiry_date" text NOT NULL,
        "status" text DEFAULT 'current' NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "hurricane_checklists" (
        "id" serial PRIMARY KEY,
        "site_id" integer NOT NULL REFERENCES "properties"("id") ON DELETE cascade,
        "phase" text NOT NULL,
        "status" text DEFAULT 'open' NOT NULL,
        "started_at" timestamp,
        "completed_at" timestamp,
        "completed_by_staff_id" integer REFERENCES "staff_users"("id"),
        "items" jsonb DEFAULT '[]'::jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "incidents" (
        "id" serial PRIMARY KEY,
        "incident_no" text NOT NULL,
        "site_id" integer NOT NULL REFERENCES "properties"("id") ON DELETE cascade,
        "classification" text NOT NULL,
        "date" timestamp NOT NULL,
        "location" text NOT NULL,
        "description" text NOT NULL,
        "root_cause" text,
        "status" text DEFAULT 'open' NOT NULL,
        "reported_by" text NOT NULL,
        "photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "signature_data" text,
        "signed_at" timestamp,
        "signed_by_staff_id" integer REFERENCES "staff_users"("id")
    );
    CREATE TABLE IF NOT EXISTS "toolbox_talks" (
        "id" serial PRIMARY KEY,
        "site_id" integer NOT NULL REFERENCES "properties"("id") ON DELETE cascade,
        "topic" text NOT NULL,
        "delivered_at" timestamp DEFAULT now() NOT NULL,
        "delivered_by" text NOT NULL,
        "content_summary" text,
        "attendee_count" integer DEFAULT 0 NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "invoices" (
        "id" serial PRIMARY KEY,
        "invoice_no" text NOT NULL,
        "inspection_id" integer REFERENCES "inspections"("id") ON DELETE set null,
        "property_id" integer NOT NULL REFERENCES "properties"("id") ON DELETE cascade,
        "amount" integer NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "due_date" timestamp,
        "paid_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "training_sessions" (
        "id" serial PRIMARY KEY,
        "course_id" text NOT NULL,
        "course_name" text NOT NULL,
        "instructor_id" integer REFERENCES "staff_users"("id") ON DELETE set null,
        "instructor_name" text NOT NULL,
        "location" text NOT NULL,
        "scheduled_at" timestamp NOT NULL,
        "max_enrollment" integer DEFAULT 20 NOT NULL,
        "enrolled_count" integer DEFAULT 0 NOT NULL,
        "status" text DEFAULT 'scheduled' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  const accessCode = generateStaffCode();

  await db.insert(staffUsers).values({
    name: "BCSO Administrator",
    email: "admin@bcso.bs",
    title: "Master Admin",
    role: "admin",
    accessCode,
  });

  return NextResponse.json({
    message: "Initial admin created successfully. SAVE THIS ACCESS CODE IMMEDIATELY. This endpoint is now locked.",
    role: "admin",
    accessCode,
  });
}
