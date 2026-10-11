import type { RiskLevelKey } from "./types";

export interface ScalePoint {
  value: number;
  label: string;
  description: string;
}

export const LIKELIHOOD_SCALE: ScalePoint[] = [
  { value: 1, label: "Rare", description: "Highly unlikely to occur" },
  { value: 2, label: "Unlikely", description: "Could occur occasionally" },
  { value: 3, label: "Possible", description: "Could occur at some point" },
  { value: 4, label: "Likely", description: "Expected to occur in many circumstances" },
  { value: 5, label: "Almost Certain", description: "Expected to occur frequently" },
];

export const SEVERITY_SCALE: ScalePoint[] = [
  { value: 1, label: "Minor", description: "First-aid-level injury / minor impact" },
  { value: 2, label: "Moderate", description: "Medical treatment or short-term harm" },
  { value: 3, label: "Serious", description: "Serious injury/illness or significant property damage" },
  { value: 4, label: "Major", description: "Permanent disability, major injury, major incident" },
  { value: 5, label: "Catastrophic", description: "Fatality, multiple serious injuries, catastrophic loss" },
];

export interface RiskLevel {
  key: RiskLevelKey;
  label: string;
  min: number;
  max: number;
  action: string;
  hex: string;
  /** classes for dark UI surfaces */
  darkChip: string;
  /** classes for the printed white document */
  paperChip: string;
}

export const RISK_LEVELS: Record<RiskLevelKey, RiskLevel> = {
  low: {
    key: "low",
    label: "Low",
    min: 1,
    max: 4,
    action: "Monitor and maintain controls",
    hex: "#22C55E",
    darkChip: "bg-[#064E3B] text-[#6EE7B7] border border-[#065F46]",
    paperChip: "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]",
  },
  moderate: {
    key: "moderate",
    label: "Moderate",
    min: 5,
    max: 9,
    action: "Improve controls within a defined timeframe",
    hex: "#FACC15",
    darkChip: "bg-[#451A03] text-[#FDE047] border border-[#78350F]",
    paperChip: "bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]",
  },
  high: {
    key: "high",
    label: "High",
    min: 10,
    max: 16,
    action: "Prompt corrective action required",
    hex: "#F97316",
    darkChip: "bg-[#431407] text-[#FB923C] border border-[#7C2D12]",
    paperChip: "bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]",
  },
  extreme: {
    key: "extreme",
    label: "Extreme",
    min: 17,
    max: 25,
    action: "Immediate action; restrict/stop activity where necessary",
    hex: "#EF4444",
    darkChip: "bg-[#450A0A] text-[#FCA5A5] border border-[#7F1D1D]",
    paperChip: "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]",
  },
};

export function scoreOf(likelihood: number, severity: number): number {
  return likelihood * severity;
}

export function levelOf(score: number): RiskLevel {
  if (score >= 17) return RISK_LEVELS.extreme;
  if (score >= 10) return RISK_LEVELS.high;
  if (score >= 5) return RISK_LEVELS.moderate;
  return RISK_LEVELS.low;
}

/** Background style for a matrix cell, intensity scales with score. */
export function cellStyle(l: number, s: number, alpha = 0.9): { backgroundColor: string; color: string } {
  const score = scoreOf(l, s);
  const level = levelOf(score);
  const intensity = 0.28 + (score / 25) * (alpha - 0.28);
  return {
    backgroundColor: hexToRgba(level.hex, intensity),
    color: score >= 10 ? "#0B0C0E" : "#0B0C0E",
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const CONTROL_TIERS: { key: keyof import("@/db/schema").ControlsByTier; name: string; tag: string; blurb: string }[] = [
  { key: "elimination", name: "Elimination", tag: "ELI", blurb: "Remove the hazard completely." },
  { key: "substitution", name: "Substitution", tag: "SUB", blurb: "Replace the hazardous material, process or equipment with something less hazardous." },
  { key: "engineering", name: "Engineering Controls", tag: "ENG", blurb: "Physically isolate people from the hazard — guarding, barriers, ventilation, interlocks." },
  { key: "administrative", name: "Administrative Controls", tag: "ADM", blurb: "Change how work is performed — procedures, training, supervision, signage, inspections." },
  { key: "ppe", name: "PPE", tag: "PPE", blurb: "Personal protective equipment as the final layer of protection." },
];
