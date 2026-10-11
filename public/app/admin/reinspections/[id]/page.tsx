"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BadgeCheck, Camera, Check, Clock3, CreditCard, Download, Loader2, Mail, Printer,
  TriangleAlert, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { ComplianceCertificate } from "@/components/compliance-certificate";
import type {
  ReInspectionRow, ReInspectionItemRow, PropertyRow, ContractorRow, CompanySettingsRow,
} from "@/db/schema";
import type { StaffClientUser } from "@/lib/staff-client";

type Detail = {
  reInspection: ReInspectionRow;
  originalProperty: PropertyRow;
  originalContractor: ContractorRow;
  originalInspection: { id: number; code: string; trade: string; complianceScore: number | null };
  items: ReInspectionItemRow[];
  allPassed: boolean;
  company?: CompanySettingsRow;
  staff: StaffClientUser;
};

const SEV_META: Record<string, string> = {
  critical: "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ff8a8a]",
  major: "border-[#f97316]/50 bg-[#f97316]/10 text-[#ffb37a]",
  minor: "border-white/15 bg-white/5 text-white/50",
};

export default function ReInspectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [managingDirector, setManagingDirector] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const res = await adminFetch(`/api/admin/reinspections/${params.id}`, { cache: "no-store" }, s);
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    if (res.status === 404) { setError("Re-inspection not found."); return; }
    const data = await safeJson<Detail>(res);
    if (data) {
      setDetail(data);
      setManagingDirector(data.reInspection.managingDirector || data.company?.managingDirector || "");
      setAdminNotes(data.reInspection.adminNotes || "");
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function patchItems(items: { id: number; status: "pass" | "fail"; note: string }[]) {
    if (!detail) return;
    const res = await adminFetch(`/api/admin/reinspections/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      // optimistic update
      setDetail((d) => {
        if (!d) return d;
        return { ...d, items: d.items.map((it) => { const patch = items.find((p) => p.id === it.id); return patch ? { ...it, ...patch } : it; }) };
      });
    }
  }

  async function issueCertificate() {
    if (!detail) return;
    if (!window.confirm("Issue the Compliance Certificate? This action cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/reinspections/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "issueCertificate", managingDirector, adminNotes }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Failed to issue certificate");
      setSuccess("Certificate issued successfully.");
      setShowCert(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return (
      <FieldOpsShell>
        <div className="flex h-[60vh] items-center justify-center">
          {error ? <div className="flex items-center gap-3 text-[#ff8a8a]"><TriangleAlert className="h-5 w-5" />{error}</div> : <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" />}
        </div>
      </FieldOpsShell>
    );
  }

  const { reInspection: ri, originalProperty, originalContractor, items, allPassed, company } = detail;
  const issued = ri.status === "passed";
  const canIssue = allPassed && !issued && ["admin", "finalizer"].includes(detail.staff.role);

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin/reinspections")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Re-Inspections
        </button>

        {success && <div className="mb-5 flex items-center justify-between rounded-xl border border-[#22bf6b]/40 bg-[#22bf6b]/10 px-4 py-3 text-sm text-[#7cebab]"><span>{success}</span><button onClick={() => setSuccess(null)}><X className="h-4 w-4" /></button></div>}
        {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ff8a8a]"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}

        {/* Header */}
        <div className="mb-6 rounded-2xl border border-[var(--brand-teal)]/15 bg-[var(--brand-navy-deep)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mono mb-1 text-[10px] uppercase tracking-[0.16em] text-white/35">{ri.certRef}</div>
              <h1 className="font-display text-2xl tracking-wide md:text-3xl">POST-REMEDIATION RE-INSPECTION</h1>
              <div className="mono mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
                <span>{originalProperty.name} · {originalProperty.island}</span>
                <span>Contractor: {originalContractor.name}</span>
                <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Scheduled: {ri.scheduledFor || "—"}</span>
              </div>
              <div className="mono mt-1.5 text-[10px] uppercase tracking-[0.14em]">
                Fee: <span className={ri.feeCharged === 0 ? "text-[#3ce38e]" : "text-[var(--brand-gold)]"}>
                  {ri.feeCharged === 0 ? "FREE — BCSO network repairs" : `$${ri.feeCharged} BSD — outside contractor`}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`mono rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.14em] ${issued ? "border-[#22bf6b]/40 bg-[#22bf6b]/10 text-[#3ce38e]" : allPassed ? "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]" : "border-[var(--brand-teal)]/30 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]"}`}>
                {issued ? "Certificate Issued" : allPassed ? "All items passed — ready to certify" : "In progress"}
              </span>
              {issued && (
                <button onClick={() => setShowCert(true)} className="btn btn-primary !py-2">
                  <BadgeCheck className="h-4 w-4" /> View Certificate
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Checklist */}
          <div className="space-y-3">
            <div className="mono-label !text-[var(--brand-teal-soft)]">Re-Inspection Items — failed items from original audit</div>
            {items.map((item) => {
              const sev = SEV_META[item.severity] ?? SEV_META.major;
              return (
                <div key={item.id} className={`rounded-xl border p-4 transition-colors ${item.status === "pass" ? "border-[#22bf6b]/30 bg-[#22bf6b]/[0.04]" : item.status === "fail" ? "border-[#ef4444]/30 bg-[#ef4444]/[0.04]" : "border-white/10 bg-[var(--brand-navy-deep)]"}`}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        <span className={`mono rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] ${sev}`}>{item.severity}</span>
                      </div>
                      <p className="text-sm leading-snug text-white/90">{item.label}</p>
                      <p className="mono mt-1 text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[var(--brand-teal-soft)]/70">{item.requirement}</p>
                      {item.note && <div className="mt-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">{item.note}</div>}
                    </div>
                    {/* Pass/Fail controls */}
                    {!issued && (
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button onClick={() => patchItems([{ id: item.id, status: "pass", note: item.note }])} className={`mono rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${item.status === "pass" ? "border-[#22bf6b] bg-[#22bf6b]/15 text-[#3ce38e]" : "border-white/15 text-white/45 hover:border-[#22bf6b]/50 hover:text-[#3ce38e]"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => patchItems([{ id: item.id, status: "fail", note: item.note }])} className={`mono rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${item.status === "fail" ? "border-[#ef4444] bg-[#ef4444]/15 text-[#ff8a8a]" : "border-white/15 text-white/45 hover:border-[#ef4444]/50 hover:text-[#ff8a8a]"}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {issued && (
                      <div className={`mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${item.status === "pass" ? "border-[#22bf6b] bg-[#22bf6b]/20 text-[#3ce38e]" : "border-[#ef4444] bg-[#ef4444]/20 text-[#ff8a8a]"}`}>
                        {item.status === "pass" ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
                      </div>
                    )}
                  </div>
                  {item.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {item.photos.map((p) => (
                        <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.dataUrl} alt={p.caption} className="aspect-[3/2] w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right — certificate issuance panel */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="bcso-panel p-5">
              <div className="mono-label mb-4 !text-[var(--brand-gold-soft)]">Certificate Issuance</div>

              <div className="space-y-3">
                <div>
                  <div className="mono-label !text-[9px] mb-1">Managing Director (signed on certificate)</div>
                  <input className="field" value={managingDirector} onChange={(e) => setManagingDirector(e.target.value)} disabled={issued} placeholder="Full name and title" />
                </div>
                <div>
                  <div className="mono-label !text-[9px] mb-1">Admin notes (internal only)</div>
                  <textarea className="field !min-h-[70px]" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} disabled={issued} />
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="space-y-1.5 text-xs text-white/50">
                  {items.map((item) => (
                    <div key={item.id} className={`flex items-center gap-2 ${item.status === "pass" ? "text-[#3ce38e]" : item.status === "fail" ? "text-[#ff8a8a]" : "text-white/35"}`}>
                      <Check className={`h-3.5 w-3.5 shrink-0 ${item.status !== "pass" ? "opacity-20" : ""}`} strokeWidth={3} />
                      <span className="truncate">{item.label.slice(0, 60)}…</span>
                    </div>
                  ))}
                </div>

                {canIssue && (
                  <button onClick={issueCertificate} disabled={busy} className="btn w-full !py-3.5 !bg-[var(--brand-gold)] !text-[var(--brand-navy)] bcso-gold-ring">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BadgeCheck className="h-4 w-4" /> Issue Compliance Certificate</>}
                  </button>
                )}

                {issued && (
                  <>
                    <button onClick={() => setShowCert(true)} className="btn btn-primary w-full !py-3">
                      <BadgeCheck className="h-4 w-4" /> View &amp; Print Certificate
                    </button>
                    <button 
                      onClick={async () => {
                        const amount = window.prompt("Invoice amount (BSD) for Re-Inspection?", ri.feeCharged === 0 ? "0" : "250");
                        if (amount === null) return;
                        const res = await adminFetch("/api/admin/invoices", {
                          method: "POST",
                          body: JSON.stringify({ propertyId: originalProperty.id, amount: Number(amount) }),
                        });
                        if (res.ok) {
                          alert("Invoice created successfully.");
                          router.push("/admin/invoices");
                        }
                      }}
                      className="btn btn-ghost w-full !py-3 hover:!text-[var(--brand-gold)]"
                    >
                      <CreditCard className="h-4 w-4" /> Generate Invoice
                    </button>
                    <button onClick={() => window.print()} className="btn btn-ghost w-full !py-3">
                      <Printer className="h-4 w-4" /> Print this page
                    </button>
                  </>
                )}

                {!allPassed && !issued && (
                  <div className="rounded-xl border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/[0.06] p-3 text-xs text-white/60">
                    All re-inspection items must be marked <strong className="text-white/90">PASS</strong> before the certificate can be issued.
                  </div>
                )}
              </div>
            </div>

            {/* Property & fee summary */}
            <div className="bcso-panel p-5 text-sm">
              <div className="mono-label mb-3">Property &amp; fee</div>
              <div className="space-y-1.5 text-white/70">
                <div><span className="text-white/40">Property:</span> {originalProperty.name}</div>
                <div><span className="text-white/40">Client:</span> {originalProperty.clientName}</div>
                <div><span className="text-white/40">Email:</span> {originalProperty.clientEmail || "—"}</div>
                <div><span className="text-white/40">Island:</span> {originalProperty.island}</div>
                <div><span className="text-white/40">Repairs by:</span> {ri.remediationBy === "bcso" ? "BCSO subcontractor network" : "Outside contractor"}</div>
                <div className="pt-1.5 border-t border-white/10">
                  <span className="text-white/40">Fee:</span>{" "}
                  <span className={ri.feeCharged === 0 ? "text-[#3ce38e] font-semibold" : "text-[var(--brand-gold)] font-semibold"}>
                    {ri.feeCharged === 0 ? "$0 BSD (FREE — BCSO network)" : "$250 BSD"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate modal */}
      <AnimatePresence>
        {showCert && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md">
            <div className="min-h-full p-4 md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-white/50">{ri.certRef}</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="btn btn-ghost !px-3.5 !py-2"><Printer className="h-3.5 w-3.5" /> Print / PDF</button>
                  <button onClick={() => setShowCert(false)} className="btn btn-ghost !px-3.5 !py-2"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
                <ComplianceCertificate
                  reInspection={ri}
                  property={originalProperty}
                  contractor={originalContractor}
                  items={items}
                  company={company}
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </FieldOpsShell>
  );
}
