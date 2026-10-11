"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BadgeCheck, Check, Clock3, CreditCard, Download, Eye, FileText, Loader2, Mail, MapPin, 
  Printer, RefreshCcw, Search, Send, TriangleAlert, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { tradeById, verdictFor } from "@/lib/operations";
import { formatDate } from "@/lib/risk";
import type { InspectionRow, PropertyRow, ContractorRow, ChecklistItemRow } from "@/db/schema";

type ReportItem = InspectionRow & {
  property: PropertyRow;
  contractor: ContractorRow;
  stats: { score: number; passCount: number; failCount: number; naCount: number; criticalFails: number; total: number; photoCount: number };
  docType: 'inspection' | 'incident';
};

export default function FinalReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const [res, incRes] = await Promise.all([
      adminFetch("/api/admin/overview", { cache: "no-store" }, s),
      adminFetch("/api/admin/incidents", { cache: "no-store" }, s),
    ]);
    
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    
    const data = await safeJson<any>(res);
    const incData = await safeJson<any[]>(incRes);
    
    if (!res.ok || !data) throw new Error(data?.error ?? "Failed to load reports");
    
    // Filter for finalized or sent inspections
    const finalInspections = (data.inspections ?? []).filter((i: any) => 
      i.reviewStage === "finalized" || i.reviewStage === "sent" || i.status === "approved"
    ).map((i: any) => ({ ...i, docType: 'inspection' }));

    // Filter for closed incidents
    const finalIncidents = (incData ?? []).filter(i => i.status === "closed").map(i => ({
        id: i.id,
        code: i.incidentNo,
        reportNo: i.incidentNo,
        status: i.status,
        propertyId: i.siteId,
        property: i.site,
        trade: 'Incident Investigation',
        stats: { score: 100, passCount: 0, failCount: 0, naCount: 0, criticalFails: 0, total: 0, photoCount: i.photos?.length || 0 },
        reviewStage: 'finalized',
        approvedAt: i.signedAt,
        updatedAt: i.signedAt,
        docType: 'incident'
    }));

    setReports([...finalInspections, ...finalIncidents].sort((a, b) => 
        new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    ));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  const filtered = (reports ?? []).filter((r) => 
    r.property.name.toLowerCase().includes(query.toLowerCase()) ||
    r.reportNo?.toLowerCase().includes(query.toLowerCase()) ||
    r.code.toLowerCase().includes(query.toLowerCase())
  );

  async function sendEmail(report: ReportItem) {
    const recipientEmail = window.prompt("Recipient email", report.property.clientEmail) ?? report.property.clientEmail;
    if (!recipientEmail) return;
    
    setBusy(report.id);
    try {
      const res = await adminFetch(`/api/admin/inspections/${report.id}/send`, {
        method: "POST",
        body: JSON.stringify({ recipientEmail }),
      });
      const data = await safeJson<any>(res);
      if (res.ok) {
        alert("Report queued for delivery.");
        await load();
      } else {
        throw new Error(data?.error ?? "Send failed");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setBusy(null);
    }
  }

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <button onClick={() => router.push("/admin")} className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
            </button>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Operations Archive</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">FINAL REPORTS</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Approved compliance documentation · Print &amp; Digital Release
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => load()} className="btn btn-ghost !px-4"><RefreshCcw className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />
          <input 
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" 
            placeholder="Search by property, report number or code…" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          {query && <button onClick={() => setQuery("")}><X className="h-4 w-4 text-white/35" /></button>}
        </div>

        {reports === null ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-white/25" />
            <div className="text-lg font-semibold text-white/60">No reports found</div>
            <p className="mt-2 text-sm text-white/35">Finalized reports appear here once they are approved in the Admin Hub.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r, idx) => {
              const verdict = verdictFor(r.stats as any);
              const isSent = r.reviewStage === "sent" || !!r.clientNotifiedAt;
              return (
                <motion.div 
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="bcso-panel overflow-hidden border-[var(--brand-teal)]/10"
                >
                  <div className="flex flex-wrap items-stretch">
                    {/* Score column */}
                    <div className="flex w-full flex-col items-center justify-center bg-black/20 p-6 sm:w-32">
                      <div className="font-display text-4xl leading-none" style={{ color: verdict.hex }}>{r.stats.score}%</div>
                      <div className="mono mt-2 text-[8px] uppercase tracking-[0.16em]" style={{ color: verdict.hex }}>{verdict.label}</div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="mono text-[10px] font-bold text-[var(--brand-gold)]">{r.reportNo || r.code}</span>
                          {isSent && <span className="mono rounded-full border border-[#22bf6b]/40 bg-[#22bf6b]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#3ce38e]">SENT</span>}
                        </div>
                        <h3 className="mt-1 text-lg font-bold tracking-tight text-white">{r.property.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] mono uppercase text-white/40">
                          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{r.property.island}</span>
                          <span>{tradeById(r.trade).name}</span>
                          <span className="flex items-center gap-1.5"><Clock3 className="h-3 w-3" />Approved {r.approvedAt ? formatDate(r.approvedAt.toString()) : formatDate(r.updatedAt!.toString())}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex flex-wrap items-center gap-2 sm:ml-6 sm:mt-0">
                        {r.stats.score === 100 && r.docType === 'inspection' && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/30 mr-2">
                             <BadgeCheck className="h-4 w-4 text-[var(--brand-gold)]" />
                             <span className="mono text-[9px] uppercase font-bold text-[var(--brand-gold)]">Full Compliance Bundle</span>
                          </div>
                        )}
                        {r.docType === 'inspection' && (
                            <button 
                            onClick={async () => {
                                const amount = window.prompt("Invoice amount (BSD)?", "350");
                                if (!amount) return;
                                const res = await adminFetch("/api/admin/invoices", {
                                method: "POST",
                                body: JSON.stringify({ propertyId: r.propertyId, inspectionId: r.id, amount: Number(amount) }),
                                });
                                if (res.ok) {
                                alert("Invoice created successfully.");
                                router.push("/admin/invoices");
                                }
                            }}
                            className="btn btn-ghost !p-2.5 hover:!text-[var(--brand-gold)]" 
                            title="Generate Invoice"
                            >
                            <CreditCard className="h-4 w-4" />
                            </button>
                        )}
                        <Link href={`/admin/reports/${r.id}?type=${r.docType}`} className="btn btn-ghost !p-2.5" title="View Report">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => sendEmail(r)} 
                          disabled={busy === r.id}
                          className="btn btn-ghost !p-2.5 hover:!text-[var(--brand-teal-soft)] hover:!border-[var(--brand-teal)]/50" 
                          title="Email to Client"
                        >
                          {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </button>
                        <Link href={`/admin/reports/${r.id}?type=${r.docType}`} className="btn !bg-[var(--brand-gold)] !text-[var(--brand-navy)] !px-4 !py-2.5 text-[11px] font-bold bcso-gold-ring">
                          <Printer className="h-3.5 w-3.5" /> PRINT / PDF
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </FieldOpsShell>
  );
}
