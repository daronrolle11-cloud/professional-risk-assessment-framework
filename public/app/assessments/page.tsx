"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, getSession } from "@/lib/admin-fetch";
import { getSession as getContractorSession } from "@/lib/portal-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, FileCheck2, FilePlus2, Loader2, Pencil, RefreshCcw, Sparkles, Trash2, TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LevelBadge } from "@/components/risk-badge";
import { formatDate, levelOf } from "@/lib/risk";
import { INDUSTRIES } from "@/lib/data";
import type { AssessmentRow } from "@/db/schema";

type AssessmentListItem = AssessmentRow & { hazardCount: number; maxScore: number; residualMax: number };

const STATUS_STYLES: Record<string, string> = {
  issued: "border-[#22bf6b]/40 bg-[#22bf6b]/10 text-[#3ce38e]",
  draft: "border-white/20 bg-white/5 text-white/60",
  review: "border-[#e7c416]/40 bg-[#e7c416]/10 text-[#efd13e]",
};

export default function AssessmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssessmentListItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = getSession();
      if (!s) {
        if (getContractorSession()) { window.location.href = "/portal"; }
        else { window.location.href = "/admin/access"; }
        return;
      }
      const res = await adminFetch("/api/assessments", { cache: "no-store" }, s);
      if (res.status === 401) { window.location.href = "/admin/access"; return; }
      if (!res.ok) throw new Error("Failed to load assessments");
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function seed() {
    setSeeding(true);
    try {
      await adminFetch("/api/examples", { method: "POST" });
      await load();
    } finally {
      setSeeding(false);
    }
  }

  async function remove(id: number, no: string) {
    if (!window.confirm(`Delete assessment ${no}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminFetch(`/api/assessments/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const totals = (items ?? []).reduce(
    (acc, a) => {
      const lvl = levelOf(a.maxScore).key;
      acc[lvl] = (acc[lvl] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mono-label mb-2">Document Register</div>
          <h1 className="font-display text-4xl md:text-5xl">RISK ASSESSMENTS</h1>
        </div>
        <div className="flex gap-2.5">
          <button onClick={load} className="btn btn-ghost !px-4" title="Refresh">
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={seed} disabled={seeding} className="btn btn-ghost !px-4">
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{seeding ? "Loading…" : "Load examples"}</span>
          </button>
          <Link href="/admin/inspections/new" className="btn btn-ghost !px-4">+ New Inspection</Link>
          <Link href="/assessments/new" className="btn btn-primary !px-4">+ New Assessment</Link>
        </div>
      </div>

      {items && items.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-4">
          {[
            { k: "Total documents", v: items.length, c: "#efede8" },
            { k: "Extreme exposure", v: totals.extreme ?? 0, c: "#ef4444" },
            { k: "High exposure", v: (totals.high ?? 0), c: "#f97316" },
            { k: "Moderate / Low", v: (totals.moderate ?? 0) + (totals.low ?? 0), c: "#e7c416" },
          ].map((s) => (
            <div key={s.k} className="bg-[#0b0d10] px-5 py-4">
              <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
              <div className="mono mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40">{s.k}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ff8a8a]">
          <TriangleAlert className="h-4 w-4" /> {error} — the database may still be initialising; try refreshing.
        </div>
      )}

      {items === null ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-gold)]" />
        </div>
      ) : items.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Link href="/assessments/new" className="panel group flex flex-col items-start p-8 transition-colors hover:border-[var(--brand-gold)]/50">
            <FilePlus2 className="h-7 w-7 text-[var(--brand-gold)]" />
            <h3 className="font-display mt-5 text-2xl">CREATE YOUR FIRST ASSESSMENT</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
              Six guided steps — industry, document header, hazard identification, risk rating, hierarchy-of-controls
              recommendations, review &amp; issue.
            </p>
            <span className="mono mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--brand-gold)]">
              Open the wizard <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <button onClick={seed} disabled={seeding} className="panel group flex flex-col items-start p-8 text-left transition-colors hover:border-[var(--brand-gold)]/50">
            {seeding ? <Loader2 className="h-7 w-7 animate-spin text-[var(--brand-gold)]" /> : <Sparkles className="h-7 w-7 text-[var(--brand-gold)]" />}
            <h3 className="font-display mt-5 text-2xl">LOAD WORKED EXAMPLES</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
              Instantly generate two complete, professional assessments — an office workplace (damaged ceiling, electrical…)
              and a warehouse operation — to explore the document output.
            </p>
            <span className="mono mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--brand-gold)]">
              {seeding ? "Generating…" : "Generate examples"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((a, i) => {
              const industry = INDUSTRIES.find((x) => x.id === a.industry);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1013] transition-colors hover:border-white/25"
                >
                  <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: levelOf(a.maxScore).hex }} />
                  <div className="flex flex-wrap items-center gap-x-7 gap-y-3 py-4 pl-6 pr-4">
                    <div className="min-w-[130px]">
                      <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/40">{a.assessmentNo}</div>
                      <div className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-white/30">{formatDate(a.assessmentDate)}</div>
                    </div>
                    <div className="min-w-[220px] flex-1">
                      <Link href={`/assessments/${a.id}`} className="text-[15px] font-semibold tracking-tight transition-colors hover:text-[var(--brand-gold)]">
                        {a.activity}
                      </Link>
                      <div className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-white/35">
                        {a.organization} · {industry?.name ?? a.industry} · {a.hazardCount} hazard{a.hazardCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={`mono rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[0.16em] ${STATUS_STYLES[a.status] ?? STATUS_STYLES.draft}`}>
                        {a.status}
                      </span>
                      {a.maxScore > 0 && <LevelBadge score={a.maxScore} size="sm" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/assessments/${a.id}`} className="btn btn-ghost !px-3.5 !py-2">
                        <FileCheck2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Open</span>
                      </Link>
                      <Link href={`/assessments/new?edit=${a.id}`} className="btn btn-ghost !px-3.5 !py-2" title="Edit assessment">
                        <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                      </Link>
                      <button onClick={() => remove(a.id, a.assessmentNo)} disabled={busy} className="btn btn-ghost btn-danger !px-3 !py-2" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </AppShell>
  );
}
