"use client";

import { motion } from "framer-motion";
import {
  Construction, Factory, Building2, Warehouse, Stethoscope, UtensilsCrossed, Store, Wrench,
  GraduationCap, Briefcase, Check,
} from "lucide-react";
import { INDUSTRIES, JURISDICTION_OPTIONS } from "@/lib/data";
import type { StepProps } from "./ui";
import { Label, StepHeader } from "./ui";

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  construction: Construction,
  manufacturing: Factory,
  office: Building2,
  warehouse: Warehouse,
  healthcare: Stethoscope,
  hospitality: UtensilsCrossed,
  retail: Store,
  facilities: Wrench,
  education: GraduationCap,
  general: Briefcase,
};

export function IndustryStep({ form, patch }: StepProps) {
  const selected = INDUSTRIES.find((i) => i.id === form.industry);
  return (
    <div>
      <StepHeader
        kicker="Step 01 / Industry & Task"
        title="Where is the work happening?"
        desc="The industry you select tunes the hazard library and the regulatory references suggested later in the assessment."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((ind, i) => {
          const Icon = INDUSTRY_ICONS[ind.id] ?? Briefcase;
          const active = form.industry === ind.id;
          return (
            <motion.button
              key={ind.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              onClick={() => patch({ industry: ind.id })}
              className={`group relative rounded-xl border p-5 text-left transition-all ${
                active ? "border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/[0.08]" : "border-[var(--brand-teal)]/12 bg-[var(--brand-navy-deep)] hover:border-[var(--brand-teal)]/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <Icon className={`h-5 w-5 ${active ? "text-[var(--brand-gold)]" : "text-white/40 group-hover:text-white/70"}`} />
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${active ? "border-[var(--brand-teal)] bg-[var(--brand-teal)]" : "border-white/20"}`}>
                  {active && <Check className="h-3 w-3 text-black" strokeWidth={3.5} />}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{ind.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/40">{ind.blurb}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-[#0d1013] p-6">
        <Label>Activity / Task being assessed *</Label>
        <input
          className="field"
          placeholder="e.g. General office work — Meridian House, Floors 2–4"
          value={form.activity}
          onChange={(e) => patch({ activity: e.target.value })}
        />
        {selected && (
          <div className="mt-4">
            <div className="mono-label !text-[9px] mb-2">Suggested tasks — {selected.name}</div>
            <div className="flex flex-wrap gap-2">
              {selected.tasks.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => patch({ activity: t })}
                  className={`mono rounded-full border px-3.5 py-1.5 text-[10.5px] normal-case tracking-normal transition-colors ${
                    form.activity === t ? "border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" : "border-white/15 text-white/55 hover:border-[var(--brand-teal)]/50 hover:text-[var(--brand-teal-soft)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



export function DetailsStep({ form, patch }: StepProps) {
  return (
    <div>
      <StepHeader
        kicker="Step 02 / Document Header"
        title="Who, where and when."
        desc="Everything here prints in the header block of the final professional document. Statutory references are compiled automatically at the Review step from your framework and hazards — and remain fully editable."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Organization *</Label>
          <input className="field" placeholder="Harbourview Corporate Centre Ltd" value={form.organization} onChange={(e) => patch({ organization: e.target.value })} />
        </div>
        <div>
          <Label>Department</Label>
          <input className="field" placeholder="Facilities & Workplace" value={form.department} onChange={(e) => patch({ department: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Location</Label>
          <input className="field" placeholder="Shirley Street, Nassau, New Providence, The Bahamas" value={form.location} onChange={(e) => patch({ location: e.target.value })} />
        </div>
        <div>
          <Label>Assessor (competent person)</Label>
          <input className="field" placeholder="D. Whitfield — OSH Practitioner" value={form.assessor} onChange={(e) => patch({ assessor: e.target.value })} />
        </div>
        <div>
          <Label>Responsible Manager</Label>
          <input className="field" placeholder="S. Rahming — Facilities Manager" value={form.responsibleManager} onChange={(e) => patch({ responsibleManager: e.target.value })} />
        </div>
        <div>
          <Label>Assessment No.</Label>
          <input className="field mono" value={form.assessmentNo} onChange={(e) => patch({ assessmentNo: e.target.value })} />
        </div>
        <div>
          <Label>Number of Employees Exposed</Label>
          <input className="field" type="number" min={0} value={form.employeesExposed} onChange={(e) => patch({ employeesExposed: e.target.value })} />
        </div>
        <div>
          <Label>Assessment Date</Label>
          <input className="field" type="date" value={form.assessmentDate} onChange={(e) => patch({ assessmentDate: e.target.value })} />
        </div>
        <div>
          <Label>Review Date</Label>
          <input className="field" type="date" value={form.reviewDate} onChange={(e) => patch({ reviewDate: e.target.value })} />
        </div>
      </div>

      <div className="mt-6">
        <Label hint="Determines which legal references are compiled onto the document. Bahamian law governs workplaces in The Bahamas; OSHA/HSE apply only as recognized good practice.">
          Jurisdiction / framework
        </Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JURISDICTION_OPTIONS.map((j) => {
            const active = form.jurisdiction === j.id;
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => patch({ jurisdiction: j.id })}
                className={`rounded-xl border p-4 text-left transition-all ${active ? "border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/[0.08]" : "border-[var(--brand-teal)]/12 bg-[var(--brand-navy-deep)] hover:border-[var(--brand-teal)]/30"}`}
              >
                <div className={`text-sm font-semibold ${active ? "text-[var(--brand-teal-soft)]" : ""}`}>{j.label}</div>
                <div className="mt-1 text-xs text-white/40">{j.note}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
