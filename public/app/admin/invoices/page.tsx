"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, CreditCard, DollarSign, Download, Eye, FileText, Loader2, Mail, 
  Plus, Printer, RefreshCcw, Search, Trash2, TriangleAlert, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/risk";
import type { InvoiceRow, PropertyRow, InspectionRow } from "@/db/schema";

type InvoiceItem = InvoiceRow & {
  property: PropertyRow;
  inspection: InspectionRow | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "border-white/20 bg-white/5 text-white/50" },
  sent: { label: "Sent", cls: "border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  paid: { label: "Paid", cls: "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#3ce38e]" },
  void: { label: "Void", cls: "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#ff8a8a]" },
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const res = await adminFetch("/api/admin/invoices", { cache: "no-store" }, s);
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    const list = await safeJson<any>(res) || {};
    setInvoices(list);
  }, []);

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load")); }, [load]);

  const filtered = (invoices ?? []).filter((i) =>
    `${i.invoiceNo} ${i.property.name} ${i.status}`.toLowerCase().includes(query.toLowerCase())
  );

  async function updateStatus(id: number, status: "sent" | "paid" | "void") {
    setBusy(id);
    try {
      const res = await adminFetch(`/api/admin/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
    } catch (e) {
      alert("Failed to update status");
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
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Financial Operations</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">CLIENT INVOICES</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Billing for inspections &amp; certifications · Payment tracking
            </p>
          </div>
          <button className="btn btn-ghost !px-4"><RefreshCcw className="h-3.5 w-3.5" /></button>
        </div>

        {/* Stats */}
        {invoices && (
            <div className="mb-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/12 bg-[var(--brand-teal)]/12 md:grid-cols-4">
                {[
                    { k: "Total Outstanding", v: `$${invoices.filter(i => i.status !== 'paid' && i.status !== 'void').reduce((s, i) => s + i.amount, 0).toLocaleString()}`, c: "var(--brand-gold)" },
                    { k: "Revenue (MTD)", v: `$${invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}`, c: "#3ce38e" },
                    { k: "Draft Invoices", v: invoices.filter(i => i.status === 'draft').length, c: "white" },
                    { k: "Pending Payment", v: invoices.filter(i => i.status === 'sent').length, c: "var(--brand-teal-soft)" },
                ].map((s) => (
                    <div key={s.k} className="bg-[var(--brand-navy-deep)] px-5 py-4">
                        <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
                        <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
                    </div>
                ))}
            </div>
        )}

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" placeholder="Search invoices…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {invoices === null ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <CreditCard className="mx-auto mb-4 h-10 w-10 text-white/25" />
            <div className="text-lg font-semibold text-white/60">No invoices yet</div>
            <p className="mt-2 text-sm text-white/35">Invoices can be generated from the Final Reports section.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => {
              const meta = STATUS_META[inv.status] || STATUS_META.draft;
              return (
                <div key={inv.id} className="bcso-panel p-4 flex items-center justify-between group hover:border-[var(--brand-teal)]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${inv.status === 'paid' ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-white/20'}`}>
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="mono text-[10px] font-bold text-[var(--brand-gold)]">{inv.invoiceNo}</span>
                        <span className={`mono text-[8px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <h3 className="font-bold text-white/90 mt-0.5">{inv.property.name}</h3>
                      <div className="mono text-[10px] text-white/40 mt-1 uppercase tracking-wide">
                        Amount: ${inv.amount.toLocaleString()} · Due: {inv.dueDate ? formatDate(inv.dueDate.toString()) : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.status === 'draft' && <button onClick={() => updateStatus(inv.id, 'sent')} disabled={busy === inv.id} className="btn btn-ghost !p-2" title="Mark as Sent"><Mail className="h-4 w-4" /></button>}
                    {inv.status === 'sent' && <button onClick={() => updateStatus(inv.id, 'paid')} disabled={busy === inv.id} className="btn btn-ghost !p-2 text-[#3ce38e] border-[#3ce38e]/20" title="Mark as Paid"><Check className="h-4 w-4" /></button>}
                    <Link href={`/admin/invoices/${inv.id}`} className="btn btn-ghost !p-2" title="Print Invoice"><Printer className="h-4 w-4" /></Link>
                    <Link href={`/admin/invoices/${inv.id}`} className="btn btn-ghost !p-2"><Eye className="h-4 w-4" /></Link>
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
