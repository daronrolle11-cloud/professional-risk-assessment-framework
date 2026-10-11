"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, BadgeCheck, ChevronDown, Clock3, Loader2, MapPin, Plus, RefreshCcw,
  TriangleAlert, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import type { ReInspectionRow, PropertyRow, ContractorRow } from "@/db/schema";

type RIWithDetails = ReInspectionRow & { property: PropertyRow; contractor: ContractorRow };

type OverviewInspection = {
  id: number;
  code: string;
  trade: string;
  status: string;
  complianceScore: number | null;
  reportNo: string | null;
  property: { name: string; island: string; clientName: string };
  contractor: { id: number; name: string; trade: string; island: string };
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  assigned: { label: "Assigned", cls: "border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  in_progress: { label: "In progress", cls: "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]" },
  passed: { label: "Passed — certificate issued", cls: "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#4ADE80]" },
  failed: { label: "Failed", cls: "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#F87171]" },
};

export default function ReInspectionsPage() {
  const router = useRouter();
  const [list, setList] = useState<RIWithDetails[] | null>(null);
  const [approvedInspections, setApprovedInspections] = useState<OverviewInspection[]>([]);
  const [contractors, setContractors] = useState<{ id: number; name: string; trade: string; island: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [form, setForm] = useState({
    originalInspectionId: "",
    contractorId: "",
    remediationBy: "outside" as "bcso" | "outside",
    scheduledFor: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    managingDirector: "",
  });

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const [listRes, ovRes] = await Promise.all([
      adminFetch("/api/admin/reinspections", { cache: "no-store" }, s),
      adminFetch("/api/admin/overview", { cache: "no-store" }, s),
    ]);
    if (listRes.status === 401 || ovRes.status === 401) { window.location.href = "/admin/access"; return; }
    
    const listData = await safeJson<any>(listRes);
    const ovData = await safeJson<any>(ovRes);
    
    if (listData) setList(listData);
    if (ovData) {
      setApprovedInspections((ovData.inspections ?? []).filter((i: OverviewInspection) => i.status === "approved"));
      setContractors(ovData.contractors ?? []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createRI() {
    if (!form.originalInspectionId || !form.contractorId) return;
    setFormBusy(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/reinspections", {
        method: "POST",
        body: JSON.stringify({
          originalInspectionId: Number(form.originalInspectionId),
          contractorId: Number(form.contractorId),
          remediationBy: form.remediationBy,
          scheduledFor: form.scheduledFor,
          managingDirector: form.managingDirector,
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Failed");
      setNotice(`Re-inspection ${data.reInspection.certRef} created.`);
      setShowForm(false);
      await load();
      router.push(`/admin/reinspections/${data.reInspection.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setFormBusy(false);
    }
  }

  const active = (list ?? []).filter((r) => r.status !== "passed");
  const issued = (list ?? []).filter((r) => r.status === "passed");

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Post-Remediation</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">RE-INSPECTIONS &amp; CERTIFICATES</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Targeted re-audit of failed items · Issue Compliance Certificates
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => load()} className="btn btn-ghost !px-4"><RefreshCcw className="h-3.5 w-3.5" /></button>
            <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus className="h-4 w-4" /> New re-inspection</button>
          </div>
        </div>

        {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/[0.08] px-4 py-3 text-sm text-[var(--brand-teal-soft)]"><span>{notice}</span><button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button></div>}
        {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}

        {/* Stats */}
        {list && list.length > 0 && (
          <div className="mb-7 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/12 bg-[var(--brand-teal)]/12">
            {[
              { k: "Total re-inspections", v: list.length, c: "#efede8" },
              { k: "In progress", v: active.length, c: "#EAB308" },
              { k: "Certificates issued", v: issued.length, c: "#4ADE80" },
            ].map((s) => (
              <div key={s.k} className="bg-[var(--brand-navy-deep)] px-5 py-4">
                <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
                <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-6">
              <div className="bcso-panel p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="mono-label !text-[var(--brand-gold)]">New Post-Remediation Re-Inspection</div>
                  <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-white/50" /></button>
                </div>

                <div className="rounded-xl border border-[var(--brand-teal)]/20 bg-[var(--brand-teal)]/[0.04] p-4 mb-4 text-xs leading-relaxed text-white/60">
                  <strong className="block text-white/90 mb-1.5">How this works</strong>
                  Select an approved inspection below. Only the items that originally failed will be included in the re-inspection — the contractor does not re-audit the entire property.
                  If the client used BCSO&apos;s network for repairs, the certificate is <strong className="text-[#4ADE80]">issued free of charge</strong>. If they hired an outside contractor, a <strong className="text-[var(--brand-gold)]">$250 BSD re-inspection fee</strong> applies.
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1.5">Approved inspection to re-inspect *</div>
                    <select className="field" value={form.originalInspectionId} onChange={(e) => {
                      const insp = approvedInspections.find((i) => i.id === Number(e.target.value));
                      setForm((f) => ({ ...f, originalInspectionId: e.target.value, contractorId: insp ? String(insp.contractor.id) : f.contractorId }));
                    }}>
                      <option value="">Select approved inspection…</option>
                      {approvedInspections.map((i) => (
                        <option key={i.id} value={i.id}>{i.property.name} · {i.code} · Score {i.complianceScore ?? "—"}</option>
                      ))}
                    </select>
                    {approvedInspections.length === 0 && <p className="mt-1 text-[10px] text-white/35">No approved inspections found. Approve an inspection first.</p>}
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Re-inspection contractor *</div>
                    <select className="field" value={form.contractorId} onChange={(e) => setForm((f) => ({ ...f, contractorId: e.target.value }))}>
                      <option value="">Select contractor…</option>
                      {contractors.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.trade} · {c.island}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Scheduled date</div>
                    <input type="date" className="field" value={form.scheduledFor} onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1.5">Who performed the remediation? *</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { id: "bcso", label: "BCSO Subcontractor Network", sub: "Certificate issued FREE ($0 BSD) — BCSO network performed all repairs", color: "text-[#4ADE80]" },
                        { id: "outside", label: "Outside / Client Contractor", sub: "$250 BSD re-inspection fee applies", color: "text-[var(--brand-gold)]" },
                      ].map((opt) => (
                        <button key={opt.id} type="button" onClick={() => setForm((f) => ({ ...f, remediationBy: opt.id as "bcso" | "outside" }))} className={`rounded-xl border p-4 text-left transition-all ${form.remediationBy === opt.id ? "border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                          <div className="font-semibold text-sm">{opt.label}</div>
                          <div className={`mono mt-1 text-[10px] ${opt.color}`}>{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1.5">Managing Director (for certificate signature)</div>
                    <input className="field" placeholder="Full name and title" value={form.managingDirector} onChange={(e) => setForm((f) => ({ ...f, managingDirector: e.target.value }))} />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button onClick={createRI} disabled={formBusy || !form.originalInspectionId || !form.contractorId} className="btn btn-primary !px-6">
                    {formBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create re-inspection"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {list === null ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <BadgeCheck className="mx-auto mb-4 h-10 w-10 text-white/25" />
            <div className="text-lg font-semibold text-white/60">No re-inspections yet</div>
            <p className="mt-2 text-sm text-white/35">Create a re-inspection from any approved Compliance Shield Report to begin issuing Compliance Certificates.</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-6"><Plus className="h-4 w-4" /> Create first re-inspection</button>
          </div>
        ) : (
          <div className="space-y-4">
            {active.length > 0 && <div className="mono-label mb-2 !text-[var(--brand-gold)]">Active — {active.length}</div>}
            {active.map((r) => <RICard key={r.id} ri={r} onClick={() => router.push(`/admin/reinspections/${r.id}`)} />)}
            {issued.length > 0 && <><div className="mono-label mb-2 mt-7 !text-[#4ADE80]">Certificates Issued — {issued.length}</div>{issued.map((r) => <RICard key={r.id} ri={r} onClick={() => router.push(`/admin/reinspections/${r.id}`)} />)}</>}
          </div>
        )}
      </div>
    </FieldOpsShell>
  );
}

function RICard({ ri, onClick }: { ri: RIWithDetails; onClick: () => void }) {
  const meta = STATUS_META[ri.status] ?? STATUS_META.assigned;
  return (
    <motion.button layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} className="group w-full rounded-2xl border border-[var(--brand-teal)]/12 bg-[var(--brand-navy-deep)] p-5 text-left transition-all hover:border-[var(--brand-teal)]/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/35">{ri.certRef}</div>
          <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight transition-colors group-hover:text-[var(--brand-teal-soft)]">{ri.property.name}</h3>
          <div className="mono mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ri.property.island}</span>
            <span>Contractor: {ri.contractor.name}</span>
            {ri.scheduledFor && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{ri.scheduledFor}</span>}
            <span className={ri.feeCharged === 0 ? "text-[#4ADE80]" : "text-[var(--brand-gold)]"}>
              {ri.feeCharged === 0 ? "FREE" : `$${ri.feeCharged} BSD`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`mono rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${meta.cls}`}>{meta.label}</span>
          {ri.status === "passed" ? <BadgeCheck className="h-5 w-5 text-[#22C55E]" /> : <ArrowRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-1" />}
        </div>
      </div>
    </motion.button>
  );
}
