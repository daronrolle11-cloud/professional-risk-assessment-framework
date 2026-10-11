"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Calendar, HelpCircle, Loader2, LogOut, MapPin, ShieldCheck, TriangleAlert, Wrench,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { authHeaders, getSession, setSession, type PortalSession } from "@/lib/portal-client";
import { safeJson } from "@/lib/admin-fetch";
import { tradeById } from "@/lib/operations";
import { ABOUT_BCSO } from "@/lib/data";
import type { InspectionRow, PropertyRow } from "@/db/schema";

type Assignment = InspectionRow & {
  property: PropertyRow;
  itemCount: number;
  doneCount: number;
  failCount: number;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  assigned: { label: "Assigned", cls: "border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  in_progress: { label: "In progress", cls: "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]" },
  returned: { label: "Returned — action needed", cls: "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ff8a8a]" },
  pending_review: { label: "Pending review", cls: "border-white/20 bg-white/5 text-white/60" },
  approved: { label: "Approved", cls: "border-[#22bf6b]/40 bg-[#22bf6b]/10 text-[#3ce38e]" },
};

export default function PortalPage() {
  const router = useRouter();
  const [session, setSessionState] = useState<PortalSession | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);

  const load = useCallback(async (s: PortalSession) => {
    const res = await fetch("/api/portal/inspections", { headers: authHeaders(s), cache: "no-store" });
    if (res.status === 401) {
      setSession(null);
      setSessionState(null);
      return;
    }
    setAssignments(await safeJson<any>(res) || {});
  }, []);

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    if (s) load(s);
  }, [load]);

  async function login(accessCode?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contractors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: accessCode ?? code }),
      });
      const data = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      const s: PortalSession = { contractor: data.contractor, token: data.token };
      setSession(s);
      setSessionState(s);
      load(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setSession(null);
    setSessionState(null);
    setAssignments(null);
    setCode("");
  }

  if (session === undefined) return null;

  /* ---------------- LOGIN ---------------- */
  if (!session) {
    return (
      <FieldOpsShell>
        <div className="grid-bg relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-[#22d3ee]/[0.07] blur-[110px]" />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
            <div className="mb-8 text-center">
              <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#0d5f70] shadow-2xl shadow-cyan-500/25">
                <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2.2} />
              </span>
              <h1 className="font-display text-3xl tracking-wide md:text-4xl">CONTRACTOR PORTAL</h1>
              <p className="mono mt-3 text-[10px] uppercase leading-relaxed tracking-[0.2em] text-white/40">
                Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO)
                <br />On-island trade access — Nassau · Freeport · Family Islands
              </p>
            </div>

            <div className="panel p-6">
              <label className="mono-label !text-[9.5px] mb-2 block">Access Code</label>
              <input
                className="field mono !py-3.5 text-center !text-lg uppercase tracking-[0.3em]"
                placeholder="ELC-0000"
                value={code}
                autoCapitalize="characters"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && !busy && code && login()}
                maxLength={10}
              />
              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2.5 text-xs text-[#ff8a8a]">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}
              <button onClick={() => login()} disabled={busy || !code.trim()} className="btn btn-primary mt-4 w-full !py-3.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="mt-4 text-center text-xs leading-relaxed text-white/35">
                Access codes are issued by your compliance coordinator and link you to your island and trade.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mono-label !text-[9px] mb-2.5 text-center">Demo access — tap to fill</div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  ["ELC-1024", "Rolle · Electrical · Nassau"],
                  ["PLB-2048", "Sawyer · Plumbing · Freeport"],
                  ["HVC-4096", "Bowe · HVAC · Abaco"],
                ].map(([c, d]) => (
                  <button key={c} onClick={() => { setCode(c); }} className="mono rounded-full border border-white/15 px-3 py-1.5 text-[10px] text-white/55 transition-colors hover:border-[#22d3ee]/60 hover:text-[#67e8f9]" title={d}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </FieldOpsShell>
    );
  }

  /* ------------- ASSIGNMENTS ------------- */
  const active = (assignments ?? []).filter((a) => ["assigned", "in_progress", "returned"].includes(a.status));
  const history = (assignments ?? []).filter((a) => !["assigned", "in_progress", "returned"].includes(a.status));
  const trade = tradeById(session.contractor.trade);
  const isFirstVisit = assignments !== null && active.length === 0 && history.length === 0;

  return (
    <FieldOpsShell
      right={
        <button onClick={logout} className="btn btn-ghost !px-3.5 !py-2">
          <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
        </button>
      }
    >
      <div className="mx-auto max-w-2xl px-4 py-7 md:px-8">

        {/* ── Profile header ── */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)]">
          <div className="bg-[#0a376a] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mono text-[9px] uppercase tracking-[0.2em] text-white/50">BCSO Elite Contractor Network</div>
                <h1 className="font-display mt-1 text-2xl tracking-wide md:text-3xl">{session.contractor.name.toUpperCase()}</h1>
              </div>
              <span className="mono shrink-0 rounded-lg border border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.14em] text-[var(--brand-teal-soft)]">
                {session.contractor.accessCode}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/8">
            {[
              { label: "Trade", value: trade.name },
              { label: "Island", value: session.contractor.island },
              { label: "Status", value: "Active", color: "text-[#3ce38e]" },
            ].map((item) => (
              <div key={item.label} className="px-4 py-3">
                <div className="mono text-[8.5px] uppercase tracking-[0.18em] text-white/35">{item.label}</div>
                <div className={`mt-0.5 text-sm font-semibold ${item.color || "text-white/85"}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <Link href="/admin/faq" className="btn btn-ghost !py-2.5">
            <HelpCircle className="h-4 w-4 text-[var(--brand-teal-soft)]" /> Field FAQ
          </Link>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="btn btn-ghost !py-2.5">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-gold)]" /> Welcome Kit
          </button>
        </div>

        {/* ── Welcome kit (shown on first login before assignments arrive) ── */}
        {(isFirstVisit || assignments?.length === 0) && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/[0.04]">
            <div className="border-b border-[var(--brand-gold)]/20 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[var(--brand-gold)]" />
                <div>
                  <div className="font-semibold text-white/90">Welcome to the BCSO Elite Contractor Network!</div>
                  <div className="mono mt-0.5 text-[9px] uppercase tracking-[0.16em] text-white/40">Subcontractor Activation — {session.contractor.island}</div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4 text-sm text-white/65 leading-relaxed">
              <div className="rounded-xl border border-[var(--brand-teal)]/20 bg-[var(--brand-teal)]/[0.03] p-4 italic text-[13px] text-[var(--brand-teal-soft)]">
                &ldquo;{ABOUT_BCSO}&rdquo;
              </div>
              <p>As an independent on-island partner, you are the face of safety and compliance in your district. You will receive a push notification the moment a property is assigned to you.</p>
              <div className="space-y-3">
                {[
                  { phase: "Phase 1", title: "Your compliance profile is active", body: "Your contractor file has been unlocked by Nassau administration. You can now receive paid property assignments." },
                  { phase: "Phase 2", title: "How assignments work", body: "When a property is booked on your island, it will appear below instantly. Tap the assignment to view the property address, square footage, and your inspection window." },
                  { phase: "Phase 3", title: "The photo-for-every-fail rule", body: "If you mark any item as REPAIR NEEDED, you must upload a clear, time-stamped photo documenting the issue. The system will not allow submission without it." },
                  { phase: "Phase 4", title: "Non-circumvention policy", body: "If a property owner asks you to perform repairs on the spot during an audit, politely decline: \"I am here representing BCSO to conduct an independent compliance check. BCSO will send you a remediation quote within 24 hours.\"" },
                ].map((step) => (
                  <div key={step.phase} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                    <span className="mono shrink-0 rounded-md bg-[var(--brand-teal)]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--brand-teal-soft)]">{step.phase}</span>
                    <div>
                      <div className="font-semibold text-white/80">{step.title}</div>
                      <p className="mt-1 text-[12px] text-white/50">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#22bf6b]/25 bg-[#22bf6b]/[0.05] p-3.5 text-[12px]">
                <span className="font-semibold text-[#7cebab]">You&apos;re all set.</span> Your first assignment will appear on this screen the moment Nassau dispatches it to your island. Check back here to get started.
              </div>
            </div>
          </div>
        )}

        {assignments === null ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand-teal)]" /></div>
        ) : (
          <>
            <div className="mono-label mb-3">Assignments — {active.length} active</div>
            <div className="space-y-3">
              <AnimatePresence>
                {active.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-white/35">
                    No active assignments right now. New inspections appear here the moment your coordinator assigns them.
                  </div>
                )}
                {active.map((a, i) => {
                  const meta = STATUS_META[a.status] || STATUS_META.assigned;
                  const isRI = (a as any).type === 'reinspection';
                  return (
                    <motion.button
                      key={`${(a as any).type}-${a.id}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06 }}
                      onClick={() => router.push(`/portal/inspection/${a.id}`)}
                      className={`group w-full rounded-2xl border p-5 text-left transition-all hover:border-[var(--brand-teal)]/50 ${isRI ? 'bg-[var(--brand-gold)]/[0.03] border-[var(--brand-gold)]/10' : 'bg-[#0b0f13] border-white/10'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/35">{a.code}</div>
                            {isRI && <span className="mono rounded-full bg-[var(--brand-gold)]/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--brand-gold)]">Re-Inspection</span>}
                          </div>
                          <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-white group-hover:text-[var(--brand-teal-soft)]">{a.property.name}</h3>
                          <div className="mono mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.property.island}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{a.scheduledFor || "Unscheduled"}</span>
                          </div>
                        </div>
                        <span className={`mono shrink-0 rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-white/35">
                            {a.status === "assigned" ? `${a.itemCount} items to verify` : `${a.doneCount}/${a.itemCount} verified`}
                          </span>
                          {a.failCount > 0 && <span className="mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#ff8a8a]">{a.failCount} findings</span>}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className={`h-full rounded-full transition-all ${isRI ? 'bg-[var(--brand-gold)]' : 'bg-[var(--brand-teal)]'}`} style={{ width: `${a.itemCount ? (a.doneCount / a.itemCount) * 100 : 0}%` }} />
                        </div>
                      </div>
                      {a.status === "returned" && a.adminNote && (
                        <div className="mt-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.07] px-3 py-2 text-xs leading-relaxed text-[#ffb3b3]">
                          <span className="mono mr-2 text-[9px] font-bold uppercase tracking-wider">Coordinator:</span>{a.adminNote}
                        </div>
                      )}
                      <div className={`mono mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] ${isRI ? 'text-[var(--brand-gold)]' : 'text-[var(--brand-teal-soft)]'}`}>
                        {a.status === "assigned" ? "Tap to start" : a.status === "returned" ? "Review & resubmit" : "Continue inspection"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {history.length > 0 && (
              <>
                <div className="mono-label mb-3 mt-9">Submitted &amp; history</div>
                <div className="space-y-2.5">
                  {history.map((a) => {
                    const meta = STATUS_META[a.status];
                    return (
                      <Link
                        key={a.id}
                        href={`/portal/inspection/${a.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/20"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white/80">{a.property.name}</div>
                          <div className="mono mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/35">
                            {a.code} · {tradeById(a.trade).name}{a.complianceScore != null ? ` · score ${a.complianceScore}` : ""}
                          </div>
                        </div>
                        <span className={`mono shrink-0 rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${meta.cls}`}>{meta.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
        {/* ── Permanent Welcome Kit / Guidelines at bottom ── */}
        {!isFirstVisit && assignments?.length !== 0 && (
          <div className="mt-12 opacity-60 transition-opacity hover:opacity-100">
            <div className="mono-label mb-4 text-center">Subcontractor Guidelines & Onboarding</div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="px-5 py-4 space-y-4 text-[13px] text-white/50 leading-relaxed">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { t: "Photo Rule", b: "If you mark REPAIR NEEDED, you MUST upload a time-stamped photo. Submission is locked otherwise." },
                    { t: "Non-Circumvention", b: "Do not perform repairs on-site. Refer clients to BCSO for a separate remediation quote." },
                    { t: "Identification", b: "Always wear your digital BCSO ID and trade safety gear (steel-toed boots, vest) on-site." },
                    { t: "Syncing", b: "Your work saves locally. If signal is weak, complete the audit and sync once you reach Wi-Fi." },
                  ].map((item) => (
                    <div key={item.t} className="rounded-xl border border-white/5 bg-white/[0.01] p-3">
                      <div className="font-semibold text-white/70 mb-1">{item.t}</div>
                      <div>{item.b}</div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-[11px] italic">Full activation checklist and safety standards available in the Field Technician FAQ.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </FieldOpsShell>
  );
}
