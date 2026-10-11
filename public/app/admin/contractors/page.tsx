"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, ClipboardCopy, KeyRound, Loader2, MapPin, Phone,
  Plus, Printer, RefreshCcw, ShieldOff, ShieldCheck, Trash2, TriangleAlert,
  UserRound, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { BrandLogo } from "@/components/risk-badge";

import type { ContractorRow, ContractorPermissions } from "@/db/schema";
import { TRADES, ISLANDS } from "@/lib/operations";
import { getSession as getStaffSession, adminFetch, safeJson } from "@/lib/admin-fetch";
import { getSession as getContractorSession } from "@/lib/portal-client";

type ContractorWithStats = ContractorRow & {
  tradeName: string;
  jobs: { total: number; active: number; completed: number };
};

const EMPTY_FORM = {
  name: "", trade: "electrical", island: "new-providence", phone: "", email: "",
};

function CredentialCard({ contractor, onClose }: { contractor: ContractorWithStats; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<"code" | "invite" | null>(null);
  const portalUrl = `${window.location.origin}/portal`;

  function copyCode() {
    navigator.clipboard.writeText(contractor.accessCode).catch(() => undefined);
    setCopied("code");
    setTimeout(() => setCopied(null), 2000);
  }

  function copyInvite() {
    const message = [
      `BCSO Contractor Portal Access`,
      ``,
      `Name: ${contractor.name}`,
      `Trade: ${contractor.tradeName}`,
      `Island: ${contractor.island}`,
      ``,
      `Portal URL: ${portalUrl}`,
      `Access Code: ${contractor.accessCode}`,
      ``,
      `Log in with this access code and complete any assigned inspections. Upload photo evidence for all findings marked FAIL.`,
    ].join("\n");
    navigator.clipboard.writeText(message).catch(() => undefined);
    setCopied("invite");
    setTimeout(() => setCopied(null), 2200);
  }

  function printCard() {
    const win = window.open("", "_blank");
    if (!win || !cardRef.current) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BCSO Portal Access — ${contractor.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; background: #fff; padding: 24px; }
            .card {
              border: 2px solid #0a376a;
              border-radius: 14px;
              overflow: hidden;
              max-width: 420px;
              margin: 0 auto;
              box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            }
            .header {
              background: #0a376a;
              color: #fff;
              padding: 20px 24px;
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .header-text h2 { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
            .header-text p { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.65; margin-top: 3px; }
            .body { padding: 22px 24px; }
            .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 3px; }
            .value { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 14px; }
            .code-box {
              background: #f0f6ff;
              border: 2px solid #F97316;
              border-radius: 10px;
              padding: 14px 20px;
              text-align: center;
              margin: 16px 0;
            }
            .code-label { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #F97316; margin-bottom: 6px; }
            .code-value { font-family: 'Courier New', monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #0a376a; }
            .steps { background: #fffbf0; border: 1px solid #EAB308; border-radius: 8px; padding: 14px 16px; margin-top: 16px; }
            .steps h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #b8860b; margin-bottom: 10px; }
            .steps ol { padding-left: 18px; }
            .steps li { font-size: 12px; color: #555; margin-bottom: 6px; line-height: 1.4; }
            .footer { background: #f8f8fc; border-top: 1px solid #eee; padding: 14px 24px; }
            .footer p { font-size: 10px; color: #888; text-align: center; line-height: 1.5; }
            .warning { background: #fff5f5; border: 1px solid #ffcccc; border-radius: 6px; padding: 10px 14px; margin-top: 12px; font-size: 11px; color: #c00; line-height: 1.4; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="header-text">
                <h2>BCSO Contractor Portal Access</h2>
                <p>Bahamas Compliance &amp; Safety Oversight Ltd.</p>
              </div>
            </div>
            <div class="body">
              <div class="label">Contractor name</div>
              <div class="value">${contractor.name}</div>
              <div class="label">Trade</div>
              <div class="value">${contractor.tradeName}</div>
              <div class="label">Operating island</div>
              <div class="value">${contractor.island}</div>
              ${contractor.phone ? `<div class="label">Phone</div><div class="value">${contractor.phone}</div>` : ""}
              <div class="code-box">
                <div class="code-label">Your personal portal access code</div>
                <div class="code-value">${contractor.accessCode}</div>
              </div>
              <div class="steps">
                <h4>How to log in</h4>
                <ol>
                  <li>Open the BCSO portal on your phone or browser:<br/><strong>${portalUrl}</strong></li>
                  <li>Enter your access code exactly as shown above — all capitals, including the dash.</li>
                  <li>Your assigned inspections will appear immediately.</li>
                  <li>Complete each checklist item and upload time-stamped photo evidence for all findings.</li>
                  <li>Submit when all items are answered. Your BCSO coordinator will review and release the report.</li>
                </ol>
              </div>
              <div class="warning">Keep this code private. If it is lost or compromised, contact your BCSO coordinator immediately to have a new code issued.</div>
            </div>
            <div class="footer">
              <p>Issued by Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO)<br/>
              This card is for the named contractor only. It is not transferable.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>

        {/* Card header — dark navy band mirrors printed card */}
        <div className="bg-[#0a376a] px-6 py-5">
          <BrandLogo className="h-10 w-auto" />
          <div className="mono mt-2 text-[9px] uppercase tracking-[0.22em] text-white/50">Contractor Portal Access Card</div>
        </div>

        <div className="p-6" ref={cardRef}>
          {/* Contractor details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Contractor", contractor.name],
              ["Trade", contractor.tradeName],
              ["Island", contractor.island],
              ["Phone", contractor.phone || "—"],
              ["Email", contractor.email || "—"],
              ["Status", contractor.active === "true" ? "Active" : "Deactivated"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="mono text-[9px] uppercase tracking-[0.18em] text-white/40">{k}</div>
                <div className={`mt-0.5 font-medium ${k === "Status" ? (contractor.active === "true" ? "text-[#4ADE80]" : "text-[#F87171]") : "text-white/90"}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Access code block */}
          <div className="mt-5 rounded-xl border-2 border-[var(--brand-teal)]/50 bg-[var(--brand-teal)]/[0.08] p-5 text-center">
            <div className="mono mb-2 text-[9px] uppercase tracking-[0.24em] text-[var(--brand-teal-soft)]">Personal portal access code</div>
            <div className="font-display text-4xl tracking-[0.28em] text-white md:text-5xl">{contractor.accessCode}</div>
            <div className="mono mt-2 text-[9px] uppercase tracking-[0.14em] text-white/40">Portal URL</div>
            <div className="mt-1 break-all text-sm font-medium text-[var(--brand-gold-soft)]">{portalUrl}</div>
          </div>

          {/* How to log in */}
          <div className="mt-4 rounded-xl border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/[0.06] p-4">
            <div className="mono mb-2.5 text-[9px] uppercase tracking-[0.2em] text-[var(--brand-gold)]">How to log in</div>
            <ol className="space-y-2 text-xs leading-relaxed text-white/65">
              <li><span className="mr-2 font-bold text-white/90">1.</span>Go to the BCSO portal URL on your phone or browser.</li>
              <li><span className="mr-2 font-bold text-white/90">2.</span>Type your access code exactly as shown — capitals, include the dash.</li>
              <li><span className="mr-2 font-bold text-white/90">3.</span>Your assigned inspections load immediately.</li>
              <li><span className="mr-2 font-bold text-white/90">4.</span>Complete each checklist and upload a photo for every finding marked FAIL.</li>
              <li><span className="mr-2 font-bold text-white/90">5.</span>Submit — your BCSO coordinator reviews and releases the report.</li>
            </ol>
          </div>

          <p className="mono mt-3 text-center text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/35">
            Keep this code private. Contact your coordinator immediately if it is lost or shared.
          </p>
        </div>

        {/* Actions */}
        <div className="grid gap-2.5 border-t border-white/10 px-6 py-4 sm:grid-cols-3">
          <button onClick={copyCode} className="btn btn-ghost flex-1">
            {copied === "code" ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied === "code" ? "Code copied" : "Copy code"}
          </button>
          <button onClick={copyInvite} className="btn btn-ghost flex-1">
            {copied === "invite" ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied === "invite" ? "Invite copied" : "Copy invite"}
          </button>
          <button onClick={printCard} className="btn btn-primary flex-1">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ContractorsPage() {
  const router = useRouter();
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [contractors, setContractors] = useState<ContractorWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credCard, setCredCard] = useState<ContractorWithStats | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ContractorWithStats | null>(null);

  const isAdmin = staffRole === "admin";

  const load = useCallback(async () => {
    const s = getStaffSession();
    if (!s) {
      if (getContractorSession()) { window.location.href = "/portal"; }
      else { window.location.href = "/admin/access"; }
      return;
    }
    const [meRes, contractorRes] = await Promise.all([
      adminFetch("/api/admin/me", { cache: "no-store" }, s),
      adminFetch("/api/admin/contractors", { cache: "no-store" }, s),
    ]);
    if (meRes.status === 401 || contractorRes.status === 401) {
      window.location.href = "/admin/access";
      return;
    }
    const me = await safeJson<any>(meRes);
    const cList = await safeJson<any>(contractorRes);

    if (me) setStaffRole(me.staff?.role ?? null);
    if (cList) setContractors(cList);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addContractor() {
    setFormBusy(true);
    setFormError(null);
    try {
      const res = await adminFetch("/api/admin/contractors", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Failed");
      setNotice(`${data.name} created — access code ${data.accessCode}`);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
      // Open credential card immediately for the new contractor
      const fresh = { ...data, tradeName: TRADES.find((t) => t.id === data.trade)?.name ?? data.trade, jobs: { total: 0, active: 0, completed: 0 } };
      setCredCard(fresh);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setFormBusy(false);
    }
  }

  async function doAction(id: number, action: string) {
    setBusy(id);
    try {
      const res = await adminFetch(`/api/admin/contractors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Action failed");
      const updated = data.contractor;
      if (action === "regenerate") {
        setNotice(`New access code for ${updated.name}: ${updated.accessCode}`);
        const fresh = contractors?.find((c) => c.id === updated.id);
        if (fresh) setCredCard({ ...fresh, ...updated });
      }
      if (action === "deactivate") setNotice(`${updated.name} deactivated — they cannot log in until reactivated.`);
      if (action === "reactivate") setNotice(`${updated.name} reactivated.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteContractor(id: number) {
    setBusy(id);
    try {
      const res = await adminFetch(`/api/admin/contractors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await safeJson<any>(res);
        throw new Error(d?.error ?? "Delete failed");
      }
      setConfirmDelete(null);
      setNotice("Contractor removed from the system.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  async function updatePermissions(id: number, perms: Partial<ContractorPermissions>) {
    try {
      const res = await adminFetch(`/api/admin/contractors/${id}/permissions`, {
        method: "PUT",
        body: JSON.stringify(perms),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Failed");
      setNotice("Contractor permissions updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update permissions");
    }
  }

  const active = contractors?.filter((c) => c.active === "true") ?? [];
  const inactive = contractors?.filter((c) => c.active !== "true") ?? [];

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <button onClick={() => router.push("/admin")} className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
            </button>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Contractor Management</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">ON-ISLAND CONTRACTORS</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Create accounts · Issue access codes · Manage portal access
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => load()} className="btn btn-ghost !px-4"><RefreshCcw className="h-3.5 w-3.5" /></button>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add contractor
            </button>
          </div>
        </div>

        {/* Alerts */}
        {notice && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/[0.08] px-4 py-3 text-sm text-[var(--brand-teal-soft)]">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* How it works explainer */}
        <div className="mb-7 grid gap-3 sm:grid-cols-3">
          {[
            { n: "01", title: "Create contractor", body: "Add their name, trade and island. BCSO auto-generates a unique access code." },
            { n: "02", title: "Share the code", body: "Print or copy the credential card and give it to the contractor. They enter the code at /portal to sign in." },
            { n: "03", title: "Assign inspections", body: "Dispatch inspections from the Admin Hub. The contractor sees them instantly on their portal." },
          ].map((s) => (
            <div key={s.n} className="bcso-panel p-5">
              <div className="font-display mb-2 text-xl text-[var(--brand-teal-soft)]">{s.n}</div>
              <div className="font-semibold tracking-tight text-white/90">{s.title}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Add contractor form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-6">
              <div className="bcso-panel p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="mono-label !text-[var(--brand-gold)]">New contractor account</div>
                  <button onClick={() => { setShowForm(false); setFormError(null); setForm(EMPTY_FORM); }} className="rounded-full p-1.5 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <div className="mono-label !text-[9px] mb-1.5">Full name *</div>
                    <input className="field" placeholder="e.g. Michael Rolle" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Trade *</div>
                    <select className="field" value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}>
                      {TRADES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Operating island *</div>
                    <select className="field" value={form.island} onChange={(e) => setForm((f) => ({ ...f, island: e.target.value }))}>
                      {ISLANDS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Phone (optional)</div>
                    <input className="field" placeholder="(242) 555-0100" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Email (optional)</div>
                    <input className="field" type="email" placeholder="contractor@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                {formError && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2.5 text-xs text-[#F87171]">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" /> {formError}
                  </div>
                )}
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-white/40">An access code is generated automatically and shown on the credential card immediately after creation.</p>
                  <button onClick={addContractor} disabled={formBusy || !form.name.trim()} className="btn btn-primary !px-6">
                    {formBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & show credential card"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats bar */}
        {contractors && (
          <div className="mb-7 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/12 bg-[var(--brand-teal)]/12">
            {[
              { k: "Total contractors", v: contractors.length, c: "#efede8" },
              { k: "Active", v: active.length, c: "#4ADE80" },
              { k: "Deactivated", v: inactive.length, c: "#F87171" },
            ].map((s) => (
              <div key={s.k} className="bg-[var(--brand-navy-deep)] px-5 py-4">
                <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
                <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contractor list */}
        {contractors === null ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : contractors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
            <UserRound className="mx-auto mb-4 h-10 w-10 text-white/25" />
            <div className="text-lg font-semibold text-white/60">No contractors yet</div>
            <p className="mt-2 text-sm text-white/35">Add your first on-island contractor above to generate their portal access code.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.length > 0 && <div className="mono-label mb-2 !text-[#4ADE80]">Active — {active.length}</div>}
            {active.map((c) => <ContractorCard key={c.id} contractor={c} busy={busy === c.id} isAdmin={isAdmin} onCredential={setCredCard} onAction={doAction} onDelete={setConfirmDelete} onPermUpdate={updatePermissions} />)}
            {inactive.length > 0 && (
              <>
                <div className="mono-label mb-2 mt-7 !text-[#F87171]">Deactivated — {inactive.length}</div>
                {inactive.map((c) => <ContractorCard key={c.id} contractor={c} busy={busy === c.id} isAdmin={isAdmin} onCredential={setCredCard} onAction={doAction} onDelete={setConfirmDelete} onPermUpdate={updatePermissions} />)}
              </>
            )}
          </div>
        )}
      </div>

      {/* Credential card modal */}
      <AnimatePresence>
        {credCard && <CredentialCard contractor={credCard} onClose={() => setCredCard(null)} />}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl border border-[#ef4444]/40 bg-[var(--brand-navy-deep)] p-6 shadow-2xl">
              <TriangleAlert className="mb-4 h-8 w-8 text-[#ef4444]" />
              <h3 className="font-display text-xl">Remove contractor?</h3>
              <p className="mt-2 text-sm text-white/60">
                <strong className="text-white">{confirmDelete.name}</strong> will be permanently removed. Their inspection history is retained. This cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1">Cancel</button>
                <button onClick={() => deleteContractor(confirmDelete.id)} disabled={busy === confirmDelete.id} className="btn flex-1 !border-[#ef4444]/60 !bg-[#ef4444]/10 !text-[#F87171] hover:!bg-[#ef4444]/20">
                  {busy === confirmDelete.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Remove</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FieldOpsShell>
  );
}

const DEFAULT_PERMS: ContractorPermissions = {
  canSubmitPhotos: true,
  canAddNotes: true,
  canViewHistory: true,
  allowedTrades: [],
  restrictedToIslands: [],
  maxActiveJobs: 0,
};

function ContractorCard({
  contractor, busy, isAdmin, onCredential, onAction, onDelete, onPermUpdate,
}: {
  contractor: ContractorWithStats;
  busy: boolean;
  isAdmin: boolean;
  onCredential: (c: ContractorWithStats) => void;
  onAction: (id: number, action: string) => void;
  onDelete: (c: ContractorWithStats) => void;
  onPermUpdate: (id: number, perms: Partial<ContractorPermissions>) => void;
}) {
  const active = contractor.active === "true";
  const perms: ContractorPermissions = { ...DEFAULT_PERMS, ...((contractor.permissions as ContractorPermissions) ?? {}) };
  const [showPerms, setShowPerms] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 transition-colors ${active ? "border-[var(--brand-teal)]/15 bg-[var(--brand-navy-deep)]" : "border-[#ef4444]/15 bg-[#ef4444]/[0.02]"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Identity */}
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${active ? "border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/10" : "border-[#ef4444]/20 bg-[#ef4444]/10"}`}>
            <UserRound className={`h-5 w-5 ${active ? "text-[var(--brand-teal-soft)]" : "text-[#F87171]"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-[17px] font-semibold tracking-tight text-white">{contractor.name}</h3>
              <span className={`mono rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] ${active ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#4ADE80]" : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#F87171]"}`}>
                {active ? "Active" : "Deactivated"}
              </span>
            </div>
            <div className="mono mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.13em] text-white/45">
              <span>{contractor.tradeName}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{contractor.island}</span>
              {contractor.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contractor.phone}</span>}
            </div>
          </div>
        </div>

        {/* Access code pill */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/[0.07] px-4 py-2.5 text-center">
            <div className="mono text-[8px] uppercase tracking-[0.2em] text-[var(--brand-teal-soft)]">Access code</div>
            <div className={`font-display mt-1 text-xl tracking-[0.22em] ${active ? "text-white" : "text-white/35 line-through"}`}>
              {contractor.accessCode}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="text-center">
          <div className="font-display text-xl text-[var(--brand-teal-soft)]">{contractor.jobs.total}</div>
          <div className="mono text-[8.5px] uppercase tracking-[0.14em] text-white/35">Total jobs</div>
        </div>
        <div className="text-center">
          <div className="font-display text-xl text-[var(--brand-gold)]">{contractor.jobs.active}</div>
          <div className="mono text-[8.5px] uppercase tracking-[0.14em] text-white/35">Active</div>
        </div>
        <div className="text-center">
          <div className="font-display text-xl text-[#4ADE80]">{contractor.jobs.completed}</div>
          <div className="mono text-[8.5px] uppercase tracking-[0.14em] text-white/35">Completed</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {/* View credential card */}
          {active && (
            <button onClick={() => onCredential(contractor)} disabled={busy} className="btn btn-ghost !px-3.5 !py-2">
              <KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Credential card</span>
            </button>
          )}
          {/* Regenerate code */}
          {active && (
            <button onClick={() => onAction(contractor.id, "regenerate")} disabled={busy} title="Regenerate access code" className="btn btn-ghost !px-3.5 !py-2">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">New code</span>
            </button>
          )}
          {/* Deactivate / reactivate */}
          {active ? (
            <button onClick={() => onAction(contractor.id, "deactivate")} disabled={busy} className="btn btn-ghost !px-3.5 !py-2 hover:!border-[#ef4444]/60 hover:!text-[#F87171]">
              <ShieldOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Deactivate</span>
            </button>
          ) : (
            <button onClick={() => onAction(contractor.id, "reactivate")} disabled={busy} className="btn btn-ghost !px-3.5 !py-2 hover:!border-[#22C55E]/60 hover:!text-[#4ADE80]">
              <ShieldCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reactivate</span>
            </button>
          )}
          {/* Delete (admin only) */}
          {isAdmin && (
            <button onClick={() => onDelete(contractor)} disabled={busy} className="btn btn-ghost !px-3 !py-2 hover:!border-[#ef4444]/60 hover:!text-[#F87171]" title="Permanently remove">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Permissions panel — admin only */}
      {isAdmin && active && (
        <div className="mt-4 border-t border-white/8 pt-4">
          <button onClick={() => setShowPerms((v) => !v)} className="mono flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
            <ShieldCheck className="h-3 w-3" /> Contractor permissions
          </button>
          <AnimatePresence>
            {showPerms && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Boolean toggles */}
                    {([
                      ["canSubmitPhotos", "Can upload photo evidence"],
                      ["canAddNotes", "Can add finding notes"],
                      ["canViewHistory", "Can view past inspection history"],
                    ] as [keyof ContractorPermissions, string][]).map(([key, label]) => {
                      const val = perms[key] as boolean;
                      return (
                        <button key={key} type="button" onClick={() => onPermUpdate(contractor.id, { [key]: !val })}
                          className={`flex items-center justify-between rounded-lg border px-3.5 py-3 text-left text-sm transition-colors ${val ? "border-[#22C55E]/40 bg-[#22C55E]/[0.07] text-[#7cebab]" : "border-[#ef4444]/30 bg-[#ef4444]/[0.05] text-[#F87171]"}`}>
                          <span>{label}</span>
                          <span className={`mono text-[9px] uppercase tracking-[0.16em] ${val ? "text-[#4ADE80]" : "text-[#F87171]"}`}>{val ? "Allowed" : "Blocked"}</span>
                        </button>
                      );
                    })}
                    {/* Max active jobs */}
                    <div className="flex items-center justify-between rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-3">
                      <span className="text-sm text-white/70">Max active jobs</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} max={99} className="field !w-16 !py-1.5 text-center !text-sm" value={perms.maxActiveJobs}
                          onChange={(e) => onPermUpdate(contractor.id, { maxActiveJobs: Math.max(0, Number(e.target.value)) })} />
                        <span className="mono text-[9px] uppercase text-white/35">0=unlimited</span>
                      </div>
                    </div>
                    {/* Allowed trades */}
                    <div className="sm:col-span-2">
                      <div className="mono mb-2 text-[9px] uppercase tracking-[0.16em] text-white/40">Allowed trades (empty = all)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {TRADES.map((t) => {
                          const allowed = perms.allowedTrades.length === 0 || perms.allowedTrades.includes(t.id);
                          return (
                            <button key={t.id} type="button"
                              onClick={() => {
                                const current = perms.allowedTrades.length === 0 ? TRADES.map((x) => x.id) : [...perms.allowedTrades];
                                const next = current.includes(t.id) ? current.filter((x) => x !== t.id) : [...current, t.id];
                                onPermUpdate(contractor.id, { allowedTrades: next.length === TRADES.length ? [] : next });
                              }}
                              className={`mono rounded-full border px-3 py-1.5 text-[9.5px] uppercase tracking-[0.12em] transition-colors ${allowed ? "border-[var(--brand-teal)]/50 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" : "border-[#ef4444]/30 bg-[#ef4444]/[0.05] text-[#F87171]"}`}>
                              {t.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="mono mt-3 text-[9px] uppercase leading-relaxed tracking-[0.12em] text-white/25">
                    Changes take effect on the contractor&apos;s next portal action. Blocking photo upload prevents checklist submission.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
