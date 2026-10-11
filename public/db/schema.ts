import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export interface ControlsByTier {
  elimination: string[];
  substitution: string[];
  engineering: string[];
  administrative: string[];
  ppe: string[];
}

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  assessmentNo: text("assessment_no").notNull(),
  docType: text("doc_type").notNull().default("risk-assessment"),
  status: text("status").notNull().default("draft"), // draft | issued | review
  industry: text("industry").notNull().default("general"),
  organization: text("organization").notNull().default(""),
  department: text("department").notNull().default(""),
  location: text("location").notNull().default(""),
  activity: text("activity").notNull().default(""),
  assessmentDate: text("assessment_date").notNull().default(""),
  reviewDate: text("review_date").notNull().default(""),
  assessor: text("assessor").notNull().default(""),
  responsibleManager: text("responsible_manager").notNull().default(""),
  employeesExposed: integer("employees_exposed").notNull().default(0),
  jurisdiction: text("jurisdiction").notNull().default("both"), // osha | hse | both
  regulations: text("regulations").notNull().default(""),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at"),
  signedByStaffId: integer("signed_by_staff_id").references(() => staffUsers.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const hazards = pgTable("hazards", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  category: text("category").notNull().default(""),
  description: text("description").notNull().default(""),
  personsAtRisk: text("persons_at_risk").notNull().default(""),
  existingControls: text("existing_controls").notNull().default(""),
  likelihood: integer("likelihood").notNull().default(1),
  severity: integer("severity").notNull().default(1),
  controls: jsonb("controls")
    .$type<ControlsByTier>()
    .notNull()
    .default({ elimination: [], substitution: [], engineering: [], administrative: [], ppe: [] }),
  responsiblePerson: text("responsible_person").notNull().default(""),
  dueDate: text("due_date").notNull().default(""),
  residualLikelihood: integer("residual_likelihood").notNull().default(1),
  residualSeverity: integer("residual_severity").notNull().default(1),
});

export type AssessmentRow = typeof assessments.$inferSelect;
export type HazardRow = typeof hazards.$inferSelect;

/* ------------------------------------------------------------------ */
/*  FIELD OPERATIONS — multi-island subcontractor compliance model     */
/* ------------------------------------------------------------------ */

export interface PhotoEvidence {
  id: string;
  dataUrl: string;
  caption: string;
  takenAt: string; // device capture time (ISO)
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  uploadedAt: string; // server receipt time (ISO)
}

export type ItemSeverity = "critical" | "major" | "minor";
export type ItemStatus = "pending" | "pass" | "fail" | "na";
export type InspectionStatus =
  | "assigned"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "returned";

export type ReviewStage = "pending" | "reviewed" | "finalized" | "sent";
export type StaffRole = "reviewer" | "finalizer" | "admin";

export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trade: text("trade").notNull(), // electrical | plumbing | hvac | general
  island: text("island").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  accessCode: text("access_code").notNull(),
  sessionToken: text("session_token"),
  active: text("active").notNull().default("true"),
  // Admin-controlled permissions for this contractor
  permissions: jsonb("permissions")
    .$type<ContractorPermissions>()
    .notNull()
    .default({
      canSubmitPhotos: true,
      canAddNotes: true,
      canViewHistory: true,
      allowedTrades: [],
      restrictedToIslands: [],
      maxActiveJobs: 0,
    }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdByStaffId: integer("created_by_staff_id"),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  island: text("island").notNull(),
  propertyType: text("property_type").notNull().default("residential"),
  clientName: text("client_name").notNull().default(""),
  clientEmail: text("client_email").notNull().default(""),
  squareFeet: integer("square_feet").notNull().default(0),
  yearBuilt: integer("year_built").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export interface ContractorPermissions {
  canSubmitPhotos: boolean;
  canAddNotes: boolean;
  canViewHistory: boolean;
  allowedTrades: string[]; // [] means all trades allowed
  restrictedToIslands: string[]; // [] means all islands allowed
  maxActiveJobs: number; // 0 = unlimited
}

export const staffUsers = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  title: text("title").notNull().default(""),
  role: text("role").notNull().default("reviewer"), // reviewer | finalizer | admin
  accessCode: text("access_code").notNull(),
  sessionToken: text("session_token"),
  active: text("active").notNull().default("true"),
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdByStaffId: integer("created_by_staff_id"),
});

export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Bahamas Compliance & Safety Oversight Ltd. (BCSO)"),
  address: text("address").notNull().default("Nassau, New Providence, The Bahamas"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  managingDirector: text("managing_director").notNull().default(""),
  logoDataUrl: text("logo_data_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => contractors.id, { onDelete: "cascade" }),
  trade: text("trade").notNull(),
  status: text("status").notNull().default("assigned"),
  reviewStage: text("review_stage").notNull().default("pending"), // pending | reviewed | finalized | sent
  scheduledFor: text("scheduled_for").notNull().default(""),
  adminNote: text("admin_note").notNull().default(""),
  complianceScore: integer("compliance_score"),
  reportNo: text("report_no"),
  clientNotifiedAt: timestamp("client_notified_at"),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByStaffId: integer("reviewed_by_staff_id").references(() => staffUsers.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  finalizedAt: timestamp("finalized_at"),
  finalizedByStaffId: integer("finalized_by_staff_id").references(() => staffUsers.id, { onDelete: "set null" }),
  sentByStaffId: integer("sent_by_staff_id").references(() => staffUsers.id, { onDelete: "set null" }),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  label: text("label").notNull(),
  requirement: text("requirement").notNull().default(""), // Bahamian statutory reference
  severity: text("severity").notNull().default("major"), // critical | major | minor
  status: text("status").notNull().default("pending"), // pending | pass | fail | na
  note: text("note").notNull().default(""),
  photos: jsonb("photos").$type<PhotoEvidence[]>().notNull().default([]),
});

export const reportDeliveries = pgTable("report_deliveries", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  sentByStaffId: integer("sent_by_staff_id").references(() => staffUsers.id, { onDelete: "set null" }),
  recipientName: text("recipient_name").notNull().default(""),
  recipientEmail: text("recipient_email").notNull().default(""),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull().default(""),
  deliveryMethod: text("delivery_method").notNull().default("smtp"), // smtp | simulated
  deliveryStatus: text("delivery_status").notNull().default("queued"), // queued | sent | simulated | failed
  providerMessageId: text("provider_message_id"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Re-inspection against the failed items of a prior approved inspection. */
export const reInspections = pgTable("re_inspections", {
  id: serial("id").primaryKey(),
  certRef: text("cert_ref").notNull(), // BCSO-CERT-2026-XXXX
  originalInspectionId: integer("original_inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => contractors.id, { onDelete: "cascade" }),
  // "bcso" = BCSO network repaired → cert is free; "outside" = client hired own → $250 BSD fee
  remediationBy: text("remediation_by").notNull().default("outside"),
  feeCharged: integer("fee_charged").notNull().default(250), // BSD
  status: text("status").notNull().default("assigned"), // assigned | in_progress | passed | failed
  scheduledFor: text("scheduled_for").notNull().default(""),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  certIssuedAt: timestamp("cert_issued_at"),
  issuedByStaffId: integer("issued_by_staff_id").references(() => staffUsers.id, { onDelete: "set null" }),
  managingDirector: text("managing_director").notNull().default(""),
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Line items for the re-inspection — sourced from the original failed items. */
export const reInspectionItems = pgTable("re_inspection_items", {
  id: serial("id").primaryKey(),
  reInspectionId: integer("re_inspection_id")
    .notNull()
    .references(() => reInspections.id, { onDelete: "cascade" }),
  originalItemId: integer("original_item_id")
    .notNull()
    .references(() => checklistItems.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  requirement: text("requirement").notNull().default(""),
  severity: text("severity").notNull().default("major"),
  status: text("status").notNull().default("pending"), // pending | pass | fail
  note: text("note").notNull().default(""),
  photos: jsonb("photos").$type<PhotoEvidence[]>().notNull().default([]),
});

export type ContractorRow = typeof contractors.$inferSelect;
export type PropertyRow = typeof properties.$inferSelect;
export type StaffUserRow = typeof staffUsers.$inferSelect;
export type InspectionRow = typeof inspections.$inferSelect;
export type ChecklistItemRow = typeof checklistItems.$inferSelect;
export type ReportDeliveryRow = typeof reportDeliveries.$inferSelect;
export type CompanySettingsRow = typeof companySettings.$inferSelect;
export type ReInspectionRow = typeof reInspections.$inferSelect;
export type ReInspectionItemRow = typeof reInspectionItems.$inferSelect;

/* ------------------------------------------------------------------ */
/*  WORKER REGISTRY & TRAINING                                         */
/* ------------------------------------------------------------------ */

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  dob: text("dob").notNull().default(""),
  nationality: text("nationality").notNull().default("Bahamian"),
  primaryLanguage: text("primary_language").notNull().default("English"),
  employer: text("employer").notNull().default(""), // Subcontractor name
  trade: text("trade").notNull(),
  qrCode: text("qr_code").unique(),
  activeSiteId: integer("active_site_id").references(() => properties.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  courseName: text("course_name").notNull(),
  certNumber: text("cert_number").notNull(),
  issueDate: text("issue_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  status: text("status").notNull().default("current"), // current | expiring | expired
});

/* ------------------------------------------------------------------ */
/*  HURRICANE PREPAREDNESS                                             */
/* ------------------------------------------------------------------ */

export const hurricaneChecklists = pgTable("hurricane_checklists", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  phase: text("phase").notNull(), // 120h | 72h | 48h | 24h | post-storm
  status: text("status").notNull().default("open"), // open | in_progress | completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  completedByStaffId: integer("completed_by_staff_id").references(() => staffUsers.id),
  items: jsonb("items").$type<{ label: string; checked: boolean; note: string; photoUrl?: string }[]>().notNull().default([]),
});

/* ------------------------------------------------------------------ */
/*  INCIDENT REPORTING                                                 */
/* ------------------------------------------------------------------ */

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentNo: text("incident_no").notNull(),
  siteId: integer("site_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  classification: text("classification").notNull(), // near-miss | first-aid | medical | lti | fatality
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  status: text("status").notNull().default("open"), // open | investigation | closed
  reportedBy: text("reported_by").notNull(),
  photos: jsonb("photos").$type<PhotoEvidence[]>().notNull().default([]),
  signatureData: text("signature_data"), // Data URL of the signature
  signedAt: timestamp("signed_at"),
  signedByStaffId: integer("signed_by_staff_id").references(() => staffUsers.id),
});

/* ------------------------------------------------------------------ */
/*  TOOLBOX TALKS                                                      */
/* ------------------------------------------------------------------ */

export const toolboxTalks = pgTable("toolbox_talks", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
  deliveredBy: text("delivered_by").notNull(), // usually foreman
  contentSummary: text("content_summary"),
  attendeeCount: integer("attendee_count").notNull().default(0),
});

/* ------------------------------------------------------------------ */
/*  INVOICING                                                          */
/* ------------------------------------------------------------------ */

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull(), // BCSO-INV-2025-XXXX
  inspectionId: integer("inspection_id").references(() => inspections.id, { onDelete: "set null" }),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // in BSD cents or whole depending on convention
  status: text("status").notNull().default("draft"), // draft | sent | paid | void
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  courseId: text("course_id").notNull(),
  courseName: text("course_name").notNull(),
  instructorId: integer("instructor_id").references(() => staffUsers.id, { onDelete: "set null" }),
  instructorName: text("instructor_name").notNull(),
  location: text("location").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  maxEnrollment: integer("max_enrollment").notNull().default(20),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  status: text("status").notNull().default("scheduled"), // scheduled | in_progress | completed | cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WorkerRow = typeof workers.$inferSelect;
export type TrainingSessionRow = typeof trainingSessions.$inferSelect;
export type CertificationRow = typeof certifications.$inferSelect;
export type HurricaneChecklistRow = typeof hurricaneChecklists.$inferSelect;
export type IncidentRow = typeof incidents.$inferSelect;
export type ToolboxTalkRow = typeof toolboxTalks.$inferSelect;
export type InvoiceRow = typeof invoices.$inferSelect;
