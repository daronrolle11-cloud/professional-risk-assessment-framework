"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AGE_PROFILES, estimateOperation, ISLANDS, PROPERTY_TYPES, TRADES } from "@/lib/operations";

const OUT = [
  { key: "inspectionFee", label: "Client Invoice", fmt: (v: number) => `$${v.toLocaleString()}` },
  { key: "contractorPayout", label: "Contractor Payout", fmt: (v: number) => `−$${v.toLocaleString()}` },
  { key: "margin", label: "Operating Margin", fmt: (v: number) => `$${v.toLocaleString()}` },
] as const;

export function OpsVisualizer() {
  const [islandId, setIslandId] = useState("new-providence");
  const [ageId, setAgeId] = useState("mid");
  const [propertyTypeId, setPropertyTypeId] = useState("villa");
  const [trades, setTrades] = useState<string[]>(["electrical"]);
  const [sqft, setSqft] = useState(3200);

  const est = estimateOperation({ islandId, trades, squareFeet: sqft, ageId, propertyTypeId });

  function toggleTrade(t: string) {
    setTrades((prev) => (prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]));
  }

  const complianceColor = est.projectedCompliance >= 90 ? "#22C55E" : est.projectedCompliance >= 70 ? "#EAB308" : "#ef4444";

  return (
    <div className="bcso-panel p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="mono-label">Operations Visualizer</span>
        <span className="mono rounded-full border border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.16em] text-[var(--brand-teal-soft)]">
          Live model
        </span>
      </div>
      <p className="mb-5 text-xs leading-relaxed text-white/40">
        Explore how property metrics, structural risk profiles and trade scope drive compliance scores, remediation fees and margin per job.
      </p>

      <div className="space-y-4">
        <div>
          <div className="mono-label !text-[9px] mb-1.5">Island</div>
          <select className="field !py-2.5 !text-[13px]" value={islandId} onChange={(e) => setIslandId(e.target.value)}>
            {ISLANDS.map((i) => <option key={i.id} value={i.id}>{i.name}{i.calloutFee > 0 ? ` · +$${i.calloutFee} callout` : ""}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mono-label !text-[9px] mb-1.5">Property type</div>
            <select className="field !py-2.5 !text-[13px]" value={propertyTypeId} onChange={(e) => setPropertyTypeId(e.target.value)}>
              {PROPERTY_TYPES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div className="mono-label !text-[9px] mb-1.5">Structural profile</div>
            <select className="field !py-2.5 !text-[13px]" value={ageId} onChange={(e) => setAgeId(e.target.value)}>
              {AGE_PROFILES.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="mono-label !text-[9px] mb-1.5">Trade scope</div>
          <div className="flex flex-wrap gap-1.5">
            {TRADES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTrade(t.id)}
                className={`mono rounded-full border px-3 py-1.5 text-[9.5px] uppercase tracking-[0.12em] transition-colors ${
                  trades.includes(t.id)
                    ? "border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]"
                    : "border-white/15 text-white/45 hover:border-[var(--brand-teal)]/35"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="mono-label !text-[9px]">Floor area</span>
            <span className="mono text-[10px] text-[var(--brand-teal-soft)]">{sqft.toLocaleString()} sq ft</span>
          </div>
          <input type="range" min={800} max={9000} step={100} value={sqft} onChange={(e) => setSqft(Number(e.target.value))} className="w-full accent-[var(--brand-teal)]" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="col-span-2 flex items-center justify-between rounded-xl border border-[var(--brand-teal)]/12 bg-black/25 px-4 py-3">
          <div>
            <div className="mono-label !text-[8.5px]">Projected compliance</div>
            <div className="font-display mt-0.5 text-2xl" style={{ color: complianceColor }}>{est.projectedCompliance}%</div>
          </div>
          <div className="h-9 w-28 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: complianceColor }} animate={{ width: `${est.projectedCompliance}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        {OUT.map((o) => (
          <div key={o.key} className="rounded-xl border border-[var(--brand-teal)]/12 bg-black/25 px-3.5 py-3">
            <div className="mono-label !text-[8.5px]">{o.label}</div>
            <motion.div
              key={`${o.key}-${est[o.key]}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`font-display mt-0.5 text-xl ${o.key === "margin" ? (est.margin >= 0 ? "text-[#4ADE80]" : "text-[#F87171]") : ""}`}
            >
              {o.fmt(est[o.key])}
            </motion.div>
          </div>
        ))}
        <div className="rounded-xl border border-[var(--brand-teal)]/12 bg-black/25 px-3.5 py-3">
          <div className="mono-label !text-[8.5px]">Margin %</div>
          <motion.div key={est.marginPct} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`font-display mt-0.5 text-xl ${est.marginPct >= 25 ? "text-[#4ADE80]" : "text-[var(--brand-gold)]"}`}>
            {est.marginPct}%
          </motion.div>
        </div>
        <div className="rounded-xl border border-[var(--brand-teal)]/12 bg-black/25 px-3.5 py-3">
          <div className="mono-label !text-[8.5px]">Remediation support est.</div>
          <motion.div key={est.remediationFee} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="font-display mt-0.5 text-xl text-[#ffb37a]">
            ${est.remediationFee.toLocaleString()}
          </motion.div>
        </div>
      </div>
      <p className="mono mt-3 text-[8.5px] uppercase leading-relaxed tracking-[0.12em] text-white/25">
        Model: trade base fee × size × age-risk × property profile + island callout. Contractor payout 55% + callout pass-through; admin cost $75/job. Illustrative planning figures.
      </p>
    </div>
  );
}
