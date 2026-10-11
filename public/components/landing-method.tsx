"use client";

import { motion } from "framer-motion";
import { Search, Users, Calculator, Layers, FileText, RefreshCcw, Ban, Repeat, Cog, ClipboardList, HardHat } from "lucide-react";
import { CONTROL_TIERS } from "@/lib/risk";

const STEPS = [
  {
    icon: Search,
    no: "01",
    title: "Identify Hazards",
    body: "Walk the workplace, consult the people doing the work, review incident and inspection records. Proactive identification — before harm occurs.",
    tags: ["HSE — Step 1", "OSHA — Proactive ID"],
  },
  {
    icon: Users,
    no: "02",
    title: "Who Might Be Harmed",
    body: "Determine who could be harmed and how — employees, contractors, visitors, and those more vulnerable: young workers, expectant mothers, lone workers.",
    tags: ["HSE — Step 2"],
  },
  {
    icon: Calculator,
    no: "03",
    title: "Evaluate the Risk",
    body: "Rate likelihood against severity on the 5×5 matrix. Prioritise by score — severity and likelihood weighed together, as OSHA guidance directs.",
    tags: ["HSE — Step 3", "OSHA — Prioritise"],
  },
  {
    icon: Layers,
    no: "04",
    title: "Control via the Hierarchy",
    body: "Select controls in order of effectiveness — elimination first, PPE last. OSHA explicitly recommends the hierarchy for choosing corrective measures.",
    tags: ["OSHA — Hierarchy", "NIOSH"],
  },
  {
    icon: FileText,
    no: "05",
    title: "Record Your Findings",
    body: "Generate the professional document — hazards, persons at risk, scores, controls, owners, deadlines, residual risk, sign-off and regulations.",
    tags: ["HSE — Step 4"],
  },
  {
    icon: RefreshCcw,
    no: "06",
    title: "Review & Revise",
    body: "Set the review date. Revisit after change, incident or new information — a living document, not a drawer-filler.",
    tags: ["HSE — Step 5"],
  },
];

const TIER_ICONS = [Ban, Repeat, Cog, ClipboardList, HardHat];
const TIER_EFFECTIVENESS = [100, 82, 66, 46, 26];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55 },
};

export function LandingMethod() {
  return (
    <section id="methodology" className="relative border-t border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <motion.div {...fadeUp} className="mb-4 flex items-center gap-3">
          <span className="hazard-stripes h-3 w-10 rounded-[2px]" />
          <span className="mono-label">01 / The Sequence</span>
        </motion.div>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl leading-[1.02] md:text-6xl">
              BUILT ON THE SEQUENCE <span className="text-[var(--brand-gold)]">REGULATORS EXPECT.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/55">
              In The Bahamas, the legal duty rests on the <span className="text-white/80">Health and Safety at Work Act 2002 (s.4)</span> —
              enforced through the Department of Labour&apos;s Labour Inspection Section. HSE contributes the five-step method;
              OSHA contributes the hierarchy of controls. BCSO fuses all three into every document.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.no}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
                className="panel group p-5 transition-colors hover:border-[var(--brand-teal)]/40"
              >
                <div className="flex items-center justify-between">
                  <s.icon className="h-5 w-5 text-[var(--brand-teal)]" />
                  <span className="font-display text-2xl text-white/12 transition-colors group-hover:text-[var(--brand-teal)]/30">{s.no}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">{s.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="mono rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-white/45">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hierarchy of controls */}
        <div className="mt-28 grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div {...fadeUp}>
            <div className="mb-4 flex items-center gap-3">
              <span className="hazard-stripes h-3 w-10 rounded-[2px]" />
              <span className="mono-label">02 / The Hierarchy</span>
            </div>
            <h2 className="font-display text-4xl leading-[1.02] md:text-6xl">
              MOST EFFECTIVE <span className="outline-amber block">FIRST.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/55">
              Every recommended control in a BCSO assessment is presented in this order. OSHA explicitly recommends
              selecting controls according to the hierarchy — and notes PPE is the least effective level when used alone.
            </p>
            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mono-label mb-2">Principle</div>
              <p className="text-sm leading-relaxed text-white/60">
                “Elimination” physically removes the risk. Every step down relies more on human behaviour — which is why
                strong assessments push controls as far up the stack as reasonably practicable.
              </p>
            </div>
          </motion.div>
          <div className="space-y-3">
            {CONTROL_TIERS.map((t, i) => {
              const Icon = TIER_ICONS[i];
              const width = 100 - i * 11;
              return (
                <motion.div
                  key={t.key}
                  initial={{ opacity: 0, x: 32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  style={{ width: `${width}%` }}
                  className="group"
                >
                  <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 md:p-5 ${i === 0 ? "border-[var(--brand-gold)]/45 bg-[var(--brand-gold)]/[0.08]" : "border-[var(--brand-teal)]/12 bg-[var(--brand-navy-deep)] hover:border-[var(--brand-teal)]/25"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${i === 0 ? "bg-[var(--brand-gold)] text-[var(--brand-navy)]" : "border border-[var(--brand-teal)]/15 bg-black/40 text-white/70"}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-display text-base tracking-wide md:text-lg">
                            {i + 1}. {t.name.toUpperCase()}
                          </h3>
                          <span className="mono shrink-0 text-[9px] uppercase tracking-[0.2em] text-white/35">{t.tag}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-white/45 md:whitespace-normal">{t.blurb}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${TIER_EFFECTIVENESS[i]}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: i === 0 ? "var(--brand-gold)" : `rgba(255,255,255,${0.5 - i * 0.09})` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div className="mono flex justify-between px-1 pt-1 text-[9px] uppercase tracking-[0.2em] text-white/30">
              <span>Most effective</span>
              <span>Least effective — last line of defence</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
