"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Calendar, Globe2, Loader2, MapPin, Search, ShieldAlert, Users,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { levelOf } from "@/lib/risk";
import type { PropertyRow, InspectionRow } from "@/db/schema";

type AdminInspection = InspectionRow & {
  property: PropertyRow;
  contractor: { id: number; name: string; trade: string; island: string };
  stats: { score: number; total: number; failCount: number; photoCount: number };
};

type Overview = {
  properties: PropertyRow[];
  inspections: AdminInspection[];
};

export default function SiteManagementPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const res = await adminFetch("/api/admin/overview", { cache: "no-store" }, s);
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    
    const payload = await safeJson<any>(res);
    if (!res.ok || !payload) throw new Error(payload?.error ?? "Failed to load sites");
    setData({ properties: payload.properties ?? [], inspections: payload.inspections ?? [] });
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  const siteCards = useMemo(() => {
    if (!data) return [];
    return data.properties.map((site) => {
      const siteInspections = data.inspections.filter((i) => i.property.id === site.id);
      const latest = siteInspections[0];
      const lastScore = latest?.stats?.score ?? latest?.complianceScore ?? 0;
      const level = levelOf(lastScore || 1);
      return {
        ...site,
        inspectionCount: siteInspections.length,
        lastScore,
        level,
        latestCode: latest?.code ?? null,
      };
    });
  }, [data]);

  const filtered = siteCards.filter((s) =>
    `${s.name} ${s.address} ${s.island} ${s.clientName}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Module 1 — Site Management</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">SITE REGISTRY</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Central registry of job sites, marinas, resorts, and facilities
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]">{error}</div>
        )}

        {!data ? (
          <div className="flex h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : (
          <>
            <div className="mb-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/12 bg-[var(--brand-teal)]/12 md:grid-cols-4">
              {[
                { k: "Active Sites", v: data.properties.length, c: "#efede8", icon: Building2 },
                { k: "Total Inspections", v: data.inspections.length, c: "#7CD7E4", icon: ShieldAlert },
                { k: "Unique Islands", v: new Set(data.properties.map((p) => p.island)).size, c: "#EAB308", icon: Globe2 },
                { k: "Client Entities", v: new Set(data.properties.map((p) => p.clientName)).size, c: "#4ADE80", icon: Users },
              ].map((s) => (
                <div key={s.k} className="bg-[var(--brand-navy-deep)] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <s.icon className="h-4.5 w-4.5" style={{ color: s.c }} />
                    <div>
                      <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
                      <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" placeholder="Search sites by name, address, island or client…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((site) => (
                <div key={site.id} className="bcso-panel overflow-hidden">
                  <div className="border-b border-white/8 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold tracking-tight text-white/90">{site.name}</div>
                        <div className="mono mt-1 text-[9px] uppercase tracking-[0.14em] text-white/35">{site.propertyType} · {site.clientName}</div>
                      </div>
                      <span className="mono rounded-full border px-2.5 py-1 text-[8px] uppercase tracking-[0.14em]" style={{ color: site.level.hex, borderColor: `${site.level.hex}66`, backgroundColor: `${site.level.hex}14` }}>{site.lastScore ? `${site.lastScore}%` : "No score"}</span>
                    </div>
                  </div>
                  <div className="space-y-3 px-5 py-4 text-sm text-white/65">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--brand-teal-soft)]" />{site.address || "—"}</div>
                    <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[var(--brand-teal-soft)]" />{site.island}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[var(--brand-teal-soft)]" />Site inspections: {site.inspectionCount}</div>
                    {site.latestCode && <div className="mono text-[10px] uppercase tracking-[0.14em] text-white/35">Latest ref: {site.latestCode}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </FieldOpsShell>
  );
}
