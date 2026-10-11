export const PLATFORM_NAME = "Bahamas Safety Compliance Platform";
export const RECOMMENDED_PRODUCT_NAME = "TridentSafety";

export const VISION_POINTS = [
  "Single source of truth for every safety-related activity across job sites, marinas, and facilities in The Bahamas.",
  "Replaces paper checklists, Excel trackers, WhatsApp photo trails, filing cabinets, disconnected email chains, and lost incident reports.",
  "Acts as the operating system of the entire business — inspections, workers, training, corrective actions, incidents, hurricane readiness, and client reporting in one place.",
  "Creates a premium, defensible compliance product that makes the BCSO service irreplaceable in the Bahamian market.",
];

export const NAMING_OPTIONS = [
  { name: "SafeSite Bahamas", rationale: "Clear, professional, location-specific." },
  { name: "GuardianOHS", rationale: "Signals protection and oversight." },
  { name: "ComplianceShield", rationale: "Emphasizes liability protection and formal reporting." },
  { name: "SiteWatch Bahamas", rationale: "Communicates vigilant monitoring of active sites." },
  { name: "TridentSafety", rationale: "Strong maritime identity with authority across construction and marine environments." },
];

export const USER_ROLES = [
  {
    title: "Field Inspector",
    audience: "BCSO employees",
    note: "Conducts on-site audits and creates operational evidence.",
    permissions: [
      "Create new inspections",
      "Take and upload photos/videos",
      "Tag violations by severity",
      "Assign corrective actions with deadlines",
      "Record toolbox talks",
      "Log PPE issuance",
      "Submit incident reports",
      "View only their assigned sites",
    ],
  },
  {
    title: "Safety Director",
    audience: "BCSO senior staff",
    note: "Oversees all inspectors, reporting, certifications, and client relationships.",
    permissions: [
      "Everything the Field Inspector can do",
      "View all sites across all clients",
      "Override violation severity ratings",
      "Approve or reject corrective action closures",
      "Generate executive reports",
      "Manage inspector assignments and schedules",
      "Access analytics dashboard",
      "Manage training curriculum and certification records",
    ],
  },
  {
    title: "Client Administrator",
    audience: "Contractor / Developer",
    note: "Receives view-only access to their own project data.",
    permissions: [
      "View only their own projects",
      "Download audit reports (PDF)",
      "View corrective action status",
      "View worker certification status for their employees",
      "Receive automated alerts for violations and missed deadlines",
      "Cannot edit or delete any data",
    ],
  },
  {
    title: "Worker",
    audience: "Individual construction / marine worker",
    note: "Self-service mobile access to personal safety records.",
    permissions: [
      "View own profile",
      "View training history and certification expiries",
      "Download digital certification cards",
      "Report a safety concern anonymously",
      "Acknowledge PPE receipt digitally",
      "Complete toolbox talk sign-in",
    ],
  },
  {
    title: "Government / Insurance Auditor",
    audience: "External viewer",
    note: "Aggregated and anonymized view for regulatory or underwriting use.",
    permissions: [
      "Read-only access to anonymized dashboards",
      "Industry-wide compliance statistics",
      "Incident trend reports without company names unless authorized",
      "No individual site data without explicit client permission",
    ],
  },
];

export const MODULES = [
  {
    title: "Site Management",
    status: "Foundation in place",
    summary: "Central registry of every job site, marina, vessel refit, and facility under oversight.",
    details: [
      "Site profile with address, island, GPS, client, contractor, value, dates, workforce, plans and status.",
      "Map view of The Bahamas with color-coded site compliance status.",
      "List and calendar views for scheduling and site activity.",
    ],
  },
  {
    title: "Inspection & Audit Engine",
    status: "Live foundation",
    summary: "Core mobile inspection system with photo evidence, severity scoring, and corrective actions.",
    details: [
      "Template-driven inspections with geo-tagged media.",
      "Compliant / Observation / Non-Compliant / Critical response model.",
      "Weather, GPS, signatures, and PDF report generation.",
    ],
  },
  {
    title: "Corrective Action Tracker",
    status: "Workflow live; escalation roadmap",
    summary: "Every issue becomes a tracked action until physically verified closed.",
    details: [
      "Open → In Progress → Pending Verification → Closed lifecycle.",
      "Priority-based due dates and escalation rules.",
      "Stop-work recommendation when multiple critical actions remain open.",
    ],
  },
  {
    title: "Worker Registry & Certification Management",
    status: "Planned",
    summary: "Worker profile system with QR-linked credentials, PPE history, and expiry alerts.",
    details: [
      "Training records and digital certificates.",
      "PPE issuance with signatures and serials.",
      "Certification expiry alerts and worker validation on site.",
    ],
  },
  {
    title: "Incident Reporting & Investigation",
    status: "Planned",
    summary: "Structured capture of near misses, injuries, property damage, and root cause analysis.",
    details: [
      "Incident classification, witness records, body part and injury mapping.",
      "Environmental conditions and PPE-in-use capture.",
      "Root cause and linked corrective actions.",
    ],
  },
  {
    title: "Training Management System",
    status: "Planned",
    summary: "Schedule, deliver, assess, certify, and renew training across all workforce categories.",
    details: [
      "Course catalog and scheduling.",
      "Attendance via QR sign-in.",
      "Digital certification and public verification portal.",
    ],
  },
  {
    title: "Toolbox Talks",
    status: "Planned",
    summary: "Daily safety briefings with digital sign-in and smart topic recommendations.",
    details: [
      "Multi-language talk library.",
      "Worker attendance tracking.",
      "Topic suggestions based on current hazards and season.",
    ],
  },
  {
    title: "Hurricane Preparedness",
    status: "Strategic differentiator",
    summary: "Bahamas-specific hurricane module with storm tracking, countdown checklists, and insurance evidence packs.",
    details: [
      "120h / 72h / 48h / 24h / post-storm workflows.",
      "Marina- and vessel-specific readiness tasks.",
      "Insurance documentation auto-compilation.",
    ],
  },
  {
    title: "Analytics & Executive Dashboard",
    status: "Roadmap",
    summary: "Leading and lagging indicators, client scorecards, and multi-site performance intelligence.",
    details: [
      "TRIR, DART, LTIFR, heat index, closure rates, training completion, and revenue metrics.",
      "Violation breakdowns, trendlines, and incident heat maps.",
      "Client scorecards and benchmarking.",
    ],
  },
  {
    title: "Anonymous Worker Reporting",
    status: "Planned",
    summary: "Whistleblower path for unsafe conditions without retaliation risk.",
    details: [
      "Accessible via app, QR, public web form, or SMS.",
      "No identifying info stored.",
      "Direct escalation to Safety Director and investigation workflow.",
    ],
  },
];

export const STACK_OPTIONS = [
  {
    title: "Option A — Custom Build",
    note: "Maximum control, maximum cost.",
    bullets: [
      "Next.js / React frontend, React Native or Flutter mobile app",
      "Node.js or Django API",
      "PostgreSQL + optional MongoDB",
      "S3 object storage, Auth0 / Firebase Auth, PDF generation, push notifications",
      "Estimated MVP cost: $80k–$150k · 4–6 months",
    ],
  },
  {
    title: "Option B — Low-Code / No-Code",
    note: "Fastest path with SaaS tools.",
    bullets: [
      "SafetyCulture, Procore, SiteDocs, Airtable, Notion, Google Forms, WhatsApp Business",
      "Estimated cost: $200–$3,000 / month depending on stack",
    ],
  },
  {
    title: "Option C — Hybrid Build (Recommended)",
    note: "Launch fast, then progressively replace SaaS components.",
    bullets: [
      "Phase 1: SafetyCulture + custom dashboard overlay",
      "Phase 2: Replace inspection engine and add incidents / analytics / hurricane module",
      "Phase 3: Full custom mobile app + AI risk scoring + public verification portal",
      "Estimated total staged development: $15k–$25k initially, then $40k–$60k and $30k–$50k expansion phases",
    ],
  },
];

export const OFFLINE_REQUIREMENTS = [
  "Inspectors download assigned site data before travelling to remote islands or cays.",
  "Checklist responses, media, and notes are stored locally on-device while offline.",
  "GPS continues to capture without internet.",
  "When connectivity returns, background sync uploads everything automatically.",
  "Sync status must be visible: Synced / Pending / Failed.",
];

export const ROADMAP_90_DAYS = [
  "Weeks 1–2 — Finalize requirements, select stack, hire developers",
  "Weeks 3–4 — Approve UI/UX wireframes",
  "Weeks 5–6 — Build Site Management + Authentication",
  "Weeks 7–8 — Build Inspection Engine with first template",
  "Weeks 9–10 — Build Corrective Action Tracker",
  "Weeks 11–12 — Build Worker Registry with QR codes",
  "Week 13 — Integrate photo capture, GPS tagging, and offline mode",
  "Week 14 — Build PDF report generation",
  "Week 15 — Add KPI dashboard",
  "Weeks 16–18 — Testing, bug fixes, beta with first clients",
  "Weeks 19–20 — Iterate and launch",
];
