"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, ChevronDown, ClipboardList, Cog, HardHat, RefreshCcw, Repeat, Wand2 } from "lucide-react";
import { CONTROL_TIERS, LIKELIHOOD_SCALE, SEVERITY_SCALE, scoreOf } from "@/lib/risk";
import { compileRegulations, JURISDICTION_LABELS } from "@/lib/data";
import { LevelBadge, MiniMatrix } from "@/components/risk-badge";
import type { ControlsByTier } from "@/db/schema";
import type { StepProps } from "./ui";
import { Chip, Label, StepHeader } from "./ui";

const TIER_ICONS: Record<keyof ControlsByTier, React.ComponentType<{ className?: string }>> = {
  elimination: Ban,
  substitution: Repeat,
  engineering: Cog,
  administrative: ClipboardList,
  ppe: HardHat,
};

export function ControlsStep({ form, updateHazard }: StepProps) {
  const [open, setOpen] = useState<string | null>(form.hazards[0]?.uid ?? null);

  function setTier(uid: string, current: ControlsByTier, key: keyof ControlsByTier, raw: string) {
    updateHazard(uid, { controls: { ...current, [key]: raw.split("\n") } });
  }

  return (
    <div>
      <StepHeader
        kicker="Step 05 / Controls & Actions"
        title="Control it — in the right order."
        desc="Recommendations follow the hierarchy of controls: elimination first, PPE last. Edit any line (one control per line), assign an owner and deadline, then reassess to record residual risk."
      />
      <div className="space-y-3">
        {form.hazards.map((h, i) => {
          const expanded = open === h.uid;
          const initial = scoreOf(h.likelihood, h.severity);
          const residual = scoreOf(h.residualLikelihood, h.residualSeverity);
          return (
            <div key={h.uid} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1013]">
              <button type="button" onClick={() => setOpen(expanded ? null : h.uid)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]">
                <span className="font-display w-7 text-lg text-white/25">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">{h.description || "Untitled custom hazard"}</p>
                  <p className="mono mt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-white/35">{h.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono hidden text-[9px] uppercase tracking-wider text-white/30 sm:block">Initial</span>
                  <LevelBadge score={initial} size="sm" />
                  <span className="text-white/25">→</span>
                  <span className="mono hidden text-[9px] uppercase tracking-wider text-white/30 sm:block">Residual</span>
                  <LevelBadge score={residual} size="sm" />
                </div>
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="border-t border-white/10">
                      {/* Hierarchy tiers */}
                      <div className="divide-y divide-white/5">
                        {CONTROL_TIERS.map((tier, ti) => {
                          const Icon = TIER_ICONS[tier.key];
                          const lines = h.controls[tier.key];
                          return (
                            <div key={tier.key} className="grid gap-3 p-4 md:grid-cols-[250px_1fr] md:p-5">
                              <div className="flex items-start gap-3">
                                <span className="mono w-8 shrink-0 pt-1 text-[10px] font-bold text-white/25">{String(ti + 1).padStart(2, "0")}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${ti === 0 ? "text-[var(--brand-gold)]" : "text-white/50"}`} />
                                    <span className={`text-[13px] font-semibold ${ti === 0 ? "text-[var(--brand-gold)]" : "text-white/85"}`}>{tier.name}</span>
                                    <Chip>{tier.tag}</Chip>
                                  </div>
                                  <p className="mt-1.5 text-xs leading-relaxed text-white/35">{tier.blurb}</p>
                                </div>
                              </div>
                              <textarea
                                className="field !min-h-[64px]"
                                rows={Math.max(2, lines.length)}
                                placeholder={`— No ${tier.name.toLowerCase()} measures identified —`}
                                value={lines.join("\n")}
                                onChange={(e) => setTier(h.uid, h.controls, tier.key, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions + residual */}
                      <div className="grid gap-4 border-t border-white/10 p-4 md:grid-cols-3 md:p-5">
                        <div>
                          <Label>Responsible person</Label>
                          <input className="field" placeholder="Facilities / Building Manager" value={h.responsiblePerson} onChange={(e) => updateHazard(h.uid, { responsiblePerson: e.target.value })} />
                        </div>
                        <div>
                          <Label>Target completion</Label>
                          <input className="field" type="date" value={h.dueDate} onChange={(e) => updateHazard(h.uid, { dueDate: e.target.value })} />
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
                          <div className="mb-2.5 flex items-center justify-between">
                            <Label>Residual risk</Label>
                            <button
                              type="button"
                              onClick={() => updateHazard(h.uid, { residualLikelihood: Math.max(1, h.likelihood - 2), residualSeverity: h.severity })}
                              className="mono flex items-center gap-1.5 rounded-md border border-white/15 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:border-[var(--brand-teal)]/50 hover:text-[var(--brand-teal-soft)]"
                            >
                              <Wand2 className="h-3 w-3" /> Estimate
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select className="field !px-2.5 !py-2 !text-xs" value={h.residualLikelihood} onChange={(e) => updateHazard(h.uid, { residualLikelihood: Number(e.target.value) })}>
                              {LIKELIHOOD_SCALE.map((p) => <option key={p.value} value={p.value}>L{p.value} — {p.label}</option>)}
                            </select>
                            <select className="field !px-2.5 !py-2 !text-xs" value={h.residualSeverity} onChange={(e) => updateHazard(h.uid, { residualSeverity: Number(e.target.value) })}>
                              {SEVERITY_SCALE.map((p) => <option key={p.value} value={p.value}>S{p.value} — {p.label}</option>)}
                            </select>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <MiniMatrix likelihood={h.residualLikelihood} severity={h.residualSeverity} />
                            <LevelBadge score={residual} size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewStep({ form, patch }: StepProps) {
  const profile = form.hazards.reduce(
    (acc, h) => {
      const s = scoreOf(h.likelihood, h.severity);
      if (s >= 17) acc.extreme += 1;
      else if (s >= 10) acc.high += 1;
      else if (s >= 5) acc.moderate += 1;
      else acc.low += 1;
      return acc;
    },
    { extreme: 0, high: 0, moderate: 0, low: 0 }
  );

  return (
    <div>
      <StepHeader
        kicker="Step 06 / Review & Issue"
        title="Final check before sign-off."
        desc="Verify the header, the hazard profile and the compiled regulation references. Issue the document, or keep it as a working draft."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0d1013] p-5">
          <div className="mono-label mb-4">Document header</div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Assessment No.", form.assessmentNo],
              ["Organization", form.organization || "—"],
              ["Department", form.department || "—"],
              ["Location", form.location || "—"],
              ["Activity / Task", form.activity || "—"],
              ["Assessor", form.assessor || "—"],
              ["Responsible Manager", form.responsibleManager || "—"],
              ["Employees Exposed", form.employeesExposed || "0"],
              ["Assessment Date", form.assessmentDate || "—"],
              ["Review Date", form.reviewDate || "—"],
              ["Framework", JURISDICTION_LABELS[form.jurisdiction]],
              ["Hazards recorded", String(form.hazards.length)],
            ].map(([k, v]) => (
              <div key={k as string} className="min-w-0">
                <dt className="mono text-[9px] uppercase tracking-[0.16em] text-white/35">{k}</dt>
                <dd className="mt-0.5 truncate text-[13px] text-white/85">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d1013] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="mono-label">Initial risk profile</span>
            <div className="flex gap-2">
              {profile.extreme > 0 && <Chip tone="amber">{profile.extreme} Extreme</Chip>}
              {profile.high > 0 && <Chip>{profile.high} High</Chip>}
              {profile.moderate > 0 && <Chip>{profile.moderate} Moderate</Chip>}
              {profile.low > 0 && <Chip>{profile.low} Low</Chip>}
            </div>
          </div>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {form.hazards.map((h, i) => (
              <li key={h.uid} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/30 px-3 py-2">
                <span className="mono w-5 text-[10px] text-white/30">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-white/75">{h.description || "Untitled hazard"}</span>
                <LevelBadge score={scoreOf(h.likelihood, h.severity)} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-[#0d1013] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="mono-label">Applicable regulations / standards</div>
            <p className="mt-1 text-xs text-white/40">Auto-compiled from your framework and selected hazards — Bahamian statute first, international good practice clearly separated. One reference per line, fully editable.</p>
          </div>
          <button
            type="button"
            onClick={() => patch({ regulations: compileRegulations(form.jurisdiction, form.hazards) })}
            className="btn btn-ghost !px-3.5 !py-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Recompile
          </button>
        </div>
        <textarea
          className="field mono !min-h-[180px] !text-[12.5px] leading-relaxed"
          value={form.regulations}
          onChange={(e) => patch({ regulations: e.target.value })}
          placeholder="No references compiled yet — press Recompile."
        />
      </div>

      <p className="mono mt-5 text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/30">
        On issue, the document becomes a locked-format professional risk assessment with sign-off block, review record and
        the statutory-style disclaimer. It can be edited at any time from the register.
      </p>
    </div>
  );
}
