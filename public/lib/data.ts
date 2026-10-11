import type { HazardTemplate, Industry, Jurisdiction, HazardDraft } from "./types";
import type { ControlsByTier } from "@/db/schema";

/* ------------------------------------------------------------------ */
/*  Industries                                                         */
/* ------------------------------------------------------------------ */

export const INDUSTRIES: Industry[] = [
  { id: "construction", name: "Construction & Trades", blurb: "Sites, refurbishment, plant operations and work at height.", tasks: ["General site operations", "Roofing and access work", "Groundworks and excavation", "Fit-out and finishing"] },
  { id: "manufacturing", name: "Manufacturing & Engineering", blurb: "Machinery, production lines, maintenance and materials.", tasks: ["Production line operation", "Machine maintenance", "Fabrication and welding", "Goods-in and despatch"] },
  {
    id: "office",
    name: "Office & Commercial",
    blurb: "Corporate workplaces, DSE work, building services and facilities management.",
    tasks: [
      "General office work and administration",
      "Reception, front-of-house and client-facing areas",
      "Meeting rooms, boardrooms and conference facilities",
      "Open-plan floor and hot-desking areas",
      "Server rooms and IT infrastructure areas",
      "Printing, scanning and document-management areas",
      "Staff kitchen, break room and pantry",
      "Storerooms, filing rooms and archive areas",
      "Corridors, stairwells and communal circulation routes",
      "Car park and external approaches",
      "Building services and facilities maintenance",
      "Cleaning and custodial operations",
      "Mailroom and goods-in/delivery areas",
      "Security desk and access-control points",
      "Loading bay and ground-floor service areas",
    ],
  },
  { id: "warehouse", name: "Warehousing & Logistics", blurb: "Racking, forklifts, manual handling and despatch.", tasks: ["Forklift and picking operations", "Loading bay operations", "Racking and stock storage", "Despatch and delivery"] },
  { id: "healthcare", name: "Healthcare & Care", blurb: "Clinical environments, patient handling and biological risk.", tasks: ["Ward and clinical care", "Facilities and portering", "Laboratory work", "Community and home visits"] },
  { id: "hospitality", name: "Hospitality & Catering", blurb: "Kitchens, service areas, events and housekeeping.", tasks: ["Kitchen and food preparation", "Front-of-house service", "Housekeeping operations", "Events and functions"] },
  { id: "retail", name: "Retail", blurb: "Stores, stockrooms, customers and lone working.", tasks: ["Shop floor operations", "Stockroom and deliveries", "Checkout and customer service", "Opening and closing"] },
  { id: "facilities", name: "Facilities & Property", blurb: "Building maintenance, contractors and planned works.", tasks: ["Planned preventive maintenance", "Reactive repairs", "Contractor management", "Cleaning and soft services"] },
  { id: "education", name: "Education", blurb: "Schools, campuses, practical teaching and visitors.", tasks: ["Classroom and general teaching", "Practical workshops and labs", "Grounds and maintenance", "Sports and events"] },
  { id: "general", name: "General Workplace", blurb: "Cross-industry baseline assessment for any workplace.", tasks: ["Day-to-day operations", "General maintenance", "Office and admin work", "Site-wide activities"] },
];

/* ------------------------------------------------------------------ */
/*  Baseline regulatory references                                     */
/* ------------------------------------------------------------------ */

const OSHA_BASELINE = [
  "OSH Act Section 5(a)(1) — General Duty Clause",
  "29 CFR 1910 Subpart I — Personal Protective Equipment",
];

const HSE_BASELINE = [
  "Health and Safety at Work etc. Act 1974",
  "Management of Health and Safety at Work Regulations 1999",
];

/* Bahamian statutory baseline — the applicable law for workplaces in The Bahamas. */
const BAHAMAS_BASELINE = [
  "Health and Safety at Work Act 2002 (No. 2 of 2002, Ch. 321C) — principal OSH statute",
  "Health and Safety at Work Act 2002, s.4 — employer's general duty: health, safety and welfare at work, so far as is reasonably practicable",
  "Employment Act 2001 (No. 27 of 2001, Ch. 321A)",
  "Health and Safety at Work Act 2002, s.22 — health and safety committee required where 20 or more persons are employed",
  "Department of Labour — Labour Inspection Section (competent national authority for OSH; hazard reporting and workplace inspection)",
];

/** Precedence notice inserted at the head of the references when international guidance is included. */
export const BAHAMAS_PRECEDENCE_NOTE =
  "NOTE — Bahamian law takes precedence. Where The Bahamas has no specific standard, the international references below (OSHA / UK HSE) are applied as recognized good practice only and do not create additional legal duties.";

const GENERIC_BAHAMAS_REFS = [
  "Health and Safety at Work Act 2002, s.4 — general duty of care (safe plant, systems of work, information, training and supervision)",
  "Department of Labour — Labour Inspection Section guidance",
];

/** Hazard-specific Bahamian statutory and departmental references. */
const BAHAMAS_REFS: Record<string, string[]> = {
  "governance-committee": [
    "Health and Safety at Work Act 2002, s.22 — Health and Safety Committee required where 20 or more persons are employed",
    "Health and Safety at Work Act 2002, s.4 — provision of such information, instruction, training and supervision as is necessary",
    "Department of Labour — guidance on joint consultation and safety delegates",
  ],
  "ceiling-failure": [
    "Health and Safety at Work Act 2002, s.4 — maintenance of a safe place of work and safe means of access",
    "Building Control Division — Ministry of Works & Utilities (structural condition of occupied buildings)",
  ],
  electrical: [
    "Health and Safety at Work Act 2002, s.4 — provision and maintenance of safe plant and systems of work",
    "Licensed electrical contractor requirements — Bahamas Power & Light / Ministry responsible for electricity (installations to recognized standards)",
  ],
  "slips-trips": [
    "Health and Safety at Work Act 2002, s.4 — safe means of access to and egress from the place of work",
    "Department of Labour — Labour Inspection Section housekeeping expectations",
  ],
  "manual-handling": [
    "Health and Safety at Work Act 2002, s.4 — safe systems of work; information, instruction, training and supervision",
  ],
  "work-at-height": [
    "Health and Safety at Work Act 2002, s.4 — safe systems of work and adequate supervision",
    "Department of Labour — inspection of construction and maintenance work sites",
  ],
  machinery: [
    "Health and Safety at Work Act 2002, s.4 — provision and maintenance of safe plant",
    "Health and Safety at Work Act 2002 — recognized codes of practice (machine guarding)",
  ],
  forklift: [
    "Health and Safety at Work Act 2002, s.4 — safe systems of work",
    "Health and Safety at Work Act 2002, s.5 — duty to persons other than employees (pedestrians, visitors, contractors)",
  ],
  "hazardous-substances": [
    "Health and Safety at Work Act 2002, s.3(1)(c) & s.4 — control of dangerous substances; safe use, handling, storage and transport",
    "Environmental Health Services Act — Department of Environmental Health Services (DEHS)",
  ],
  noise: [
    "Health and Safety at Work Act 2002, s.4 — working environment safe, without risks to health, and adequate welfare arrangements",
  ],
  fire: [
    "Health and Safety at Work Act 2002, s.3(1)(c) — control of explosive and highly flammable substances",
    "Bahamas Fire Service — fire prevention, detection and evacuation requirements",
    "Health and Safety at Work Act 2002, s.4 — safe premises and safe means of access and egress",
  ],
  dse: ["Health and Safety at Work Act 2002, s.4 — working environment and facilities for welfare at work"],
  stress: [
    "Health and Safety at Work Act 2002, s.4 — duty to ensure health at work (including mental well-being), so far as is reasonably practicable",
  ],
  "lone-working": ["Health and Safety at Work Act 2002, s.4 — safe systems of work and adequate supervision"],
  violence: [
    "Health and Safety at Work Act 2002, s.4 & s.5 — protection of employees and others affected by work activities",
  ],
  biological: [
    "Environmental Health Services Act — DEHS (sanitation, hygiene and control of communicable conditions)",
    "Health and Safety at Work Act 2002, s.4 — working environment without risks to health",
  ],
  "kitchen-burns": [
    "Environmental Health Services Act — DEHS food premises requirements and food handler certification",
    "Health and Safety at Work Act 2002, s.4 — safe plant and systems of work",
  ],
  "falling-objects-racking": [
    "Health and Safety at Work Act 2002, s.4 — safety in the use, handling and storage of articles",
  ],
  "confined-space": [
    "Health and Safety at Work Act 2002, s.4 — safe systems of work for high-risk operations",
    "Department of Labour — permit-to-work expectations (recognized codes of practice)",
  ],
  loto: [
    "Health and Safety at Work Act 2002, s.4 — safe plant and systems of work; information, instruction, training and supervision",
  ],
  vibration: ["Health and Safety at Work Act 2002, s.4 — working environment safe and without risks to health"],
  silica: [
    "Health and Safety at Work Act 2002, s.4 — working environment without risks to health",
    "Department of Environmental Health Services — occupational hygiene and dust concerns reporting",
  ],
  asbestos: [
    "Environmental Health Services Act — DEHS (hazardous materials and waste disposal)",
    "Department of Environmental Health Services — notification good practice for asbestos disturbance/removal",
  ],
  "housekeeping-egress": [
    "Health and Safety at Work Act 2002, s.4 — safe means of access to and egress from the place of work",
    "Bahamas Fire Service — unobstructed means of escape",
  ],
  lighting: ["Health and Safety at Work Act 2002, s.4 — adequate working environment and welfare arrangements"],
  sharps: [
    "Health and Safety at Work Act 2002, s.4 — safe systems of work",
    "Environmental Health Services Act — DEHS management of biomedical and sharps waste",
  ],
  "pressure-systems": [
    "Health and Safety at Work Act 2002, s.4 — provision and maintenance of safe plant",
    "Department of Labour — examination of pressure plant by competent persons (recognized codes of practice)",
  ],
};

export function bahamasRefsFor(key?: string): string[] {
  return (key && BAHAMAS_REFS[key]) || GENERIC_BAHAMAS_REFS;
}

const INTL_SEPARATOR = "— — — International good practice references (non-statutory under Bahamian law) — — —";

export function compileRegulations(jurisdiction: Jurisdiction, hazardDrafts: HazardDraft[]): string {
  const refs: string[] = [];
  const push = (r: string) => {
    if (!refs.includes(r)) refs.push(r);
  };
  if (jurisdiction === "bahamas" || jurisdiction === "bahamas-intl") {
    if (jurisdiction === "bahamas-intl") push(BAHAMAS_PRECEDENCE_NOTE);
    BAHAMAS_BASELINE.forEach(push);
    hazardDrafts.forEach((h) => (h.bahamasRefs.length ? h.bahamasRefs : GENERIC_BAHAMAS_REFS).forEach(push));
  }
  if (jurisdiction === "osha" || jurisdiction === "both" || jurisdiction === "bahamas-intl") {
    if (jurisdiction === "bahamas-intl") refs.push(INTL_SEPARATOR);
    OSHA_BASELINE.forEach(push);
    hazardDrafts.forEach((h) => h.oshaRefs.forEach(push));
  }
  if (jurisdiction === "hse" || jurisdiction === "both" || jurisdiction === "bahamas-intl") {
    HSE_BASELINE.forEach(push);
    hazardDrafts.forEach((h) => h.hseRefs.forEach(push));
  }
  return refs.join("\n");
}

/** Instantiate a library template as an editable wizard hazard. */
export function templateToDraft(t: HazardTemplate): HazardDraft {
  const residualLikelihood = Math.max(1, t.likelihood - 2);
  return {
    uid: crypto.randomUUID(),
    category: t.category,
    description: t.description,
    personsAtRisk: t.personsAtRisk,
    existingControls: t.existingControls,
    likelihood: t.likelihood,
    severity: t.severity,
    controls: JSON.parse(JSON.stringify(t.controls)) as ControlsByTier,
    responsiblePerson: t.responsiblePerson,
    dueDate: "",
    residualLikelihood,
    residualSeverity: t.severity,
    bahamasRefs: bahamasRefsFor(t.key),
    oshaRefs: [...t.oshaRefs],
    hseRefs: [...t.hseRefs],
  };
}

export const JURISDICTION_OPTIONS: { id: Jurisdiction; label: string; note: string }[] = [
  { id: "bahamas", label: "The Bahamas — Statutory", note: "HSW Act 2002, Employment Act 2001, Dept. of Labour, DEHS" },
  { id: "bahamas-intl", label: "Bahamas + Intl. Good Practice", note: "Bahamian law precedence; OSHA/HSE cited where national standards are silent" },
  { id: "osha", label: "OSHA (US)", note: "29 CFR 1910 / 1926 series references" },
  { id: "hse", label: "HSE (UK)", note: "HSWA 1974, MHSWR 1999 & topic regulations" },
  { id: "both", label: "OSHA + HSE", note: "Both international frameworks side-by-side" },
];

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  bahamas: "The Bahamas — Statutory",
  "bahamas-intl": "Bahamas + Intl. Good Practice",
  osha: "OSHA (US)",
  hse: "HSE (UK)",
  both: "OSHA + HSE",
};

/* ------------------------------------------------------------------ */
/*  Hazard library — pre-engineered controls via the hierarchy         */
/* ------------------------------------------------------------------ */

const EVERYWHERE = ["construction", "manufacturing", "office", "warehouse", "healthcare", "hospitality", "retail", "facilities", "education", "general"];

export const HAZARD_LIBRARY: HazardTemplate[] = [
  {
    key: "governance-committee",
    category: "Safety Management / Governance",
    description: "Inadequate oversight, reporting and management of workplace risks — lack of a structured internal safety forum.",
    personsAtRisk: "All employees, visitors and contractors; the organization remains reactive to hazards rather than proactive.",
    existingControls: "Informal reporting of hazards to management; no structured consultation or committee in place.",
    likelihood: 3,
    severity: 3,
    industries: EVERYWHERE,
    responsiblePerson: "Director / Senior Management",
    controls: {
      elimination: [],
      substitution: [],
      engineering: [],
      administrative: [
        "Establish a formal Health and Safety Committee with representatives from different departments/areas of the workplace.",
        "The committee acts as the first line of defense: identifying, managing, and reporting risks found in their respective areas.",
        "Conduct monthly safety walkthroughs and committee meetings to review findings and incident reports.",
        "Maintain minutes of all safety committee meetings as a record of statutory consultation.",
        "Provide training to committee members on hazard identification and risk assessment methodologies.",
      ],
      ppe: [],
    },
    oshaRefs: ["29 CFR 1910.1200 — General management responsibility", "OSHA Safety and Health Management Systems guidance"],
    hseRefs: ["Health and Safety at Work etc. Act 1974, s.2 — Safety Committees", "Management of Health and Safety at Work Regulations 1999"],
  },
  {
    key: "ceiling-failure",
    category: "Structural / Falling Material",
    description: "Deteriorated ceiling materials, including loose, damaged or potentially falling sections.",
    personsAtRisk: "Employees, contractors, visitors and maintenance personnel could be struck by falling material, resulting in cuts, bruising, head injuries or potentially serious injury.",
    existingControls: "Visual condition noted during routine walkthroughs; no formal inspection regime in place.",
    likelihood: 4,
    severity: 4,
    industries: ["office", "facilities", "retail", "education", "hospitality", "warehouse", "general"],
    responsiblePerson: "Facilities / Building Manager",
    controls: {
      elimination: ["Remove damaged ceiling material and eliminate access to unsafe areas."],
      substitution: ["Replace deteriorated construction materials with suitable, durable materials."],
      engineering: [
        "Have the ceiling inspected by a competent/qualified person.",
        "Repair or replace structurally compromised sections.",
        "Install suitable protective barriers where falling-object exposure remains during repair.",
      ],
      administrative: [
        "Restrict access to affected areas.",
        "Establish an inspection and maintenance schedule.",
        "Report and document deterioration.",
        "Do not allow employees to work beneath visibly unstable sections.",
      ],
      ppe: ["Appropriate head protection and other PPE for authorized personnel performing repair work, based on the hazard assessment."],
    },
    oshaRefs: ["29 CFR 1910.22 — Walking-Working Surfaces", "29 CFR 1910.28 — Duty to Have Fall Protection and Falling Object Protection"],
    hseRefs: ["Workplace (Health, Safety and Welfare) Regulations 1992", "Work at Height Regulations 2005"],
  },
  {
    key: "electrical",
    category: "Electrical",
    description: "Damaged electrical equipment, defective power cords or unsafe electrical installations.",
    personsAtRisk: "Employees, contractors and maintenance personnel could experience electric shock, burns, electrical fire or fatal electrocution.",
    existingControls: "Ad hoc visual checks by users; equipment removed when visibly damaged.",
    likelihood: 3,
    severity: 5,
    industries: EVERYWHERE,
    responsiblePerson: "Facilities Manager / Qualified Electrical Contractor",
    controls: {
      elimination: ["Remove defective electrical equipment from service."],
      substitution: ["Replace defective equipment with properly rated equipment."],
      engineering: [
        "Electrical inspection and repair by appropriately qualified personnel.",
        "Proper grounding and suitable protective devices (RCD/GFCI, circuit protection).",
        "Protect cables from mechanical damage (routing, covers, strain relief).",
      ],
      administrative: [
        "Electrical inspection program for portable and fixed equipment.",
        "Defect reporting procedure.",
        "Lockout/tagout where applicable.",
        "Restrict electrical work to authorized/qualified personnel.",
      ],
      ppe: ["Electrical PPE appropriate to the specific task and electrical hazard (rated gloves, face protection, arc-rated clothing where required)."],
    },
    oshaRefs: ["29 CFR 1910 Subpart S — Electrical", "29 CFR 1910.303 — General Requirements", "29 CFR 1910.147 — Control of Hazardous Energy"],
    hseRefs: ["Electricity at Work Regulations 1989", "Provision and Use of Work Equipment Regulations 1998"],
  },
  {
    key: "slips-trips",
    category: "Slips, Trips & Falls",
    description: "Wet, contaminated or uneven floor surfaces; trailing cables and obstructions in walkways.",
    personsAtRisk: "Employees, contractors and visitors could slip or trip, sustaining sprains, fractures or head injuries.",
    existingControls: "Cleaning schedules; wet-floor signage used during cleaning.",
    likelihood: 4,
    severity: 3,
    industries: EVERYWHERE,
    responsiblePerson: "Site / Office Manager",
    controls: {
      elimination: ["Remove unnecessary level changes, mats with curled edges and trailing cable runs."],
      substitution: ["Specify slip-resistant flooring in areas prone to contamination."],
      engineering: ["Repair damaged flooring and potholes.", "Improve drainage and entrance matting.", "Provide permanent cable management/trunking."],
      administrative: ["Clean-as-you-go housekeeping standard.", "Spill response procedure with barriers and signage.", "Routine walkway inspections.", "Suitable footwear policy where floors are contaminated."],
      ppe: ["Slip-resistant footwear for roles working on contaminated or outdoor surfaces."],
    },
    oshaRefs: ["29 CFR 1910.22 — Walking-Working Surfaces"],
    hseRefs: ["Workplace (Health, Safety and Welfare) Regulations 1992 — Regulation 12"],
  },
  {
    key: "manual-handling",
    category: "Manual Handling",
    description: "Lifting, carrying, pushing or pulling loads — heavy, awkward or repetitive handling tasks.",
    personsAtRisk: "Employees performing handling tasks could suffer musculoskeletal injuries including back, shoulder and joint damage.",
    existingControls: "Basic manual handling awareness given at induction.",
    likelihood: 4,
    severity: 3,
    industries: ["construction", "manufacturing", "warehouse", "healthcare", "retail", "facilities", "education", "hospitality", "general"],
    responsiblePerson: "Operations Manager",
    controls: {
      elimination: ["Redesign the task to avoid manual handling (mechanised transfer, delivery to point of use)."],
      substitution: ["Break loads into smaller, lighter units.", "Order materials in reduced unit weights."],
      engineering: ["Provide mechanical aids — trolleys, pallet trucks, hoists, conveyors, patient-handling equipment.", "Adjust working heights to reduce bending and reaching."],
      administrative: ["Task-specific manual handling training.", "Team-lift rules for loads above guidance weights.", "Job rotation for repetitive handling.", "Individual risk assessment for manual handling operations."],
      ppe: ["Safety footwear and gloves appropriate to the load and environment."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause", "NIOSH Lifting Equation (guidance)"],
    hseRefs: ["Manual Handling Operations Regulations 1992"],
  },
  {
    key: "work-at-height",
    category: "Work at Height",
    description: "Work at height including roofs, ladders, scaffolds, MEWPs and fragile surfaces — falls of persons and materials.",
    personsAtRisk: "Employees and contractors working at height, and persons below, could suffer major or fatal injuries from falls or falling objects.",
    existingControls: "Ladders provided; no formal work-at-height planning or inspection regime.",
    likelihood: 3,
    severity: 5,
    industries: ["construction", "warehouse", "facilities", "manufacturing", "education", "general"],
    responsiblePerson: "Site Manager / Contract Supervisor",
    controls: {
      elimination: ["Avoid work at height — complete tasks from ground level or from permanent platforms where practicable."],
      substitution: ["Use extendable tools, ground-level servicing, or relocate equipment to accessible positions."],
      engineering: ["Use scaffolding, MEWPs or tower scaffolds erected by competent persons.", "Edge protection, guardrails and toe boards.", "Fragile surface identification, covers and warning signage.", "Fall arrest systems with suitable anchorages where collective protection is not practicable."],
      administrative: ["Work-at-height permit and rescue plan.", "Pre-use inspections of access equipment (daily/weekly as applicable).", "No ladder work except low-risk, short-duration tasks.", "Exclusion zones below overhead work."],
      ppe: ["Harnesses with inspected lanyards where fall arrest is used, hard hats with chin straps, safety footwear."],
    },
    oshaRefs: ["29 CFR 1910.28 — Duty to Have Fall Protection", "29 CFR 1926 Subpart M — Fall Protection (construction)"],
    hseRefs: ["Work at Height Regulations 2005"],
  },
  {
    key: "machinery",
    category: "Machinery & Entanglement",
    description: "Moving machinery with unguarded or accessible dangerous parts — entanglement, crushing, ejection and cutting.",
    personsAtRisk: "Operators, maintenance staff and nearby employees could suffer amputation, crush injuries or entanglement leading to serious or fatal injury.",
    existingControls: "Fixed guards fitted on some machines; operator instruction at induction.",
    likelihood: 3,
    severity: 5,
    industries: ["manufacturing", "construction", "warehouse", "education"],
    responsiblePerson: "Production / Engineering Manager",
    controls: {
      elimination: ["Remove or decommission machines that cannot be adequately guarded."],
      substitution: ["Replace hazardous machinery with inherently safer designs (enclosed, automated)."],
      engineering: ["Fixed and interlocked guards on all dangerous parts.", "Emergency stop devices within reach.", "Two-hand controls, hold-to-run and anti-restart protection where required.", "Physical separation of automated cells."],
      administrative: ["Safe systems of work for operation, cleaning and clearing blockages.", "Lockout/tagout for maintenance and jam clearance.", "Competency-based operator training and authorization.", "Pre-use checks and statutory inspections of work equipment."],
      ppe: ["As identified by the task assessment — eye protection, hearing protection, close-fitting workwear; no loose clothing or jewellery."],
    },
    oshaRefs: ["29 CFR 1910.212 — General Requirements for All Machines", "29 CFR 1910.147 — Control of Hazardous Energy"],
    hseRefs: ["Provision and Use of Work Equipment Regulations 1998 (PUWER)"],
  },
  {
    key: "forklift",
    category: "Workplace Transport",
    description: "Forklift trucks and vehicle movements in areas shared with pedestrians — collision, overturn and load loss.",
    personsAtRisk: "Pedestrian employees, visitors and drivers could be struck, crushed or pinned by vehicles or falling loads, causing major or fatal injury.",
    existingControls: "Marked pedestrian walkways in main aisles; licensed operators only.",
    likelihood: 3,
    severity: 5,
    industries: ["warehouse", "manufacturing", "construction", "retail"],
    responsiblePerson: "Warehouse / Logistics Manager",
    controls: {
      elimination: ["Eliminate reversing where practicable (one-way systems, drive-through loading)."],
      substitution: ["Use pedestrian-controlled equipment or conveyors for suitable movements."],
      engineering: ["Physical segregation of vehicles and pedestrians — barriers and gates.", "Speed limiters, blue-light/audible warnings and mirrors.", "Racking protection and corner guards."],
      administrative: ["Traffic management plan with marked routes and crossing points.", "Trained, authorized and supervised operators only.", "Daily pre-use vehicle checks with defect reporting.", "Hi-visibility requirement in operational areas; no pedestrian access during picking where segregated routes cannot be maintained."],
      ppe: ["High-visibility clothing and safety footwear in all operational areas."],
    },
    oshaRefs: ["29 CFR 1910.178 — Powered Industrial Trucks", "29 CFR 1910.176 — Materials Handling and Storage"],
    hseRefs: ["Workplace (Health, Safety and Welfare) Regulations 1992 — Regulation 17", "HSE Approved Code of Practice — Rider-operated Lift Trucks (L117)"],
  },
  {
    key: "hazardous-substances",
    category: "Hazardous Substances",
    description: "Use, storage or generation of hazardous chemicals, dusts, fumes and mists.",
    personsAtRisk: "Employees handling or exposed to substances could suffer dermatitis, respiratory illness, chemical burns or long-term occupational disease.",
    existingControls: "Safety data sheets held on file; decanted chemicals in labelled containers.",
    likelihood: 3,
    severity: 4,
    industries: ["manufacturing", "construction", "healthcare", "hospitality", "facilities", "education"],
    responsiblePerson: "Operations / HSE Manager",
    controls: {
      elimination: ["Eliminate use of the most hazardous substances where the task can be completed without them."],
      substitution: ["Substitute with less hazardous equivalents (water-based, low-vapour, granule instead of powder)."],
      engineering: ["Local exhaust ventilation at points of generation.", "Closed transfer systems and ventilated storage cabinets.", "Bunds and spill containment for liquids."],
      administrative: ["Substance-specific risk assessments using current safety data sheets.", "Permit, labelling and storage segregation procedures.", "Hygiene regime and health surveillance where required.", "Emergency eyewash/shower provision and spill response procedure."],
      ppe: ["Respiratory protection, chemical-resistant gloves, eye protection and protective clothing as identified per substance."],
    },
    oshaRefs: ["29 CFR 1910.1200 — Hazard Communication", "29 CFR 1910 Subpart Z — Toxic and Hazardous Substances"],
    hseRefs: ["Control of Substances Hazardous to Health Regulations 2002 (COSHH)"],
  },
  {
    key: "noise",
    category: "Noise",
    description: "Prolonged exposure to high noise levels from plant, machinery or processes.",
    personsAtRisk: "Employees working in noisy areas could suffer noise-induced hearing loss and tinnitus; communication masking may also obscure warnings.",
    existingControls: "Hearing protection available in stores; signage outside loud areas.",
    likelihood: 4,
    severity: 3,
    industries: ["manufacturing", "construction", "hospitality"],
    responsiblePerson: "Production / Site Manager",
    controls: {
      elimination: ["Eliminate noisy processes or relocate them away from occupied areas."],
      substitution: ["Procure low-noise machinery ('buy quiet' policy); use alternative quieter processes."],
      engineering: ["Acoustic enclosures, screens and silencers.", "Damping of vibrating surfaces; maintenance of bearings and mounts.", "Designated refuges/quiet rooms."],
      administrative: ["Noise assessment and exposure monitoring.", "Hearing protection zones with mandatory signage.", "Job rotation to limit exposure duration.", "Hearing conservation programme including audiometry."],
      ppe: ["Correctly fitted hearing protection selected for the measured noise level (SNR/HML)."],
    },
    oshaRefs: ["29 CFR 1910.95 — Occupational Noise Exposure"],
    hseRefs: ["Control of Noise at Work Regulations 2005"],
  },
  {
    key: "fire",
    category: "Fire",
    description: "Ignition sources, combustible storage and potential obstruction of escape routes creating fire risk.",
    personsAtRisk: "All employees, contractors and visitors could suffer burns, smoke inhalation or fatal injury; significant property and business continuity loss.",
    existingControls: "Extinguishers in place; fire alarm installed; escape routes signed.",
    likelihood: 2,
    severity: 5,
    industries: EVERYWHERE,
    responsiblePerson: "Responsible Person / Fire Safety Manager",
    controls: {
      elimination: ["Remove flammable materials not required for operations; prohibit open flames and unauthorised heaters."],
      substitution: ["Use fire-retardant materials and furniture; substitute flammable liquids with non-flammable alternatives."],
      engineering: ["Fire detection and alarm systems maintained and tested.", "Fire-resisting doors, compartmentation and emergency lighting.", "Suitable, serviced extinguishing equipment."],
      administrative: ["Fire risk assessment reviewed periodically and after change.", "Hot-work permit system.", "Housekeeping standards for combustible waste.", "Evacuation plan, drills and trained fire wardens.", "Escape routes kept clear and checked daily."],
      ppe: ["Task-specific PPE for emergency response only — PPE is not a substitute for fire precautions."],
    },
    oshaRefs: ["29 CFR 1910.39 — Fire Prevention Plans", "29 CFR 1910 Subpart E — Exit Routes and Emergency Planning"],
    hseRefs: ["Regulatory Reform (Fire Safety) Order 2005"],
  },
  {
    key: "dse",
    category: "Display Screen Equipment",
    description: "Prolonged display screen work with poorly adjusted workstations — musculoskeletal strain, visual fatigue and headaches.",
    personsAtRisk: "Employees using DSE for a significant part of their working day could develop musculoskeletal disorders, eye strain and fatigue.",
    existingControls: "Adjustable chairs provided; self-assessment checklist available.",
    likelihood: 4,
    severity: 2,
    industries: ["office", "education", "healthcare", "general"],
    responsiblePerson: "Office / HR Manager",
    controls: {
      elimination: ["Eliminate unnecessary prolonged screen tasks through work design and breaks in task variety."],
      substitution: ["Provide sit-stand options and appropriate alternative input devices."],
      engineering: ["Fully adjustable chairs, suitable desk height and screen positioning.", "Task lighting and glare control.", "Document holders and suitable peripherals."],
      administrative: ["DSE workstation assessments for identified users.", "Breaks or changes of activity from screen work.", "Eye and eyesight testing arrangements for DSE users.", "Training on workstation set-up and posture."],
      ppe: ["Not normally applicable — correct via workstation and work-pattern controls."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause", "OSHA Computer Workstations eTool (guidance)"],
    hseRefs: ["Health and Safety (Display Screen Equipment) Regulations 1992"],
  },
  {
    key: "stress",
    category: "Work-Related Stress",
    description: "Excessive workload, tight deadlines, or lack of role clarity and support leading to work-related stress.",
    personsAtRisk: "Employees could experience psychological ill-health, anxiety, burnout and associated physical health effects; increased error and absence.",
    existingControls: "Annual appraisal; informal open-door culture.",
    likelihood: 4,
    severity: 2,
    industries: ["office", "healthcare", "education", "general", "retail"],
    responsiblePerson: "HR / Line Management",
    controls: {
      elimination: ["Remove or reduce known pressure points — unrealistic deadlines, conflicting priorities."],
      substitution: ["Redistribute workload; reallocate tasks to match capacity and competence."],
      engineering: ["Not applicable by nature of hazard — address via work design."],
      administrative: ["Assess demands, control, support, relationships, role and change against recognised management standards.", "Clear role definitions and achievable objectives.", "Stress awareness training and confidential support routes (EAP).", "Return-to-work support and monitoring of absence indicators."],
      ppe: ["Not applicable."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause"],
    hseRefs: ["Management of Health and Safety at Work Regulations 1999", "HSE Management Standards for Work-Related Stress"],
  },
  {
    key: "lone-working",
    category: "Lone Working",
    description: "Working alone or in isolated locations without immediate support — including site visits and out-of-hours work.",
    personsAtRisk: "Lone workers could suffer injury, illness or violence with no one available to raise the alarm or provide first aid.",
    existingControls: "Mobile phones carried; informal check-in with colleagues.",
    likelihood: 3,
    severity: 4,
    industries: ["facilities", "healthcare", "retail", "general", "construction"],
    responsiblePerson: "Line Manager",
    controls: {
      elimination: ["Structure work so high-risk tasks are not carried out alone (pair working for defined tasks)."],
      substitution: ["Remote inspection, telemetry or customer contact that removes the need for lone attendance."],
      engineering: ["Lone-worker alarm/monitoring devices with check-in and escalation.", "CCTV and controlled access at remote sites."],
      administrative: ["Lone-working risk assessment and defined prohibited solo tasks.", "Formal check-in/check-out procedure with escalation on missed contact.", "Emergency contact protocol and first-aid provision.", "Training in dynamic risk assessment and withdrawal from unsafe situations."],
      ppe: ["Task-appropriate PPE; personal alarms where violence risk exists."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause", "29 CFR 1915.84 — Working Alone (where applicable)"],
    hseRefs: ["Management of Health and Safety at Work Regulations 1999", "HSE Guidance — Working Alone (INDG73)"],
  },
  {
    key: "violence",
    category: "Violence & Aggression",
    description: "Risk of verbal abuse, threats or physical assault from the public, patients or service users.",
    personsAtRisk: "Front-line employees could suffer physical injury and psychological harm from aggressive customers, patients or intruders.",
    existingControls: "Incident reporting in place; staff instructed not to put themselves at risk.",
    likelihood: 3,
    severity: 4,
    industries: ["healthcare", "retail", "hospitality", "education"],
    responsiblePerson: "Security / Operations Manager",
    controls: {
      elimination: ["Remove cash handling where practicable; eliminate lone public-facing work in high-risk periods."],
      substitution: ["Self-service or remote service options that reduce flashpoint interactions."],
      engineering: ["Screened counters, controlled-entry doors and fitting good sightlines.", "Panic alarms linked to response.", "CCTV coverage of public areas and tills."],
      administrative: ["Violence-prevention policy with zero-tolerance messaging.", "De-escalation and conflict-management training.", "Two-person minimum during identified high-risk periods.", "Incident reporting, investigation and post-incident support."],
      ppe: ["Personal alarms; body-worn cameras as an evidenced deterrent where used."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause", "OSHA Guidelines for Preventing Workplace Violence (3148)"],
    hseRefs: ["Management of Health and Safety at Work Regulations 1999", "HSE Guidance — Violence at Work (INDG69)"],
  },
  {
    key: "biological",
    category: "Biological Hazards",
    description: "Exposure to infectious agents — blood-borne pathogens, clinical waste and contaminated materials.",
    personsAtRisk: "Healthcare, cleaning and ancillary staff could contract infection through contact, sharps injury or droplet exposure.",
    existingControls: "Clinical waste streams segregated; vaccination programme for identified staff.",
    likelihood: 3,
    severity: 4,
    industries: ["healthcare", "hospitality", "education", "facilities"],
    responsiblePerson: "Infection Prevention & Control Lead",
    controls: {
      elimination: ["Use needle-free systems where available; eliminate unnecessary invasive procedures."],
      substitution: ["Safety-engineered sharps devices with protective mechanisms."],
      engineering: ["Sharps containers at point of use.", "Hand hygiene stations and appropriate ventilation.", "Engineered isolation rooms where indicated."],
      administrative: ["Standard precautions for all contact with blood/body fluids.", "Immunisation and health surveillance programmes.", "Exposure (needlestick) response protocol with post-exposure evaluation.", "Clinical waste and laundry handling procedures."],
      ppe: ["Gloves, aprons/gowns, eye and respiratory protection according to task-based exposure assessment."],
    },
    oshaRefs: ["29 CFR 1910.1030 — Bloodborne Pathogens"],
    hseRefs: ["Control of Substances Hazardous to Health Regulations 2002 (biological agents)", "Health and Social Care Act 2008 (Code of Practice)"],
  },
  {
    key: "kitchen-burns",
    category: "Burns & Scalds",
    description: "Hot surfaces, hot liquids, steam, fryers and heated equipment in food preparation areas.",
    personsAtRisk: "Kitchen employees could suffer burns and scalds, including serious injury from fryer oil or steam.",
    existingControls: "Oven gloves available; cleaning regime for fryers at set times.",
    likelihood: 4,
    severity: 3,
    industries: ["hospitality", "healthcare", "education"],
    responsiblePerson: "Head Chef / Catering Manager",
    controls: {
      elimination: ["Use of pre-prepared products to reduce hot-oil and hot-liquid handling."],
      substitution: ["Lower-temperature cooking processes; thermostatically controlled equipment."],
      engineering: ["Splash guards, lids and interlocked equipment.", "Safe fryer-filtering systems avoiding open oil transfer.", "Temperature-limiting valves on hot water outlets."],
      administrative: ["Safe procedures for oil filtering, disposal and cleaning only when cooled.", "Training on handling hot containers and steam release.", "Supervision of inexperienced staff during high-risk tasks.", "First-aid provision and burn response procedure."],
      ppe: ["Heat-resistant gloves, aprons, arm protection and slip-resistant footwear."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause", "29 CFR 1910.132 — PPE General Requirements"],
    hseRefs: ["Provision and Use of Work Equipment Regulations 1998"],
  },
  {
    key: "falling-objects-racking",
    category: "Falling Objects / Storage",
    description: "Poorly loaded or damaged racking and stacked goods — collapse or falling stock.",
    personsAtRisk: "Employees and visitors could be struck by falling stock or collapsing racking, sustaining major or fatal crush injuries.",
    existingControls: "Racking visually monitored by supervisors; weight labels on beams.",
    likelihood: 3,
    severity: 5,
    industries: ["warehouse", "retail", "manufacturing"],
    responsiblePerson: "Warehouse Manager",
    controls: {
      elimination: ["Remove damaged racking from service immediately; do not store above designed capacity."],
      substitution: ["Use correct pallet types and containers in good condition."],
      engineering: ["Racking installed and anchored to specification with load notices.", "Column and aisle-end protection barriers.", "Netting or mesh where fall-through risk exists."],
      administrative: ["Appoint a Person Responsible for Racking Safety (PRRS).", "Weekly visual and annual expert (SEMA-type) inspections.", "Damage reporting procedure with immediate offload of affected bays.", "Safe stacking heights and stable-load rules."],
      ppe: ["Safety footwear and hard hats where overhead risk remains."],
    },
    oshaRefs: ["29 CFR 1910.176 — Materials Handling and Storage", "29 CFR 1910.28 — Falling Object Protection"],
    hseRefs: ["Workplace (Health, Safety and Welfare) Regulations 1992", "HSE Guidance — Warehousing and Storage (HSG76)"],
  },
  {
    key: "confined-space",
    category: "Confined Spaces",
    description: "Work in confined spaces (tanks, pits, ducts, chambers) — oxygen deficiency, toxic gases, engulfment.",
    personsAtRisk: "Entrants and would-be rescuers could be overcome by atmosphere, engulfment or entrapment, with high fatality potential.",
    existingControls: "Confined spaces identified and signed; entry not routine.",
    likelihood: 2,
    severity: 5,
    industries: ["construction", "manufacturing", "facilities"],
    responsiblePerson: "Engineering Manager / Permit Controller",
    controls: {
      elimination: ["Carry out work from outside the space wherever possible (remote cleaning, inspection cameras)."],
      substitution: ["Modify plant so entry is not required (external gauges, clean-in-place systems)."],
      engineering: ["Forced ventilation and continuous atmospheric monitoring.", "Isolation of services, lines and stored energy (physical disconnect/lockout).", "Access and retrieval systems — tripod, harness and winch."],
      administrative: ["Confined space entry permit with pre-entry testing.", "Trained and authorized entrants, attendants and rescue arrangements.", "Communication protocol and emergency rescue plan rehearsed.", "No lone entry under any circumstances."],
      ppe: ["Respiratory protective equipment and retrieval harnesses as determined by the entry assessment."],
    },
    oshaRefs: ["29 CFR 1910.146 — Permit-Required Confined Spaces", "29 CFR 1926 Subpart AA — Confined Spaces in Construction"],
    hseRefs: ["Confined Spaces Regulations 1997"],
  },
  {
    key: "loto",
    category: "Hazardous Energy",
    description: "Unexpected start-up or release of stored energy during maintenance, cleaning or jam clearing.",
    personsAtRisk: "Maintenance technicians and operators could suffer amputation, crushing or electrocution from unexpected energisation.",
    existingControls: "Verbal instruction to isolate before maintenance; keys held by supervisors.",
    likelihood: 3,
    severity: 5,
    industries: ["manufacturing", "facilities", "warehouse"],
    responsiblePerson: "Engineering / Maintenance Manager",
    controls: {
      elimination: ["Design out the need to enter danger zones — external lubrication, automated clearing."],
      substitution: ["Equipment with integrated isolation and stored-energy dissipation features."],
      engineering: ["Dedicated isolation points with lockable disconnects and stored-energy bleed.", "Interlocked access guards requiring zero-energy state.", "Depressurisation and gravity-safing devices."],
      administrative: ["Written lockout/tagout programme with machine-specific procedures.", "Locks, tags and hasps issued to named authorized employees.", "Try-out/verification of zero energy before work begins.", "Periodic audits of LOTO application and refresher training."],
      ppe: ["Task-based PPE identified in the maintenance procedure."],
    },
    oshaRefs: ["29 CFR 1910.147 — The Control of Hazardous Energy (Lockout/Tagout)"],
    hseRefs: ["Provision and Use of Work Equipment Regulations 1998 — Regulations 19 & 22"],
  },
  {
    key: "vibration",
    category: "Vibration (HAVS / WBV)",
    description: "Regular use of hand-held power tools or ride-on plant causing hand-arm or whole-body vibration exposure.",
    personsAtRisk: "Employees using vibratory tools could develop hand-arm vibration syndrome (HAVS), vibration white finger and back disorders — permanent and disabling.",
    existingControls: "Tools replaced on breakdown; no formal exposure tracking.",
    likelihood: 3,
    severity: 4,
    industries: ["construction", "manufacturing", "facilities"],
    responsiblePerson: "Site / Plant Manager",
    controls: {
      elimination: ["Eliminate vibratory processes where possible (alternative fixing or breaking methods)."],
      substitution: ["Select low-vibration tools and automated/remote methods.", "Use lower-rated trigger times through efficient consumables."],
      engineering: ["Anti-vibration tool handles and mounts maintained to standard.", "Seat suspension on ride-on plant; surface maintenance to reduce WBV."],
      administrative: ["Exposure points/health surveillance system (EAV/ELV management).", "Job rotation and enforced breaks from trigger time.", "Tool inventory with declared vibration magnitudes and trigger-time limits.", "Early symptom reporting and occupational health referral."],
      ppe: ["Warm clothing and gloves to maintain circulation — note: 'anti-vibration' gloves are not a substitute for exposure control."],
    },
    oshaRefs: ["OSH Act Section 5(a)(1) — General Duty Clause", "NIOSH/ACGIH hand-arm vibration criteria (guidance)"],
    hseRefs: ["Control of Vibration at Work Regulations 2005"],
  },
  {
    key: "silica",
    category: "Respirable Crystalline Silica",
    description: "Cutting, grinding or chasing concrete, stone and brick generating respirable crystalline silica dust.",
    personsAtRisk: "Operators and nearby workers could develop silicosis, COPD or lung cancer — irreversible and potentially fatal occupational disease.",
    existingControls: "Masks issued on request; wet cutting sometimes used.",
    likelihood: 4,
    severity: 5,
    industries: ["construction", "manufacturing"],
    responsiblePerson: "Site Manager / HSE Advisor",
    controls: {
      elimination: ["Eliminate on-site cutting by pre-cutting materials off-site or at a controlled facility."],
      substitution: ["Use pre-formed/pre-drilled materials; hand tools in lieu of power cutting where practicable."],
      engineering: ["On-tool water suppression or on-tool extraction (H-class vacuum).", "Enclosed cutting stations with LEV."],
      administrative: ["RCS exposure assessment and task-specific method statements.", "No dry cutting policy.", "Health surveillance including lung-function screening.", "Housekeeping by vacuum or wet methods — never dry sweeping."],
      ppe: ["FFP3 respiratory protection (face-fit tested) as short-term control, not sole reliance."],
    },
    oshaRefs: ["29 CFR 1926.1153 — Respirable Crystalline Silica (Construction)", "29 CFR 1910.1053 — Respirable Crystalline Silica (General Industry)"],
    hseRefs: ["Control of Substances Hazardous to Health Regulations 2002 (COSHH) — silica guidance"],
  },
  {
    key: "asbestos",
    category: "Asbestos",
    description: "Potential disturbance of asbestos-containing materials (ACMs) in building fabric during maintenance or refurbishment.",
    personsAtRisk: "Maintenance staff, contractors and building occupants could inhale asbestos fibres, risking asbestosis, mesothelioma and lung cancer.",
    existingControls: "Asbestos register/survey available; location notes for known ACMs.",
    likelihood: 2,
    severity: 5,
    industries: ["facilities", "construction", "education", "healthcare"],
    responsiblePerson: "Duty Holder / Estates Manager",
    controls: {
      elimination: ["Remove ACMs under licensed-controlled conditions where planned works will disturb them."],
      substitution: ["Design works to avoid disturbance (encapsulate or enclose in situ where condition allows)."],
      engineering: ["Sealed enclosures and containment for any work near ACMs.", "Licensed removal with controlled environments and air monitoring."],
      administrative: ["Up-to-date asbestos survey and register accessible to all contractors.", "Permit-to-work with mandatory register check before intrusive work.", "Asbestos awareness training for maintenance staff.", "Emergency procedure for accidental disturbance — stop work, secure area, report."],
      ppe: ["RPE/PPE only under licensed contractor control — not a general control measure."],
    },
    oshaRefs: ["29 CFR 1910.1001 — Asbestos (General Industry)", "29 CFR 1926.1101 — Asbestos (Construction)", "AHERA (schools) where applicable"],
    hseRefs: ["Control of Asbestos Regulations 2012"],
  },
  {
    key: "housekeeping-egress",
    category: "Housekeeping / Emergency Egress",
    description: "Accumulated materials, blocked walkways and obstructed fire exits or extinguisher access.",
    personsAtRisk: "Employees and visitors could trip, and evacuation or emergency response could be delayed during an incident.",
    existingControls: "Periodic tidy-ups; alarm exits reported when obviously blocked.",
    likelihood: 4,
    severity: 3,
    industries: EVERYWHERE,
    responsiblePerson: "Site Manager",
    controls: {
      elimination: ["Remove surplus materials and obsolete equipment from walkways and exits."],
      substitution: ["Deliver-to-point-of-use scheduling to avoid interim storage in circulation routes."],
      engineering: ["Designated, marked storage zones away from routes and exits.", "Self-closing exit doors and hold-open arrangements that release on alarm."],
      administrative: ["Daily housekeeping standard with assigned area ownership.", "Documented exits-and-extinguishers access check.", "Zero-tolerance rule for items stored on stairs or in front of exits.", "Housekeeping included on inspection programme."],
      ppe: ["Not applicable — correct via housekeeping and layout."],
    },
    oshaRefs: ["29 CFR 1910.22 — Walking-Working Surfaces", "29 CFR 1910.37 — Maintenance, Safeguards and Operational Features for Exit Routes"],
    hseRefs: ["Workplace (Health, Safety and Welfare) Regulations 1992", "Regulatory Reform (Fire Safety) Order 2005"],
  },
  {
    key: "lighting",
    category: "Workplace Lighting",
    description: "Inadequate or failed lighting in work areas, stairwells or exterior routes.",
    personsAtRisk: "Employees and visitors could suffer slips, trips, falls, eye strain or struck-by vehicle incidents in poorly lit areas.",
    existingControls: "Faults reported to maintenance on an ad hoc basis.",
    likelihood: 3,
    severity: 3,
    industries: ["office", "warehouse", "facilities", "retail", "general", "education"],
    responsiblePerson: "Facilities Manager",
    controls: {
      elimination: ["N/A — lighting is required; eliminate dark areas through provision."],
      substitution: ["Upgrade to LED luminaries with appropriate colour rendering and output."],
      engineering: ["Lighting designed to task-based lux levels; emergency lighting on escape routes.", "Photocell/timed external lighting for routes and car parks.", "Local task lighting where ambient is insufficient."],
      administrative: ["Planned lighting inspection and relamping programme.", "Fault priority response for stairwells and escape routes.", "Include lighting checks in routine workplace inspections."],
      ppe: ["Not applicable."],
    },
    oshaRefs: ["29 CFR 1926.56 — Illumination (construction)", "29 CFR 1910.37 — Exit Route Illumination"],
    hseRefs: ["Workplace (Health, Safety and Welfare) Regulations 1992 — Regulation 8"],
  },
  {
    key: "sharps",
    category: "Sharps / Needlestick",
    description: "Handling of needles, blades and sharps — needlestick injuries and exposure to blood-borne pathogens.",
    personsAtRisk: "Clinical, cleaning, laundry and waste staff could sustain sharps injuries with risk of HBV, HCV or HIV transmission.",
    existingControls: "Sharps bins available in clinical rooms; resheathing discouraged.",
    likelihood: 3,
    severity: 4,
    industries: ["healthcare", "facilities", "education"],
    responsiblePerson: "Clinical Lead / IPC Lead",
    controls: {
      elimination: ["Adopt needle-free systems and eliminate unnecessary sharps use."],
      substitution: ["Safety-engineered devices (retractable needles, blunted suture needles)."],
      engineering: ["Sharps containers at immediate point of use, assembled correctly and never overfilled."],
      administrative: ["No resheathing by hand policy.", "Never pass sharps hand-to-hand; use trays.", "Sharps injury protocol — encourage bleeding, wash, report, risk assess, PEP where indicated.", "Contractor controls for areas where discarded sharps may be present."],
      ppe: ["Appropriate gloves; note gloves do not prevent needlestick but reduce contamination."],
    },
    oshaRefs: ["29 CFR 1910.1030 — Bloodborne Pathogens (Needlestick Safety and Prevention Act)"],
    hseRefs: ["Health and Safety (Sharp Instruments in Healthcare) Regulations 2013", "COSHH 2002 (biological agents)"],
  },
  {
    key: "pressure-systems",
    category: "Pressure Systems",
    description: "Boilers, air receivers and pressurised plant — failure could release stored energy violently.",
    personsAtRisk: "Employees in the vicinity could suffer fatal injuries, burns or blast injuries from vessel rupture or steam release.",
    existingControls: "Servicing contract in place for main boiler.",
    likelihood: 1,
    severity: 5,
    industries: ["manufacturing", "hospitality", "healthcare", "facilities"],
    responsiblePerson: "Engineering Manager",
    controls: {
      elimination: ["Remove obsolete pressure vessels from service and decommission safely."],
      substitution: ["Specify systems operating at the lowest practicable pressure."],
      engineering: ["Safety valves, gauges and cut-outs maintained and tested.", "Written scheme of examination with inspections by a competent person.", "Siting and shielding of vessels away from occupied areas."],
      administrative: ["Statutory examination schedule tracked and documented.", "Competent operation with written operating procedures.", "Defect escalation — remove from service on failed examination.", "Records of examinations retained."],
      ppe: ["Face and thermal protection for specific servicing tasks."],
    },
    oshaRefs: ["29 CFR 1910 Subpart M — Compressed Gas and Compressed Air Equipment", "ASME Boiler & Pressure Vessel Code"],
    hseRefs: ["Pressure Systems Safety Regulations 2000 (PSSR)"],
  },
];

export function libraryForIndustry(industryId: string): HazardTemplate[] {
  return HAZARD_LIBRARY.filter((h) => h.industries.includes(industryId));
}

/* ------------------------------------------------------------------ */
/*  Document suite (landing page)                                      */
/* ------------------------------------------------------------------ */

export const DOCUMENT_SUITE: { name: string; note: string; live: boolean }[] = [
  { name: "Risk Assessment", note: "Full Bahamian HSW Act methodology — the core document.", live: true },
  { name: "Job Hazard Analysis (JHA)", note: "Task-step breakdown with hazard controls.", live: false },
  { name: "Job Safety Analysis (JSA)", note: "Step-by-step safe work procedure.", live: false },
  { name: "Safe Work Method Statement", note: "Method, plant, competencies and controls.", live: false },
  { name: "Toolbox Talks", note: "Short briefing scripts for crews and committee.", live: false },
  { name: "Workplace Inspection Report", note: "Structured walkthrough findings.", live: false },
  { name: "Corrective Action Report", note: "Findings, owners and due dates tracked.", live: false },
  { name: "PPE Assessment", note: "Task-based PPE selection record.", live: false },
  { name: "Fire Safety Assessment", note: "Ignition, fuel, means of escape.", live: false },
  { name: "Contractor Safety Assessment", note: "Pre-qualification and control of contractors.", live: false },
  { name: "Security Risk Assessment", note: "Threats, assets and protective measures.", live: false },
  { name: "Environmental Risk Assessment", note: "Aspects, impacts and mitigation.", live: false },
  { name: "Safety Audit Report", note: "Programme-level audit with scoring.", live: false },
  { name: "Safety Committee Minutes", note: "Record of committee inspections and decisions.", live: false },
];



export { RISK_ASSESSMENT_DISCLAIMER as DISCLAIMER } from "@/lib/legal";

/** Official definition of BCSO */
export const ABOUT_BCSO = "Bahamas Compliance & Safety Oversight Ltd. (BCSO) is the premier Health & Safety reporting and compliance oversight agency in the Commonwealth of The Bahamas. BCSO operationalises statutory risk-management across the multi-island property sector — coordinating independent trade specialists, verifying technical safety standards, and issuing authoritative compliance documentation anchored in the Health and Safety at Work Act 2002.";

export const MARQUEE_ITEMS = [
  "HEALTH AND SAFETY AT WORK ACT 2002 — CH. 321C",
  "EMPLOYMENT ACT 2001 — CH. 321A",
  "DEPT. OF LABOUR — LABOUR INSPECTION SECTION",
  "HSW ACT 2002 S.4 — EMPLOYER'S GENERAL DUTY",
  "HSW ACT 2002 S.22 — H&S COMMITTEE (20+ EMPLOYEES)",
  "ENVIRONMENTAL HEALTH SERVICES ACT — DEHS",
  "BAHAMAS FIRE SERVICE — MEANS OF ESCAPE",
  "EMPLOYEE DUTY — REASONABLE CARE FOR SELF & OTHERS",
  "NATIONAL INSURANCE ACT 1972 — EMPLOYMENT INJURY",
  "29 CFR 1910.22 — WALKING-WORKING SURFACES (GOOD PRACTICE)",
  "HSE FIVE STEPS — INTERNATIONAL GOOD PRACTICE",
  "OSHA / NIOSH — HIERARCHY OF CONTROLS (GOOD PRACTICE)",
  "PUWER 1998 — MACHINERY (GOOD PRACTICE)",
  "29 CFR 1910.147 — LOCKOUT/TAGOUT (GOOD PRACTICE)",
];
