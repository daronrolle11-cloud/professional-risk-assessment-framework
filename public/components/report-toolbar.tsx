"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Download, Link2, Loader2, Mail, Printer } from "lucide-react";
import { tradeById } from "@/lib/operations";
import { canSend, type StaffClientUser } from "@/lib/staff-client";
import { adminFetch } from "@/lib/admin-fetch";
import { BrandLogo } from "./risk-badge";
import type { InspectionRow, PropertyRow, CompanySettingsRow } from "@/db/schema";

export function ReportToolbar({ inspection, property, staff, company }: { inspection: InspectionRow; property: PropertyRow; staff: StaffClientUser; company?: CompanySettingsRow }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(inspection.clientNotifiedAt ? "Report already logged as sent." : null);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function sendClient() {
    const recipientName = window.prompt("Recipient name", property.clientName) ?? property.clientName;
    const recipientEmail = window.prompt("Recipient email", property.clientEmail) ?? property.clientEmail;
    if (!recipientEmail) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await adminFetch(`/api/admin/inspections/${inspection.id}/send`, {
        method: "POST",
        body: JSON.stringify({ recipientName, recipientEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setStatus(data.mode === "smtp" ? "Report emailed successfully." : "SMTP not configured — delivery logged as simulated release.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <header className="bcso-topbar sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="shrink-0">
            <BrandLogo className="h-10 w-auto" plate />
          </Link>
          <span className="hidden h-5 w-px bg-white/15 sm:block" />
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/45">{inspection.reportNo}</div>
            <div className="max-w-[180px] truncate text-sm font-medium md:max-w-[320px]">{property.name}</div>
            <div className="mono text-[9px] uppercase tracking-[0.12em] text-[var(--brand-teal-soft)]">{staff.name} · {staff.role}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {status && <span className="hidden rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] text-white/60 lg:inline">{status}</span>}
          <Link href={`/admin/inspections/${inspection.id}`} className="btn btn-ghost !px-3.5 !py-2">
            <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden md:inline">Verification</span>
          </Link>
          <button onClick={copyLink} className="btn btn-ghost !px-3.5 !py-2">
            {copied ? <Check className="h-3.5 w-3.5 text-[#3ce38e]" /> : <Link2 className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{copied ? "Copied" : "Copy link"}</span>
          </button>
          {canSend(staff.role) ? (
            <button onClick={sendClient} disabled={sending || inspection.reviewStage !== "finalized" && inspection.reviewStage !== "sent"} className="btn btn-primary !px-4 !py-2">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Send report</span>
            </button>
          ) : (
            <button disabled className="btn btn-ghost !px-4 !py-2" title="Finalizer or admin role required to send reports.">
              <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Send locked</span>
            </button>
          )}
          <button onClick={() => window.print()} className="btn !px-4 !py-2 !bg-[var(--brand-gold)] !text-[var(--brand-navy)] bcso-gold-ring">
            <Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Print</span>
            <span className="hidden items-center gap-1.5 md:flex"><span className="opacity-40">/</span> <Download className="h-3.5 w-3.5" /> PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
