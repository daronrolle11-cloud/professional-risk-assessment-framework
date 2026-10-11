import type { ControlsByTier } from "@/db/schema";

/**
 * Jurisdiction governs which legal references the document carries.
 * "bahamas"        — Bahamian statute only (HSW Act 2002, Employment Act 2001, Dept. of Labour, DEHS)
 * "bahamas-intl"   — Bahamian law with precedence, OSHA/UK HSE cited as recognized good practice where silent
 * "osha" | "hse" | "both" — international frameworks (for regional/template use)
 */
export type Jurisdiction = "bahamas" | "bahamas-intl" | "osha" | "hse" | "both";
export type RiskLevelKey = "low" | "moderate" | "high" | "extreme";

export interface HazardTemplate {
  key: string;
  category: string;
  description: string;
  personsAtRisk: string;
  existingControls: string;
  likelihood: number;
  severity: number;
  controls: ControlsByTier;
  responsiblePerson: string;
  industries: string[];
  oshaRefs: string[];
  hseRefs: string[];
}

export interface Industry {
  id: string;
  name: string;
  blurb: string;
  tasks: string[];
}

/** Editable hazard instance used by the wizard / API payloads. */
export interface HazardDraft {
  uid: string;
  category: string;
  description: string;
  personsAtRisk: string;
  existingControls: string;
  likelihood: number;
  severity: number;
  controls: ControlsByTier;
  responsiblePerson: string;
  dueDate: string;
  residualLikelihood: number;
  residualSeverity: number;
  bahamasRefs: string[];
  oshaRefs: string[];
  hseRefs: string[];
}

export interface AssessmentForm {
  industry: string;
  activity: string;
  organization: string;
  department: string;
  location: string;
  assessmentNo: string;
  assessmentDate: string;
  reviewDate: string;
  assessor: string;
  responsibleManager: string;
  employeesExposed: string;
  jurisdiction: Jurisdiction;
  status: "draft" | "issued" | "review";
  regulations: string;
  hazards: HazardDraft[];
  signatureData?: string;
}

export const EMPTY_CONTROLS: ControlsByTier = {
  elimination: [],
  substitution: [],
  engineering: [],
  administrative: [],
  ppe: [],
};

export function emptyHazard(): HazardDraft {
  return {
    uid: crypto.randomUUID(),
    category: "Custom",
    description: "",
    personsAtRisk: "Employees, contractors and visitors in the affected area.",
    existingControls: "",
    likelihood: 3,
    severity: 3,
    controls: {
      elimination: [],
      substitution: [],
      engineering: [],
      administrative: [],
      ppe: [],
    },
    responsiblePerson: "",
    dueDate: "",
    residualLikelihood: 1,
    residualSeverity: 3,
    bahamasRefs: [],
    oshaRefs: [],
    hseRefs: [],
  };
}
