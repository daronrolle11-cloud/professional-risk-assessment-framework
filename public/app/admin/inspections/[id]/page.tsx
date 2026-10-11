"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, Camera, Check, Clock3, Crosshair, FileText, Loader2,
  MapPin, RotateCcw, ShieldCheck, TriangleAlert, UserRound, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { computeComplianceScore, tradeById, verdictFor } from "@/lib/operations";
import { canFinalize, canReview, type StaffClientUser } from "@/lib/staff-client";
import { formatDate } from "@/lib/risk";
import { SignaturePad } from "@/components/signature-pad";
import type { ChecklistItemRow, ContractorRow, InspectionRow, PropertyRow, ReportDeliveryRow } from "@/db/schema";

type Detail = {
  staff: StaffClientUser;
  inspection: InspectionRow;
  property: PropertyRow;
  contractor: ContractorRow;
  items: ChecklistItemRow[];
  result: ReturnType<typeof computeComplianceScore>;
  audit: {
    reviewedBy: StaffClientUser | null;
    finalizedBy: StaffClientUser | null;
    sentBy: StaffClientUser | null;
    deliveries: ReportDeliveryRow[];
  };
};

const SEV_META: Record<string, string> = {
  critical: "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ff8a8a]",
  major: "border-[#f97316]/50 bg-[#f97316]/10 text-[#ffb37a]",
  minor: "border-white/15 bg-white/5 text-white/50",
};

const RESULT_META: Record<string, string> = {
  pass: "border-[#22bf6b]/50 bg-[#22bf6b]/10 text-[#3ce38e]",
  fail: "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ff8a8a]",
  na: "border-white/20 bg-white/5 text-white/50",
};

const STAGE_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/[0.13] text-[var(--brand-gold-soft)]" },
  reviewed: { label: "Reviewed — awaiting finalizer", cls: "border-[var(--brand-teal)]/45 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  finalized: { label: "Finalized — ready to send", cls: "border-[#22bf6b]/40 bg-[#22bf6b]/10 text-[#7cebab]" },
  sent: { label: "Sent to client", cls: "border-[#22bf6b]/50 bg-[#22bf6b]/15 text-[#3ce38e]" },
};

export default function AdminInspectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const res = await adminFetch(`/api/admin/inspections/${params.id}`, { cache: "no-store" }, s);
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    if (res.status === 404) { setNotFound(true); return; }
    const data = await safeJson<Detail>(res);
    if (data) {
      setDetail(data);
      setAdminNote(data.inspection.adminNote ?? "");
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function act(action: "review" | "return" | "finalize") {
    if (action === "finalize") {
      setShowSignature(true);
      return;
    }

    let finalNote = adminNote;
    if (action === "return") {
      const autoMessage = [
        `Dear ${detail?.contractor.name},`,
        ``,
        `Your submission for ${detail?.property.name} (${detail?.inspection.code}) has been reviewed by the BCSO Compliance Board.`,
        ``,
        `Action Required: Several points require additional clarification or evidence before this report can be finalized for the client.`,
        ``,
        `Specific Instructions:`,
        adminNote || "(See individual line item comments below)",
        ``,
        `Please update the affected nodes, upload the requested evidence, and resubmit for final verification.`,
        ``,
        `Regards,`,
        `Compliance Board`,
        `Bahamas Compliance & Safety Oversight Ltd. (BCSO)`
      ].join("\n");
      
      if (!window.confirm("An automated return message will be sent to the contractor. Continue?")) return;
      finalNote = autoMessage;
    }
    
    setBusy(action);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch(`/api/admin/inspections/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, adminNote: finalNote }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Action failed");
      setSuccess(
        action === "review" ? "Review completed — report now awaits finalizer release." :
        "Report returned to the contractor for correction."
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function finalizeWithSignature(signatureData: string) {
    setBusy("finalize");
    setShowSignature(false);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminFetch(`/api/admin/inspections/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "finalize", signatureData, adminNote }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Finalization failed");
      setSuccess("Report finalized and signed. Invoice generated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Finalization failed");
    } finally {
      setBusy(null);
    }
  }

  if (notFound) {
    return (
      <FieldOpsShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <TriangleAlert className="h-6 w-6 text-[var(--brand-gold)]" />
          <p className="text-sm text-white/50">Inspection not found.</p>
          <Link href="/admin" className="btn btn-ghost mt-2">Back to hub</Link>
        </div>
      </FieldOpsShell>
    );
  }

  if (!detail) {
    return (
      <FieldOpsShell>
        <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
      </FieldOpsShell>
    );
  }

  const { staff, inspection, property, contractor, items, result, audit } = detail;
  const verdict = verdictFor(result);
  const stage = STAGE_META[inspection.reviewStage] ?? STAGE_META.pending;
  const failedItems = items.filter((i) => i.status === "fail");
  const allPhotos = items.flatMap((i) => i.photos.map((p) => ({ ...p, itemLabel: i.label })));
  const canDoReview = canReview(staff.role) && inspection.status === "pending_review" && inspection.reviewStage === "pending";
  const canDoFinalize = canFinalize(staff.role) && (inspection.reviewStage === "reviewed" || inspection.reviewStage === "finalized" || inspection.reviewStage === "sent");

  return (
    <FieldOpsShell
      right={
        <div className="hidden text-right md:block">
          <div className="mono text-[9px] uppercase tracking-[0.16em] text-white/35">Signed in</div>
          <div className="text-sm font-medium">{staff.name}</div>
          <div className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--brand-teal-soft)]">{staff.role}</div>
        </div>
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Administrative Hub
        </button>

        {success && <div className="mb-6 rounded-xl border border-[#22bf6b]/40 bg-[#22bf6b]/10 px-4 py-3 text-sm text-[#7cebab]">{success}</div>}
        {error && <div className="mb-6 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ff8a8a]">{error}</div>}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--brand-teal)]/15 bg-[var(--brand-navy-deep)]/85 p-5">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/35">{inspection.code} · {tradeById(inspection.trade).name}</div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">{property.name}</h1>
            <div className="mono mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
              <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-[var(--brand-teal)]" />{property.address || property.island}</span>
              <span>{property.propertyType}{property.squareFeet ? ` · ${property.squareFeet.toLocaleString()} sq ft` : ""}{property.yearBuilt ? ` · built ${property.yearBuilt}` : ""}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-5xl leading-none" style={{ color: verdict.hex }}>{result.score}</div>
            <div className="mono mt-1.5 text-[9px] uppercase tracking-[0.16em]" style={{ color: verdict.hex }}>{verdict.label}</div>
            <div className={`mono mt-2 inline-flex rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${stage.cls}`}>{stage.label}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="bcso-panel p-5">
              <p className="text-xs leading-relaxed text-white/45">{verdict.note}</p>
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
                {[
                  { v: result.passCount, k: "Passed", c: "#3ce38e" },
                  { v: result.failCount, k: "Failed", c: "#ff8a8a" },
                  { v: result.naCount, k: "N/A", c: "#efede8" },
                  { v: allPhotos.length, k: "Evidence photos", c: "#7CD7E4" },
                ].map((s) => (
                  <div key={s.k} className="bg-[var(--brand-navy-deep)] px-3 py-3 text-center">
                    <div className="font-display text-xl" style={{ color: s.c }}>{s.v}</div>
                    <div className="mono mt-0.5 text-[8px] uppercase tracking-[0.14em] text-white/35">{s.k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-white/70"><UserRound className="h-4 w-4 text-[var(--brand-teal-soft)]" />{contractor.name}</span>
                <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-white/40">{tradeById(contractor.trade).name} · {contractor.island}</span>
                <span className="mono flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.14em] text-white/40"><Clock3 className="h-3 w-3" /> Submitted {inspection.submittedAt ? new Date(inspection.submittedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
              </div>
            </div>

            <div className="bcso-panel p-5">
              <div className="mono-label mb-4">Checklist &amp; Statutory Cross-Reference</div>
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const sev = SEV_META[item.severity] ?? SEV_META.major;
                  const res = RESULT_META[item.status] ?? "";
                  return (
                    <div key={item.id} className={`rounded-xl border p-4 ${item.status === "fail" ? "border-[#ef4444]/30 bg-[#ef4444]/[0.04]" : "border-white/8 bg-white/[0.02]"}`}>
                      <div className="flex items-start gap-3">
                        <span className="font-display w-6 shrink-0 pt-0.5 text-white/20">{String(idx + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug text-white/90">{item.label}</p>
                          <p className="mono mt-1.5 text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[var(--brand-teal-soft)]/70">{item.requirement}</p>
                          {item.note && <div className="mt-2.5 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] leading-relaxed text-white/75"><span className="mono mr-2 text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#ef4444]">State Repair:</span>{item.note}</div>}
                          {item.photos.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {item.photos.map((p) => (
                                <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border border-white/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.dataUrl} alt={p.caption} className="aspect-[3/2] w-full object-cover transition-transform group-hover:scale-[1.03]" />
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-6">
                                    <div className="mono flex items-center gap-1 text-[8px] uppercase tracking-wider text-white/85"><Clock3 className="h-2.5 w-2.5" />{new Date(p.takenAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                                    <div className="mono flex items-center gap-1 text-[8px] uppercase tracking-wider text-[var(--brand-teal-soft)]"><Crosshair className="h-2.5 w-2.5" />{p.lat != null && p.lng != null ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "No GPS fix"}</div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className={`mono rounded-full border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em] ${res}`}>
                            {item.status === "fail" ? "REPAIR NEEDED" : item.status === "na" ? "N/A" : item.status}
                          </span>
                          <span className={`mono rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] ${sev}`}>{item.severity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="bcso-panel p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 text-[var(--brand-gold-soft)]" />
                <span className="mono-label !text-[var(--brand-gold-soft)]">Review, Finalize &amp; Release</span>
              </div>
              <ul className="mb-4 space-y-2 text-xs leading-relaxed text-white/50">
                <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3ce38e]" /> Checklist coverage verified — {result.passCount + result.failCount + result.naCount}/{items.length} items answered.</li>
                <li className={`flex gap-2 ${failedItems.some((i) => i.photos.length === 0) ? "text-[#ff8a8a]" : ""}`}>{failedItems.every((i) => i.photos.length > 0) ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3ce38e]" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />} Evidence — every failed item carries time-stamped, geo-tagged photos.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3ce38e]" /> Statutory basis cross-referenced — HSW Act 2002 (Ch. 321C), DEHS, Fire Service.</li>
              </ul>

              <div className="mono-label !text-[9px] mb-1.5">Coordinator note</div>
              <textarea className="field !min-h-[90px] !text-[13px]" placeholder="Verification remarks, finalization notes, or contractor return instructions…" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />

              <div className="mt-4 space-y-2.5">
                {canDoReview && (
                  <>
                    <button onClick={() => act("review")} disabled={busy !== null} className="btn btn-primary w-full !py-3.5">{busy === "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BadgeCheck className="h-4 w-4" /> Mark as reviewed</>}</button>
                    <button onClick={() => act("return")} disabled={busy !== null} className="btn btn-ghost w-full hover:!border-[#ef4444]/60 hover:!text-[#ff8a8a]">{busy === "return" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><RotateCcw className="h-4 w-4" /> Return to contractor</>}</button>
                  </>
                )}
                {canDoFinalize && inspection.reviewStage !== "pending" && (
                  <button onClick={() => act("finalize")} disabled={busy !== null || inspection.reviewStage === "sent"} className="btn !w-full !py-3.5 !bg-[var(--brand-gold)] !text-[var(--brand-navy)] bcso-gold-ring">{busy === "finalize" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="h-4 w-4" /> Finalize report</>}</button>
                )}
                {(inspection.reviewStage === "finalized" || inspection.reviewStage === "sent") && (
                  <Link href={`/admin/reports/${inspection.id}`} className="btn btn-ghost w-full"><ArrowUpRight className="h-4 w-4" /> Open report release page</Link>
                )}
              </div>

              <div className="mt-5 space-y-2 text-xs text-white/45">
                <div><span className="text-white/65">Reviewed by:</span> {audit.reviewedBy ? `${audit.reviewedBy.name} (${audit.reviewedBy.role})` : "—"}</div>
                <div><span className="text-white/65">Finalized by:</span> {audit.finalizedBy ? `${audit.finalizedBy.name} (${audit.finalizedBy.role})` : "—"}</div>
                <div><span className="text-white/65">Sent by:</span> {audit.sentBy ? `${audit.sentBy.name} (${audit.sentBy.role})` : "—"}</div>
              </div>
            </div>

            <div className="bcso-panel p-5">
              <div className="mono-label mb-3">Client &amp; delivery log</div>
              <div className="text-sm font-medium">{property.clientName}</div>
              <div className="mono mt-1 text-[10px] text-white/40">{property.clientEmail || "No email on file"}</div>
              <div className="mt-4 space-y-2">
                {audit.deliveries.length === 0 ? (
                  <div className="text-xs text-white/35">No report deliveries have been logged yet.</div>
                ) : (
                  audit.deliveries.map((d) => (
                    <div key={d.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                      <div className="text-xs font-medium text-white/80">{d.recipientName || d.recipientEmail}</div>
                      <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.12em] text-white/35">{d.deliveryStatus} · {d.deliveryMethod} · {d.sentAt ? new Date(d.sentAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSignature && (
            <SignaturePad 
                onCancel={() => setShowSignature(false)} 
                onSave={finalizeWithSignature} 
                title="Finalizer's Approval Signature" 
            />
        )}
      </AnimatePresence>
    </FieldOpsShell>
  );
}
