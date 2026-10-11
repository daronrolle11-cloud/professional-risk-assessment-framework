"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { LevelBadge } from "./risk-badge";
import { LIKELIHOOD_SCALE, SEVERITY_SCALE, RISK_LEVELS, cellStyle, levelOf, scoreOf } from "@/lib/risk";

export function LandingMatrix() {
  const [l, setL] = useState(4);
  const [s, setS] = useState(4);
  const score = scoreOf(l, s);
  const level = levelOf(score);

  return (
    <section id="matrix" className="relative overflow-hidden border-t border-white/5 bg-[#0a0c0e]">
      <div className="grid-bg-fine pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="mb-4 flex items-center gap-3">
          <span className="hazard-stripes h-3 w-10 rounded-[2px]" />
          <span className="mono-label">03 / The Matrix</span>
        </div>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl leading-[1.02] md:text-6xl">
              RATE IT. <span className="text-[var(--brand-gold)]">RANK IT.</span>
              <span className="outline-text block">ACT ON IT.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/55">
              Risk Score = Likelihood × Severity. Click any cell to see the organisation’s adopted rating
              methodology in action — the same engine that drives every generated assessment.
            </p>

            <div className="mt-8 space-y-2.5">
              {(["extreme", "high", "moderate", "low"] as const).map((k) => {
                const lv = RISK_LEVELS[k];
                const active = level.key === k;
                return (
                  <div
                    key={k}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all ${active ? "border-white/30 bg-white/[0.06]" : "border-white/8 bg-transparent opacity-55"}`}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: lv.hex }} />
                    <span className="mono w-16 shrink-0 text-xs font-bold" style={{ color: lv.hex }}>{lv.min}–{lv.max}</span>
                    <span className="w-24 shrink-0 text-sm font-semibold">{lv.label}</span>
                    <span className="hidden text-xs text-white/45 md:block">{lv.action}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-3 rounded-xl border border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/[0.05] p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-teal-soft)]" />
              <p className="text-xs leading-relaxed text-white/55">
                The 1–5 × 1–5 presentation is treated as the organisation’s adopted risk-rating methodology.
                OSHA guidance emphasises evaluating severity and likelihood but does not prescribe this particular matrix.
              </p>
            </div>
          </div>

          <div>
            <div className="panel p-5 md:p-7">
              <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-[6px]">
                <div />
                {LIKELIHOOD_SCALE.map((p) => (
                  <button key={p.value} onClick={() => setL(p.value)} className={`flex h-12 flex-col items-center justify-center rounded-md transition-colors ${l === p.value ? "text-[var(--brand-gold)]" : "text-white/35 hover:text-white/70"}`} title={p.description}>
                    <span className="mono text-xs font-bold">{p.value}</span>
                    <span className="mono hidden text-[7.5px] uppercase tracking-wider md:block">{p.label}</span>
                  </button>
                ))}
                {[5, 4, 3, 2, 1].map((sv) => (
                  <MatrixLandingRow key={sv} sv={sv} l={l} s={s} setL={setL} setS={setS} />
                ))}
              </div>
              <div className="mono mt-2 flex justify-between px-1 text-[9px] uppercase tracking-[0.2em] text-white/30">
                <span>Severity ↑</span>
                <span>Likelihood →</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${l}-${s}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-5"
                >
                  <div>
                    <div className="mono-label !text-[9px]">
                      {LIKELIHOOD_SCALE[l - 1].label} × {SEVERITY_SCALE[s - 1].label}
                    </div>
                    <div className="font-display mt-1 text-6xl leading-none" style={{ color: level.hex }}>{score}</div>
                  </div>
                  <div className="max-w-[45%] text-right">
                    <LevelBadge score={score} />
                    <p className="mono mt-3 text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/50">{level.action}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                  <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/40">Likelihood {l}</span>
                  <p className="mt-1 text-white/60">{LIKELIHOOD_SCALE[l - 1].description}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                  <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/40">Severity {s}</span>
                  <p className="mt-1 text-white/60">{SEVERITY_SCALE[s - 1].description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatrixLandingRow({ sv, l, s, setL, setS }: { sv: number; l: number; s: number; setL: (v: number) => void; setS: (v: number) => void }) {
  const point = SEVERITY_SCALE[sv - 1];
  return (
    <>
      <button onClick={() => setS(sv)} className={`flex w-14 flex-col items-center justify-center rounded-md transition-colors ${s === sv ? "text-[var(--brand-gold)]" : "text-white/35 hover:text-white/70"}`} title={point.description}>
        <span className="mono text-xs font-bold">{sv}</span>
        <span className="mono hidden text-[7.5px] uppercase tracking-wider md:block">{point.label}</span>
      </button>
      {[1, 2, 3, 4, 5].map((lk) => {
        const active = lk === l && sv === s;
        const inRow = sv === s || lk === l;
        return (
          <motion.button
            key={lk}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setL(lk); setS(sv); }}
            className="mono relative flex h-12 items-center justify-center rounded-md text-sm font-bold md:h-14"
            style={{
              ...cellStyle(lk, sv, active ? 1 : inRow ? 0.55 : 0.32),
              outline: active ? "2.5px solid #fff" : undefined,
              outlineOffset: 2,
              zIndex: active ? 2 : 1,
            }}
            title={`L${lk} × S${sv} = ${lk * sv}`}
          >
            {lk * sv}
          </motion.button>
        );
      })}
    </>
  );
}
