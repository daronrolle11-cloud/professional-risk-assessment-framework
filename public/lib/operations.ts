import type { ChecklistItemRow, InspectionRow, ItemSeverity } from "@/db/schema";

/* ------------------------------------------------------------------ */
/*  Geography — Bahamian operating islands                             */
/* ------------------------------------------------------------------ */

export interface IslandInfo {
  id: string;
  name: string;
  group: "primary" | "family";
  calloutFee: number; // logistics base for the trade callout
}

export const ISLANDS: IslandInfo[] = [
  { id: "new-providence", name: "New Providence (Nassau)", group: "primary", calloutFee: 0 },
  { id: "grand-bahama", name: "Grand Bahama (Freeport)", group: "primary", calloutFee: 60 },
  { id: "abaco", name: "Abaco", group: "family", calloutFee: 220 },
  { id: "eleuthera", name: "Eleuthera", group: "family", calloutFee: 200 },
  { id: "exuma", name: "Exuma", group: "family", calloutFee: 220 },
  { id: "andros", name: "Andros", group: "family", calloutFee: 240 },
  { id: "bimini", name: "Bimini", group: "family", calloutFee: 210 },
  { id: "berry-islands", name: "Berry Islands", group: "family", calloutFee: 230 },
  { id: "cat-island", name: "Cat Island", group: "family", calloutFee: 240 },
  { id: "long-island", name: "Long Island", group: "family", calloutFee: 260 },
  { id: "san-salvador", name: "San Salvador", group: "family", calloutFee: 260 },
  { id: "inagua", name: "Inagua", group: "family", calloutFee: 300 },
];

export function islandById(id: string): IslandInfo {
  return ISLANDS.find((i) => i.id === id) ?? ISLANDS[0];
}

/* ------------------------------------------------------------------ */
/*  Trades                                                             */
/* ------------------------------------------------------------------ */

export interface TradeInfo {
  id: string;
  name: string;
  prefix: string;
  baseFee: number;
}

export const TRADES: TradeInfo[] = [
  { id: "comprehensive", name: "Comprehensive Property Audit", prefix: "AUD", baseFee: 850 },
  { id: "electrical", name: "Electrical", prefix: "ELC", baseFee: 380 },
  { id: "plumbing", name: "Plumbing", prefix: "PLB", baseFee: 340 },
  { id: "hvac", name: "HVAC & Refrigeration", prefix: "HVC", baseFee: 400 },
  { id: "general", name: "General Property Safety", prefix: "GEN", baseFee: 320 },
];

export function tradeById(id: string): TradeInfo {
  return TRADES.find((t) => t.id === id) ?? TRADES[0];
}

/* ------------------------------------------------------------------ */
/*  Trade checklist templates — cross-referenced to Bahamian law       */
/* ------------------------------------------------------------------ */

export interface ChecklistTemplateItem {
  label: string;
  requirement: string;
  severity: ItemSeverity;
}

const HSWA_PLANT = "HSW Act 2002 (Ch. 321C), s.4(2)(a) — safe plant & systems of work";
const HSWA_ACCESS = "HSW Act 2002, s.4(2)(d) — safe place of work, safe access & egress";
const HSWA_ENV = "HSW Act 2002, s.4(2)(e) — working environment safe & without risks to health";
const HSWA_TRAINING = "HSW Act 2002, s.4(2)(c) — information, instruction, training & supervision";
const HSWA_FLAMMABLE = "HSW Act 2002, s.3(1)(c) — control of highly flammable/dangerous substances";
const DEHS_GEN = "Environmental Health Services Act — DEHS (sanitation & environmental hygiene)";
const ELECTRICAL_GOOD = "Licensed electrical contractor to recognized standards (BS 7671 / NEC as good practice)";

export const TRADE_CHECKLISTS: Record<string, ChecklistTemplateItem[]> = {
  electrical: [
    { label: "Main panel: breakers correctly labelled, no double-tapped neutrals, dead-front cover secure", requirement: HSWA_PLANT, severity: "critical" },
    { label: "Visible wiring free of damaged insulation, exposed conductors and open junction boxes", requirement: HSWA_PLANT, severity: "critical" },
    { label: "GFCI/RCD protection present at wet areas — kitchens, bathrooms, exterior outlets, docks", requirement: ELECTRICAL_GOOD, severity: "major" },
    { label: "Earthing/grounding electrode and bonding intact; meter base and mast in sound condition", requirement: HSWA_PLANT, severity: "critical" },
    { label: "No overloaded circuits, daisy-chained extension leads or makeshift connections", requirement: HSWA_ENV, severity: "major" },
    { label: "Exterior fixtures and fittings weatherproofed and securely fixed for storm exposure", requirement: HSWA_PLANT, severity: "major" },
    { label: "Smoke detectors present, correctly sited and test-operated", requirement: "Bahamas Fire Service fire-safety guidance — early warning provisions", severity: "critical" },
    { label: "Emergency/egress lighting operational at exits (commercial & common areas)", requirement: HSWA_ACCESS, severity: "major" },
    { label: "Panel working clearance maintained (min. ~900 mm) and access unobstructed", requirement: HSWA_ACCESS, severity: "minor" },
    { label: "Standby generator: proper transfer switching, no back-feed risk, exhaust routed clear", requirement: HSWA_PLANT, severity: "critical" },
  ],
  plumbing: [
    { label: "No visible leaks at fixtures, valves, supply lines or concealed runs (stains, drip, tracking)", requirement: HSWA_ENV, severity: "major" },
    { label: "Water heater: temperature & pressure relief valve fitted, discharge pipe routed safely", requirement: HSWA_PLANT, severity: "critical" },
    { label: "Backflow prevention at potable cross-connections — hose bibs, irrigation, cistern feeds", requirement: "DEHS — protection of potable water supply", severity: "critical" },
    { label: "Drainage sound: no sewer odour; traps sealed and primed (check after storm/vacancy)", requirement: DEHS_GEN, severity: "major" },
    { label: "Septic/sewage system: no surfacing effluent, covers sound and secured", requirement: DEHS_GEN, severity: "critical" },
    { label: "Water storage tanks/cisterns: covered, screened and free of debris — vector control", requirement: "DEHS — mosquito/vector breeding prevention", severity: "major" },
    { label: "Exterior hose bibs fitted with vacuum breakers", requirement: "DEHS — protection of potable water supply (good practice)", severity: "minor" },
    { label: "Pumps and pressure vessels: guarded, secured and serviced", requirement: HSWA_PLANT, severity: "major" },
    { label: "Hot water at fixtures limited to scald-safe temperatures", requirement: HSWA_ENV, severity: "minor" },
  ],
  hvac: [
    { label: "Condensate drains clear, trapped and discharging correctly — no overflow staining", requirement: "DEHS — prevention of moisture/mould conditions", severity: "major" },
    { label: "Air filters renewed and evaporator/condenser coils in serviceable condition", requirement: HSWA_ENV, severity: "minor" },
    { label: "Refrigerant lines insulated; no oil traces indicating leaks; work by competent technician", requirement: HSWA_PLANT, severity: "major" },
    { label: "Outdoor condensing units anchored/strapped for hurricane wind loads; fixings uncorroded", requirement: HSWA_PLANT, severity: "critical" },
    { label: "Local electrical disconnects present, accessible and in sound condition", requirement: ELECTRICAL_GOOD, severity: "critical" },
    { label: "Ductwork sealed and free of visible mould or biological growth", requirement: "DEHS — indoor environmental quality", severity: "major" },
    { label: "Combustion appliances (where fitted): flues/venting intact; no carbon monoxide risk", requirement: HSWA_ENV, severity: "critical" },
    { label: "Thermostats and unit controls operational; no short-cycling", requirement: HSWA_PLANT, severity: "minor" },
    { label: "Adequate ventilation/make-up air for enclosed occupied spaces", requirement: HSWA_ENV, severity: "major" },
    { label: "Drain pans treated and overflow cut-off switches functional", requirement: "DEHS — prevention of moisture/mould conditions (good practice)", severity: "minor" },
  ],
  general: [
    { label: "Structure: no visible cracking, spalling or deterioration of load-bearing elements", requirement: "Building Control — Ministry of Works & Utilities (structural condition)", severity: "critical" },
    { label: "Roof coverings, flashings and fixings sound; hurricane strapping/clips intact where fitted", requirement: "Ministry of Works — building envelope integrity (storm resilience)", severity: "major" },
    { label: "Walkways, stairs and balconies: sound surfaces, secure handrails and balusters", requirement: HSWA_ACCESS, severity: "major" },
    { label: "Means of escape clear, unlocked and unobstructed; exit signage in place", requirement: "Bahamas Fire Service — unobstructed means of escape", severity: "critical" },
    { label: "Fire extinguishers present, serviced and tagged; extinguisher access clear", requirement: "Bahamas Fire Service — first-response fire-fighting provisions", severity: "major" },
    { label: "Lighting adequate on access routes, steps and exterior approaches", requirement: HSWA_ENV, severity: "minor" },
    { label: "No unguarded openings, pits or falls hazards on the property", requirement: HSWA_ACCESS, severity: "major" },
    { label: "Yard free of debris and harbourage; waste storage contained (vector control)", requirement: DEHS_GEN, severity: "minor" },
    { label: "Swimming pool (if present): barriers/gates secure; electrics bonded; chemicals stored safely", requirement: HSWA_ENV + "; " + DEHS_GEN, severity: "critical" },
    { label: "Contractor work areas supervised; occupants protected from works (HSW Act s.5 — non-employees)", requirement: "HSW Act 2002, s.5 — duty to persons other than employees", severity: "major" },
  ],
  comprehensive: [
    // 1. HVAC, Moisture, & Mold Tracking
    { label: "HVAC: Condensate Drain Lines", requirement: "DEHS — prevention of moisture/mould conditions", severity: "major" },
    { label: "HVAC: Indoor Relative Humidity", requirement: HSWA_ENV, severity: "minor" },
    { label: "HVAC: Visible Mold / Fungal Check", requirement: "DEHS — indoor environmental quality", severity: "critical" },
    { label: "HVAC: Ductwork Insulation", requirement: HSWA_ENV, severity: "major" },
    { label: "HVAC: Air Filtration Filters", requirement: HSWA_ENV, severity: "minor" },
    // 2. Electrical Grid & Grounding Tracking
    { label: "Electrical: Main Panel & Breakers", requirement: HSWA_PLANT, severity: "critical" },
    { label: "Electrical: Main Building Grounding", requirement: HSWA_PLANT, severity: "critical" },
    { label: "Electrical: GFCI Protection Outlets", requirement: ELECTRICAL_GOOD, severity: "major" },
    { label: "Electrical: Wiring & Conduits", requirement: HSWA_PLANT, severity: "major" },
    { label: "Electrical: Panel Access & Clearance", requirement: HSWA_ACCESS, severity: "minor" },
    // 3. Liquefied Petroleum Gas (LPG) Tracking
    { label: "LPG: Gas Leak Scan (Valves/Joints)", requirement: HSWA_FLAMMABLE, severity: "critical" },
    { label: "LPG: Tank Placement & Pad Security", requirement: HSWA_FLAMMABLE, severity: "major" },
    { label: "LPG: Flexible Line & Piping Quality", requirement: HSWA_FLAMMABLE, severity: "critical" },
    { label: "LPG: Emergency Shut-Off Valves", requirement: HSWA_FLAMMABLE, severity: "critical" },
    { label: "LPG: Appliance Venting Systems", requirement: HSWA_ENV, severity: "major" },
    // 4. Fire Protection & Suppression Tracking
    { label: "Fire: Fire Extinguishers (Charge/Tag)", requirement: "Bahamas Fire Service — first-response fire-fighting provisions", severity: "major" },
    { label: "Fire: Emergency Egress & Exit Doors", requirement: "Bahamas Fire Service — unobstructed means of escape", severity: "critical" },
    { label: "Fire: Illuminated Exit Signage", requirement: HSWA_ACCESS, severity: "major" },
    { label: "Fire: Smoke & CO Alarm Testing", requirement: "Bahamas Fire Service — early warning provisions", severity: "critical" },
    { label: "Fire: Sprinkler Risers & Clearances", requirement: "Bahamas Fire Service — fire-safety guidance", severity: "major" },
  ],
};

export function templateForTrade(trade: string): ChecklistTemplateItem[] {
  return TRADE_CHECKLISTS[trade] ?? TRADE_CHECKLISTS.general;
}

/* ------------------------------------------------------------------ */
/*  Codes                                                              */
/* ------------------------------------------------------------------ */

export function generateAccessCode(trade: string): string {
  const prefix = tradeById(trade).prefix;
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateInspectionCode(seq: number): string {
  return `BCS-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export function reportNumberFor(inspectionId: number): string {
  return `CSR-${new Date().getFullYear()}-${String(inspectionId).padStart(4, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Compliance scoring                                                 */
/* ------------------------------------------------------------------ */

export const SEVERITY_WEIGHTS: Record<ItemSeverity, number> = { critical: 5, major: 3, minor: 1 };

export interface ScoreResult {
  score: number; // 0–100
  passCount: number;
  failCount: number;
  naCount: number;
  pendingCount: number;
  criticalFails: number;
}

export function computeComplianceScore(items: ChecklistItemRow[]): ScoreResult {
  let passW = 0;
  let totalW = 0;
  let passCount = 0;
  let failCount = 0;
  let naCount = 0;
  let pendingCount = 0;
  let criticalFails = 0;
  for (const item of items) {
    const sev = (item.severity as ItemSeverity) || "major";
    const w = SEVERITY_WEIGHTS[sev] ?? 3;
    if (item.status === "pass") {
      passW += w;
      totalW += w;
      passCount++;
    } else if (item.status === "fail") {
      totalW += w;
      failCount++;
      if (sev === "critical") criticalFails++;
    } else if (item.status === "na") {
      naCount++;
    } else {
      pendingCount++;
    }
  }
  const score = totalW === 0 ? 100 : Math.round((passW / totalW) * 100);
  return { score, passCount, failCount, naCount, pendingCount, criticalFails };
}

export interface ComplianceVerdict {
  key: "compliant" | "conditional" | "non-compliant";
  label: string;
  hex: string;
  note: string;
}

export function verdictFor(result: ScoreResult): ComplianceVerdict {
  if (result.criticalFails > 0 || result.score < 70) {
    return {
      key: "non-compliant",
      label: "Non-Compliant",
      hex: "#ef4444",
      note: "Critical life-safety deficiencies or overall score below threshold. Remediate before occupancy/rental.",
    };
  }
  if (result.score < 90) {
    return {
      key: "conditional",
      label: "Conditional Pass",
      hex: "#e7c416",
      note: "Substantially compliant. Remediation of noted deficiencies required within the stated window.",
    };
  }
  return {
    key: "compliant",
    label: "Compliant",
    hex: "#22C55E",
    note: "Property meets the applied Bahamian statutory requirements and recognized good practice.",
  };
}

/* ------------------------------------------------------------------ */
/*  Commercial model — fees, payouts, margin (visualizer)              */
/* ------------------------------------------------------------------ */

export interface OpsEstimate {
  inspectionFee: number;
  calloutFee: number;
  contractorPayout: number;
  adminCost: number;
  margin: number;
  marginPct: number;
  projectedCompliance: number;
  remediationFee: number;
}

export const PROPERTY_TYPES = [
  { id: "villa", name: "Villa / Luxury Rental", feeFactor: 1.35, projectedFailLikelihood: 0.22 },
  { id: "residential", name: "Residential Home", feeFactor: 1.0, projectedFailLikelihood: 0.2 },
  { id: "condo", name: "Condo / Apartment", feeFactor: 0.8, projectedFailLikelihood: 0.16 },
  { id: "commercial", name: "Commercial / Office", feeFactor: 1.3, projectedFailLikelihood: 0.26 },
  { id: "marina", name: "Marina / Dock Property", feeFactor: 1.45, projectedFailLikelihood: 0.34 },
];

export const AGE_PROFILES = [
  { id: "new", name: "0–10 years", factor: 1.0, defectLoad: 0.06 },
  { id: "mid", name: "10–25 years", factor: 1.15, defectLoad: 0.17 },
  { id: "old", name: "25+ years", factor: 1.35, defectLoad: 0.31 },
];

export function estimateOperation(opts: {
  islandId: string;
  trades: string[];
  squareFeet: number;
  ageId: string;
  propertyTypeId: string;
}): OpsEstimate {
  const island = islandById(opts.islandId);
  const age = AGE_PROFILES.find((a) => a.id === opts.ageId) ?? AGE_PROFILES[1];
  const ptype = PROPERTY_TYPES.find((p) => p.id === opts.propertyTypeId) ?? PROPERTY_TYPES[1];
  const trades = opts.trades.length ? opts.trades : ["general"];
  const sizeFactor = Math.min(2.2, Math.max(0.7, opts.squareFeet / 1800));

  const tradeFees = trades.reduce((sum, t) => sum + tradeById(t).baseFee * sizeFactor * age.factor * ptype.feeFactor, 0);
  const inspectionFee = Math.round(tradeFees + island.calloutFee);
  const calloutFee = island.calloutFee;
  // Contractor payout: 55% of trade fee + full callout pass-through
  const contractorPayout = Math.round(tradeFees * 0.55 + calloutFee);
  const adminCost = 75; // review, verification, report generation, delivery
  const margin = inspectionFee - contractorPayout - adminCost;
  const marginPct = inspectionFee > 0 ? Math.round((margin / inspectionFee) * 100) : 0;

  // Projected compliance from defect load + property type risk
  const defectRatio = Math.min(0.85, age.defectLoad + ptype.projectedFailLikelihood * 0.5);
  const projectedCompliance = Math.max(35, Math.round((1 - defectRatio) * 100));
  // Remediation fee: expected failed-weight average translated to billable remediation support
  const remediationFee = Math.round(defectRatio * tradeFees * 1.8);

  return { inspectionFee, calloutFee, contractorPayout, adminCost, margin, marginPct, projectedCompliance, remediationFee };
}

// Legacy alias — real disclaimer text now lives in src/lib/legal.ts
export { RISK_ASSESSMENT_DISCLAIMER as FIELDOPS_DISCLAIMER } from "@/lib/legal";

export const REPORT_BRAND = "Bahamas Compliance & Safety Oversight Ltd.";
export const COMPANY_SHORT = "BCSO";
