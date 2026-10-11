"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CloudLightning, ShieldAlert, Wind, Thermometer, Info, CheckCircle2,
  Clock, MapPin, Search, AlertCircle, Camera, Check, X, Loader2, Printer,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/risk";
import { HurricaneClaimsPackage } from "@/components/hurricane-claims-package";
import { BrandLogo } from "@/components/risk-badge";

const PHASES = [
  { id: "120h", label: "120 Hours (Watch)", color: "text-blue-400" },
  { id: "72h", label: "72 Hours (Warning)", color: "text-amber-400" },
  { id: "48h", label: "48 Hours (Critical)", color: "text-orange-500" },
  { id: "24h", label: "24 Hours (Evac)", color: "text-red-500" },
  { id: "post", label: "Post-Storm Audit", color: "text-green-400" },
];

export default function HurricaneModule() {
  const router = useRouter();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  
  const [activePackage, setActivePackage] = useState<any>(null);
  const [showMarina, setShowMarina] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const [res, settingsRes] = await Promise.all([
      adminFetch("/api/admin/overview", { cache: "no-store" }, s),
      fetch("/api/admin/settings"),
    ]);
    const data = await safeJson<any>(res);
    const settings = await safeJson<any>(settingsRes);
    if (data) setSites(data.properties ?? []);
    if (settings) setCompany(settings.settings);
    
    // Mock weather for Nassau
    setWeather({
        temp: 88,
        condition: "Partly Cloudy",
        wind: "12 mph E",
        threat: "Low",
        season: "Active (June 1 - Nov 30)"
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-gold)]">Specialized Operations</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">HURRICANE PREPAREDNESS</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Storm Tracking · Readiness Countdowns · Insurance Documentation
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="bcso-panel px-4 py-3 border-[#EAB308]/30 bg-[#EAB308]/[0.05]">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#EAB308]/20 text-[#EAB308]">
                        <Wind className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="mono text-[9px] uppercase text-white/40">Season Status</div>
                        <div className="text-sm font-bold text-[#EAB308]">ACTIVE (JUNE - NOV)</div>
                    </div>
                </div>
            </div>
            <div className="bcso-panel px-4 py-3 border-[#22d3ee]/30 bg-[#22d3ee]/[0.05]">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#22d3ee]/20 text-[#22d3ee]">
                        <CloudLightning className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="mono text-[9px] uppercase text-white/40">NHC Alert Level</div>
                        <div className="text-sm font-bold text-[#22d3ee]">NO ACTIVE THREAT</div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="space-y-6">
                <div className="bcso-panel p-6">
                    <div className="mono-label mb-4">Site Readiness Overview</div>
                    <div className="space-y-3">
                        {sites.map(site => (
                            <div key={site.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    <div>
                                        <div className="font-semibold text-white/90">{site.name}</div>
                                        <div className="mono text-[10px] text-white/40 uppercase tracking-wider">{site.island} · Plan: SECURE</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {["120h", "72h", "48h", "24h"].map(p => (
                                        <div key={p} className="h-8 w-14 rounded-md border border-white/10 bg-black/40 flex items-center justify-center mono text-[9px] text-white/30">
                                            {p}
                                        </div>
                                    ))}
                                    <button onClick={() => alert("Checklist builder is scheduled for Phase 2 rollout.")} className="btn btn-ghost !px-3 !py-1.5 !text-[10px]">Open Checklist</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="bcso-panel p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="h-5 w-5 text-[#EAB308]" />
                            <div className="font-semibold">Mandatory Documentation</div>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">
                            Pre-storm photographic documentation is required for all active sites within the 48-hour window to satisfy insurance underwriter requirements.
                        </p>
                        <button onClick={() => sites.length ? setActivePackage(sites[0]) : alert("No sites active")} className="btn btn-primary mt-4 w-full !text-[11px] !py-2.5 uppercase font-bold">Generate Claims Package</button>
                    </div>
                    <div className="bcso-panel p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <Wind className="h-5 w-5 text-[var(--brand-teal-soft)]" />
                            <div className="font-semibold">Marina & Vessel Protocols</div>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">
                            Haul-out schedules and floating dock disconnections must be completed before the 72-hour Warning Phase expires.
                        </p>
                        <button onClick={() => setShowMarina(true)} className="btn btn-ghost mt-4 w-full !text-[11px] !py-2.5 uppercase font-bold">View Marina Status</button>
                    </div>
                </div>
            </section>

            <aside className="space-y-6">
                <div className="bcso-panel p-5 bg-gradient-to-b from-[#0a2340] to-black">
                    <div className="flex items-center gap-2 mb-4">
                        <CloudLightning className="h-4 w-4 text-[#22d3ee]" />
                        <div className="mono-label !text-[#22d3ee]">Live Weather (Nassau)</div>
                    </div>
                    {weather && (
                        <div className="space-y-5">
                            <div className="flex items-end justify-between">
                                <div className="font-display text-5xl text-white">{weather.temp}°</div>
                                <div className="text-right">
                                    <div className="font-bold text-white/90">{weather.condition}</div>
                                    <div className="mono text-[10px] text-white/40 uppercase tracking-widest">{weather.wind}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-white/10 rounded-lg overflow-hidden border border-white/5">
                                <div className="bg-black/30 p-3">
                                    <div className="mono text-[8px] text-white/30 uppercase mb-1">Threat Level</div>
                                    <div className="text-xs font-bold text-green-400">LOW</div>
                                </div>
                                <div className="bg-black/30 p-3">
                                    <div className="mono text-[8px] text-white/30 uppercase mb-1">Humidity</div>
                                    <div className="text-xs font-bold text-white/80">74%</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bcso-panel p-5">
                    <div className="mono-label mb-3">Countdown Protocols</div>
                    <div className="space-y-4">
                        {PHASES.map((phase, i) => (
                            <div key={phase.id} className="relative pl-6">
                                {i < PHASES.length - 1 && <div className="absolute left-[7px] top-4 bottom-[-16px] w-px bg-white/10" />}
                                <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white/20 bg-black" />
                                <div className={`font-display text-sm ${phase.color}`}>{phase.label}</div>
                                <div className="text-[11px] text-white/40 mt-1 leading-snug">
                                    {i === 0 ? "Inventory securing materials and review site plans." : 
                                     i === 1 ? "Lower crane booms and dismantle scaffolding." : 
                                     i === 2 ? "Final site walkthrough and material securing." :
                                     i === 3 ? "All personnel off-site and barricaded." : "Structural integrity and electrical testing."}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
      </div>

      {/* Claims Package Modal */}
      <AnimatePresence>
        {activePackage && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
            <div className="min-h-full p-4 md:p-10">
              <div className="mx-auto max-w-5xl mb-6 flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-[#f8c557]" />
                    <span className="mono text-[11px] uppercase tracking-widest text-white/70">Insurance Verification Preview</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="btn btn-primary !px-5"><Printer className="h-4 w-4" /> Print / Save PDF</button>
                  <button onClick={() => setActivePackage(null)} className="btn btn-ghost !p-2.5"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl shadow-2xl">
                <HurricaneClaimsPackage 
                  site={activePackage} 
                  company={company} 
                  date={new Date().toISOString()} 
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Marina Status Modal */}
      <AnimatePresence>
        {showMarina && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] shadow-2xl">
                <div className="bg-[#0a376a] px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wind className="h-6 w-6 text-[#22d3ee]" />
                    <div>
                        <h2 className="font-display text-xl tracking-wide text-white uppercase">Family Island Marina Status</h2>
                        <p className="mono text-[9px] uppercase tracking-[0.2em] text-white/50">Vessel & Dock Readiness Dashboard</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMarina(false)} className="rounded-full p-1.5 text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                        <div className="bcso-soft-panel rounded-xl p-4">
                            <div className="mono text-[9px] text-white/30 uppercase mb-3">Haul-Out Queue</div>
                            <div className="space-y-2">
                                {[
                                    { n: "Blue Marlin III", s: "Completed", c: "text-green-400" },
                                    { n: "Islander 44", s: "In Progress", c: "text-amber-400" },
                                    { n: "Salt Life V", s: "Scheduled", c: "text-white/40" }
                                ].map(v => (
                                    <div key={v.n} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                                        <span>{v.n}</span>
                                        <span className={`mono text-[9px] font-bold ${v.c}`}>{v.s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bcso-soft-panel rounded-xl p-4">
                            <div className="mono text-[9px] text-white/30 uppercase mb-3">System Isolation</div>
                            <div className="space-y-2">
                                {[
                                    { n: "Main Fuel Dock", s: "ISOLATED", c: "text-green-400" },
                                    { n: "Shore Power Grid B", s: "ACTIVE", c: "text-amber-400" },
                                    { n: "Sewage Pump-out", s: "ISOLATED", c: "text-green-400" }
                                ].map(v => (
                                    <div key={v.n} className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                                        <span>{v.n}</span>
                                        <span className={`mono text-[9px] font-bold ${v.c}`}>{v.s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bcso-panel p-4 border-[#22d3ee]/20 bg-[#22d3ee]/[0.03]">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-[#22d3ee] shrink-0 mt-0.5" />
                            <div className="text-xs text-white/70 leading-relaxed italic">
                                &ldquo;All Family Island marinas must confirm floating dock disconnection and travel lift securing within 12 hours of a Watch becoming a Warning.&rdquo;
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
                    <button onClick={() => setShowMarina(false)} className="btn btn-primary !px-8">Acknowledge Status</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FieldOpsShell>
  );
}
