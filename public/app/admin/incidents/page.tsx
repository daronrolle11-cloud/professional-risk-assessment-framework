"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Calendar, FileWarning, Loader2, MapPin, Plus, Search, UserRound, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/risk";

const CLASS_META: Record<string, string> = {
  "Near-Miss": "border-white/25 bg-white/5 text-white/70",
  "First Aid Only": "border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]",
  "Medical Treatment": "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]",
  "Lost Time Injury": "border-[#f97316]/40 bg-[#f97316]/10 text-[#ffb37a]",
  "Fatality": "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#F87171]",
  "Property Damage Only": "border-white/20 bg-white/5 text-white/60",
};

const CLASSES = [
  "Near-Miss",
  "First Aid Only",
  "Medical Treatment",
  "Restricted Duty / Job Transfer",
  "Lost Time Injury",
  "Hospitalization",
  "Amputation",
  "Fatality",
  "Property Damage Only",
  "Environmental Release",
  "Fire / Explosion",
];

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[] | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    siteId: "",
    classification: "Near-Miss",
    date: new Date().toISOString().slice(0, 16),
    location: "",
    description: "",
    rootCause: "",
    status: "open",
    reportedBy: "",
  });

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const [res, ovRes] = await Promise.all([
      adminFetch("/api/admin/incidents", { cache: "no-store" }, s),
      adminFetch("/api/admin/overview", { cache: "no-store" }, s),
    ]);
    if (res.status === 401 || ovRes.status === 401) { window.location.href = "/admin/access"; return; }
    const list = await safeJson<any>(res) || {};
    const ov = await safeJson<any>(ovRes) || {};
    setIncidents(list);
    setSites(ov.properties ?? []);
  }, []);

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load")); }, [load]);

  const filtered = useMemo(() => (incidents ?? []).filter((i) =>
    `${i.incidentNo} ${i.site?.name ?? ""} ${i.classification} ${i.location} ${i.description}`.toLowerCase().includes(query.toLowerCase())
  ), [incidents, query]);

  async function submit() {
    if (!form.siteId || !form.location.trim() || !form.description.trim()) {
      setError("Site, location and description are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/incidents", {
        method: "POST",
        body: JSON.stringify({
          siteId: Number(form.siteId),
          classification: form.classification,
          date: form.date,
          location: form.location,
          description: form.description,
          rootCause: form.rootCause,
          status: form.status,
          reportedBy: form.reportedBy,
        }),
      });
      const data = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(data.error ?? "Failed to create incident.");
      setShowForm(false);
      setForm({ siteId: "", classification: "Near-Miss", date: new Date().toISOString().slice(0, 16), location: "", description: "", rootCause: "", status: "open", reportedBy: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Module 5 — Incident Reporting & Investigation</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">INCIDENTS</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">Near-misses · Injuries · Property damage · Root cause tracking</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> New Incident</button>
        </div>

        {error && <div className="mb-5 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]">{error}</div>}

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" placeholder="Search incidents…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <AnimatePresence>
          {showForm && (
            <div className="mb-6">
              <div className="bcso-panel p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="mono-label !text-[var(--brand-gold)]">Create Incident Report</div>
                  <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-white/50" /></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mono-label !text-[9px] mb-1">Site *</div>
                    <select className="field" value={form.siteId} onChange={(e) => setForm((f) => ({ ...f, siteId: e.target.value }))}>
                      <option value="">Select site…</option>
                      {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.island}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1">Classification *</div>
                    <select className="field" value={form.classification} onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))}>
                      {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1">Date / Time *</div>
                    <input type="datetime-local" className="field" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1">Location on Site *</div>
                    <input className="field" placeholder="e.g. East scaffold platform" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1">Incident Description *</div>
                    <textarea className="field !min-h-[90px]" placeholder="Narrative of what happened…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1">Root Cause Narrative</div>
                    <textarea className="field !min-h-[70px]" placeholder="Immediate and contributing causes…" value={form.rootCause} onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
                  <button onClick={submit} disabled={busy} className="btn btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Incident"}</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {incidents === null ? (
          <div className="flex h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <FileWarning className="mx-auto mb-4 h-10 w-10 text-white/25" />
            <div className="text-lg font-semibold text-white/60">No incidents logged</div>
            <p className="mt-2 text-sm text-white/35">Capture every near-miss, injury, or property-damage event here for investigation and trend tracking.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((incident: any) => {
              const meta = CLASS_META[incident.classification] ?? CLASS_META["Near-Miss"];
              return (
                <div key={incident.id} className="bcso-panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="mono text-[10px] font-bold text-[var(--brand-gold)]">{incident.incidentNo}</div>
                        <span className={`mono rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] ${meta}`}>{incident.classification}</span>
                      </div>
                      <Link href={`/admin/incidents/${incident.id}`} className="mt-1 block font-semibold text-white/90 hover:text-[var(--brand-teal-soft)] transition-colors">{incident.site?.name}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] mono uppercase text-white/40">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{incident.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(new Date(incident.date).toISOString().slice(0, 10))}</span>
                        <span className="flex items-center gap-1"><UserRound className="h-3 w-3" />{incident.reportedBy}</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-2">{incident.description}</p>
                      {incident.rootCause && <div className="mt-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-white/55"><strong className="text-white/70">Root Cause:</strong> {incident.rootCause}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="mono text-[9px] uppercase tracking-[0.14em] text-white/35">{incident.status}</div>
                        <Link href={`/admin/incidents/${incident.id}`} className="btn btn-ghost !p-2">
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FieldOpsShell>
  );
}
