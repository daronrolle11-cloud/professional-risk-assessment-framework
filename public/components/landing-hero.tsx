"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { LevelBadge } from "./risk-badge";
import { LIKELIHOOD_SCALE, SEVERITY_SCALE, cellStyle, levelOf, scoreOf } from "@/lib/risk";
import { MARQUEE_ITEMS } from "@/lib/data";

const SCAN_PRESETS = [
  { l: 4, s: 4 },
  { l: 3, s: 5 },
  { l: 5, s: 3 },
  { l: 2, s: 5 },
  { l: 4, s: 2 },
  { l: 5, s: 5 },
];

function RiskConsole() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SCAN_PRESETS.length), 2600);
    return () => clearInterval(t);
  }, []);
  const { l, s } = SCAN_PRESETS[idx];
  const score = scoreOf(l, s);
  const level = levelOf(score);

  return (
    <div className="panel relative overflow-hidden p-5 md:p-6">
      <div className="grid-bg-fine pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]" />
          </div>
          <span className="mono text-[10px] uppercase tracking-[0.24em] text-white/45">RISK MATRIX · LIVE</span>
          <span className="mono text-[10px] text-[var(--brand-teal-soft)]">RA-{new Date().getFullYear()}</span>
        </div>

        <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-[5px]">
          <div />
          {[1, 2, 3, 4, 5].map((x) => (
            <div key={x} className={`mono flex h-7 items-center justify-center text-[10px] font-bold transition-colors ${x === l ? "text-[var(--brand-gold)]" : "text-white/30"}`}>
              {x}
            </div>
          ))}
          {[5, 4, 3, 2, 1].map((y) => (
            <ConsoleRow key={y} y={y} activeL={l} activeS={s} />
          ))}
        </div>

        <div className="mono mt-1.5 flex justify-between px-1 text-[9px] uppercase tracking-[0.2em] text-white/30">
          <span>Severity ↑</span>
          <span>Likelihood →</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="mono-label !text-[9px]">Likelihood</div>
            <AnimatePresence mode="wait">
              <motion.div key={l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-1 text-sm font-semibold">
                {l} — {LIKELIHOOD_SCALE[l - 1].label}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="mono-label !text-[9px]">Severity</div>
            <AnimatePresence mode="wait">
              <motion.div key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-1 text-sm font-semibold">
                {s} — {SEVERITY_SCALE[s - 1].label}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-4">
          <div>
            <div className="mono-label !text-[9px]">Risk Score</div>
            <div className="relative h-10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={score}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28 }}
                  className="font-display text-4xl"
                  style={{ color: level.hex }}
                >
                  {score}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="text-right">
            <LevelBadge score={score} />
            <div className="mono mt-2 max-w-[180px] text-[9px] uppercase leading-relaxed tracking-[0.14em] text-white/40">{level.action}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsoleRow({ y, activeL, activeS }: { y: number; activeL: number; activeS: number }) {
  return (
    <>
      <div className={`mono flex w-7 items-center justify-center text-[10px] font-bold transition-colors ${y === activeS ? "text-[var(--brand-gold)]" : "text-white/30"}`}>{y}</div>
      {[1, 2, 3, 4, 5].map((x) => {
        const active = x === activeL && y === activeS;
        return (
          <motion.div
            key={x}
            animate={{ scale: active ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={`flex h-9 items-center justify-center rounded-md text-[11px] mono font-bold md:h-11 ${active ? "scan-pulse" : ""}`}
            style={{ ...cellStyle(x, y, active ? 1 : 0.3), outline: active ? "2px solid rgba(255,255,255,0.9)" : undefined, outlineOffset: 1, zIndex: active ? 2 : 1, position: "relative" }}
          >
            {x * y}
          </motion.div>
        );
      })}
    </>
  );
}

const STATS = [
  ["5 × 5", "Likelihood × Severity matrix"],
  ["5-tier", "Hierarchy of controls"],
  ["Ch. 321C", "HSW Act 2002 anchored"],
  ["S.22", "Safety committee mandated"],
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16">
      <div className="grid-bg absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--brand-teal)]/[0.05] blur-[120px]" />
      <div className="pointer-events-none absolute right-[-200px] top-1/3 h-[420px] w-[420px] rounded-full bg-[var(--brand-gold)]/[0.08] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pt-24 md:pb-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-7 inline-flex items-center gap-3 rounded-full border border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/[0.08] px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-teal)]" />
              <span className="mono text-[10px] uppercase tracking-[0.24em] text-[var(--brand-teal-soft)]">Health &amp; Safety Reporting Dashboard</span>
            </motion.div>

            <h1 className="font-display leading-[0.94] tracking-tight" style={{ fontSize: "clamp(3rem, 7.5vw, 6.4rem)" }}>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.05 }} className="block">EVERY HAZARD.</motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.15 }} className="outline-text block">EVERY CONTROL.</motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.25 }} className="block text-[var(--brand-teal-soft)]">DOCUMENTED.</motion.span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38 }} className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-white/60">
              BCSO&apos;s internal Health &amp; Safety Reporting Dashboard — operationalising the HSW Act 2002
              risk-management sequence across Bahamian workplaces. Identify hazards, evaluate likelihood × severity,
              control via the hierarchy, engage the Safety Committee, record, and review — with the
              <span className="text-white/85"> Department of Labour</span> as the inspecting authority.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/assessments/new" className="btn btn-primary">
                New risk assessment <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin" className="btn btn-ghost">
                Open dashboard
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }} className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/15 bg-[var(--brand-teal)]/15 sm:grid-cols-4">
              {STATS.map(([v, k]) => (
                <div key={k} className="bg-[var(--brand-navy-deep)] px-4 py-4">
                  <div className="font-display text-xl text-[var(--brand-gold)]">{v}</div>
                  <div className="mono mt-1 text-[9px] uppercase leading-relaxed tracking-[0.14em] text-white/40">{k}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="lg:justify-self-end lg:pr-2">
            <div className="w-full max-w-[440px]">
              <RiskConsole />
              <div className="mono mt-3 flex items-center justify-between px-1 text-[9px] uppercase tracking-[0.2em] text-white/30">
                <span>Adopted organisational rating methodology</span>
                <span>Score = L × S</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative border-y border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)]">
        <div className="marquee-track items-center py-3.5">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {MARQUEE_ITEMS.map((item, i) => (
                <div key={`${dup}-${i}`} className="flex items-center">
                  <span className="mono whitespace-nowrap px-6 text-[10.5px] uppercase tracking-[0.22em] text-white/45">{item}</span>
                  <span className="hazard-stripes inline-block h-2.5 w-8 shrink-0 rounded-[2px]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl justify-center px-5 py-8 md:px-8">
        <a href="#methodology" className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          The methodology <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
