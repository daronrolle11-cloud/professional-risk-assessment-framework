"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { libraryForIndustry } from "@/lib/data";
import { scoreOf } from "@/lib/risk";
import { LevelBadge, MiniMatrix } from "@/components/risk-badge";
import { LIKELIHOOD_SCALE, SEVERITY_SCALE } from "@/lib/risk";
import type { StepProps } from "./ui";
import { Chip, Label, StepHeader } from "./ui";

export function HazardsStep({ form, addFromTemplate, addCustom, removeHazard }: StepProps) {
  const [query, setQuery] = useState("");
  const library = useMemo(() => libraryForIndustry(form.industry), [form.industry]);
  const filtered = library.filter(
    (h) =>
      !query ||
      h.description.toLowerCase().includes(query.toLowerCase()) ||
      h.category.toLowerCase().includes(query.toLowerCase())
  );
  const addedDescriptions = new Set(form.hazards.map((h) => h.description));

  return (
    <div>
      <StepHeader
        kicker="Step 03 / Identify Hazards"
        title="What could cause harm?"
        desc="Select from the industry-tuned library — each entry arrives with pre-engineered hierarchy-of-controls recommendations and regulation references. Add custom hazards for anything site-specific."
      />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Library */}
        <div className="rounded-xl border border-white/10 bg-[#0d1013]">
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            <Search className="h-4 w-4 text-white/35" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
              placeholder={`Search ${library.length} hazards for this industry…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[560px] divide-y divide-white/5 overflow-y-auto">
            {filtered.map((t) => {
              const added = addedDescriptions.has(t.description);
              return (
                <div key={t.key} className={`p-4 transition-colors ${added ? "bg-[var(--brand-teal)]/[0.05]" : "hover:bg-white/[0.02]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={added ? "amber" : "default"}>{t.category}</Chip>
                        <span className="mono text-[10px] text-white/35">L{t.likelihood} × S{t.severity} = {t.likelihood * t.severity}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-snug text-white/80">{t.description}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/40">{t.personsAtRisk}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !added && addFromTemplate(t)}
                      className={`mono flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] uppercase tracking-[0.14em] transition-all ${
                        added ? "cursor-default border-[var(--brand-teal)]/40 text-[var(--brand-teal-soft)]" : "border-white/15 text-white/60 hover:border-[var(--brand-teal)]/60 hover:text-[var(--brand-teal-soft)]"
                      }`}
                    >
                      {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-white/40">No library hazards match “{query}”.</div>
            )}
          </div>
        </div>

        {/* Selected */}
        <div className="rounded-xl border border-white/10 bg-[#0d1013] p-4 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <span className="mono-label">Selected — {form.hazards.length}</span>
            <button type="button" onClick={addCustom} className="mono flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white/60 transition-colors hover:border-[var(--brand-teal)]/60 hover:text-[var(--brand-teal-soft)]">
              <Plus className="h-3 w-3" /> Custom hazard
            </button>
          </div>
          {form.hazards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/35">
              No hazards selected yet.
              <br />Add from the library or create a custom hazard.
            </div>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {form.hazards.map((h, i) => (
                  <motion.li
                    key={h.uid}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3.5 py-3"
                  >
                    <span className="font-display w-6 text-white/30">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-white/85">{h.description || "Untitled custom hazard"}</p>
                      <p className="mono mt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-white/35">{h.category}</p>
                    </div>
                    <LevelBadge score={scoreOf(h.likelihood, h.severity)} size="sm" />
                    <button type="button" onClick={() => removeHazard(h.uid)} className="rounded-md p-1.5 text-white/35 transition-colors hover:bg-[#ef4444]/10 hover:text-[#ff7b7b]" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function EvaluateStep({ form, updateHazard }: StepProps) {
  const [open, setOpen] = useState<string | null>(form.hazards[0]?.uid ?? null);

  return (
    <div>
      <StepHeader
        kicker="Step 04 / Evaluate Risk"
        title="Rate likelihood × severity."
        desc="For each hazard, confirm who might be harmed and how, record existing controls, then rate on the 5×5 matrix. The score drives prioritisation."
      />
      <div className="space-y-3">
        {form.hazards.map((h, i) => {
          const expanded = open === h.uid;
          const score = scoreOf(h.likelihood, h.severity);
          return (
            <div key={h.uid} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1013]">
              <button type="button" onClick={() => setOpen(expanded ? null : h.uid)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]">
                <span className="font-display w-7 text-lg text-white/25">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">{h.description || "Untitled custom hazard"}</p>
                  <p className="mono mt-0.5 text-[9.5px] uppercase tracking-[0.14em] text-white/35">{h.category}</p>
                </div>
                <LevelBadge score={score} size="sm" />
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="grid gap-4 border-t border-white/10 p-4 md:grid-cols-[1fr_1fr] md:p-5">
                      <div className="space-y-4 md:col-span-2 lg:col-span-1">
                        <div>
                          <Label>Hazard description *</Label>
                          <textarea className="field" rows={2} value={h.description} onChange={(e) => updateHazard(h.uid, { description: e.target.value })} />
                        </div>
                        <div>
                          <Label hint="Groups exposed, and the injury/exposure mechanism">Who might be harmed and how</Label>
                          <textarea className="field" rows={3} value={h.personsAtRisk} onChange={(e) => updateHazard(h.uid, { personsAtRisk: e.target.value })} />
                        </div>
                        <div>
                          <Label hint="Precautions already in place, before further action">Existing controls</Label>
                          <textarea className="field" rows={3} value={h.existingControls} onChange={(e) => updateHazard(h.uid, { existingControls: e.target.value })} />
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Likelihood — {LIKELIHOOD_SCALE[h.likelihood - 1].label}</Label>
                            <select className="field" value={h.likelihood} onChange={(e) => updateHazard(h.uid, { likelihood: Number(e.target.value) })}>
                              {LIKELIHOOD_SCALE.map((p) => (
                                <option key={p.value} value={p.value}>{p.value} — {p.label} · {p.description}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Severity — {SEVERITY_SCALE[h.severity - 1].label}</Label>
                            <select className="field" value={h.severity} onChange={(e) => updateHazard(h.uid, { severity: Number(e.target.value) })}>
                              {SEVERITY_SCALE.map((p) => (
                                <option key={p.value} value={p.value}>{p.value} — {p.label} · {p.description}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-4">
                          <MiniMatrix likelihood={h.likelihood} severity={h.severity} />
                          <div className="text-right">
                            <div className="mono-label !text-[9px]">Initial Risk</div>
                            <div className="font-display mt-1 text-4xl">{score}</div>
                            <div className="mt-1.5"><LevelBadge score={score} size="sm" /></div>
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
