"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminFetch, getSession, logout as doLogout, safeJson } from "@/lib/admin-fetch";
import { getSession as getContractorSession } from "@/lib/portal-client";
import { ABOUT_BCSO } from "@/lib/data";
import {
  AlertTriangle, ArrowUpRight, BadgeCheck, Building2, Camera, ChevronDown, Clock3, Eye, FileText, GraduationCap, HelpCircle,
  Loader2, LogOut, MapPin, Plus, RefreshCcw, ShieldCheck, Sparkles, TriangleAlert, UserRound, Users, X, Wind,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { BrandLogo } from "@/components/risk-badge";
import { OpsVisualizer } from "@/components/ops-visualizer";
import { ISLANDS, TRADES, tradeById, verdictFor } from "@/lib/operations";
import { canFinalize, canReview, type StaffClientUser } from "@/lib/staff-client";
import { formatDate } from "@/lib/risk";
import type { ChecklistItemRow, ContractorRow, InspectionRow, PropertyRow } from "@/db/schema";

type AdminInspection = InspectionRow & {
  property: PropertyRow;
  contractor: { id: number; name: string; trade: string; island: string };
  stats: ReturnType<typeof statsShape>;
};

function statsShape(_x?: ChecklistItemRow) {
  return { score: 0, passCount: 0, failCount: 0, naCount: 0, pendingCount: 0, criticalFails: 0, total: 0, photoCount: 0 };
}

interface Overview {
  staff: StaffClientUser;
  contractors: ContractorRow[];
  properties: PropertyRow[];
  inspections: AdminInspection[];
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  assigned: { label: "Assigned", cls: "border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]", dot: "#F97316" },
  in_progress: { label: "In progress", cls: "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]", dot: "#EAB308" },
  returned: { label: "Returned", cls: "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#F87171]", dot: "#ef4444" },
  pending_review: { label: "Pending review", cls: "border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/[0.13] text-[var(--brand-gold-soft)]", dot: "#EAB308" },
  approved: { label: "Approved", cls: "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#4ADE80]", dot: "#22C55E" },
};

const STAGE_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/[0.13] text-[var(--brand-gold-soft)]" },
  reviewed: { label: "Reviewed — awaiting finalizer", cls: "border-[var(--brand-teal)]/45 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  finalized: { label: "Finalized — ready to send", cls: "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#7cebab]" },
  sent: { label: "Sent to client", cls: "border-[#22C55E]/50 bg-[#22C55E]/15 text-[#4ADE80]" },
};

const EMPTY_CONTRACTOR = { name: "", trade: "electrical", island: "new-providence", phone: "", email: "" };
const EMPTY_PROPERTY = { name: "", address: "", island: "new-providence", propertyType: "residential", clientName: "", clientEmail: "", squareFeet: "", yearBuilt: "" };

export default function AdminHubPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showContractorForm, setShowContractorForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [contractorForm, setContractorForm] = useState(EMPTY_CONTRACTOR);
  const [propertyForm, setPropertyForm] = useState(EMPTY_PROPERTY);
  const [assignForm, setAssignForm] = useState({ propertyId: "", contractorId: "", trade: "", scheduledFor: new Date(Date.now() + 86400000).toISOString().slice(0, 10) });
  const [notice, setNotice] = useState<string | null>(null);
  
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companySettings, setCompanySettings] = useState<{
    companyName: string;
    address: string;
    phone: string;
    email: string;
    managingDirector: string;
    logoDataUrl: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) {
      // If a contractor is logged in, redirect them to portal, otherwise access
      if (getContractorSession()) { window.location.href = "/portal"; }
      else { window.location.href = "/admin/access"; }
      return;
    }
    const [res, settingsRes] = await Promise.all([
      adminFetch("/api/admin/overview", { cache: "no-store" }, s),
      fetch("/api/admin/settings"),
    ]);
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    
    const payload = await safeJson<any>(res);
    const settingsPayload = await safeJson<any>(settingsRes) ?? {};
    
    if (!res.ok || !payload) throw new Error(payload?.error ?? "Failed to load hub data");
    setData(payload);
    setCompanySettings(settingsPayload.settings ?? {
      companyName: "Bahamas Compliance & Safety Oversight Ltd. (BCSO)",
      address: "Nassau, New Providence, The Bahamas",
      phone: "",
      email: "",
      managingDirector: "",
      logoDataUrl: null,
    });
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  function logout() { doLogout(); }

  async function seed() {
    setSeeding(true);
    try {
      const res = await adminFetch("/api/admin/seed", { method: "POST" });
      const data = await safeJson<any>(res);
      if (data) {
        setNotice(data.seeded ? "Demo staff, contractors, properties and reports seeded." : data.message);
      }
      await load();
    } finally {
      setSeeding(false);
    }
  }

  async function addContractor() {
    setBusy("contractor");
    try {
      const res = await adminFetch("/api/admin/contractors", {
        method: "POST",
        body: JSON.stringify(contractorForm),
      });
      const created = await safeJson<any>(res);
      if (!res.ok || !created) throw new Error(created?.error ?? "Failed");
      setNotice(`${created.name} provisioned. Access code: ${created.accessCode}`);
      setContractorForm(EMPTY_CONTRACTOR);
      setShowContractorForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add contractor");
    } finally {
      setBusy(null);
    }
  }

  async function addProperty() {
    setBusy("property");
    try {
      const res = await adminFetch("/api/admin/properties", {
        method: "POST",
        body: JSON.stringify({ ...propertyForm, squareFeet: Number(propertyForm.squareFeet) || 0, yearBuilt: Number(propertyForm.yearBuilt) || 0 }),
      });
      const created = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(created.error ?? "Failed");
      setNotice(`Property added: ${created.name}`);
      setPropertyForm(EMPTY_PROPERTY);
      setShowPropertyForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add property");
    } finally {
      setBusy(null);
    }
  }

  async function createAssignment() {
    setBusy("assign");
    try {
      const res = await adminFetch("/api/admin/inspections", {
        method: "POST",
        body: JSON.stringify({
          propertyId: Number(assignForm.propertyId),
          contractorId: Number(assignForm.contractorId),
          trade: assignForm.trade || undefined,
          scheduledFor: assignForm.scheduledFor,
        }),
      });
      const created = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(created.error ?? "Failed");
      setNotice(`Assignment ${created.code} dispatched to contractor.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create assignment");
    } finally {
      setBusy(null);
    }
  }

  async function saveCompanySettings(updates: Partial<typeof companySettings>) {
    setBusy("company");
    try {
      const s = getSession();
      if (!s) throw new Error("Unauthorized");
      const res = await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(updates),
      }, s);
      const payload = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(payload.error ?? "Failed to save company profile");
      setNotice("Company profile updated successfully.");
      setCompanySettings(payload.settings);
      setShowCompanyForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save company profile");
    } finally {
      setBusy(null);
    }
  }

  if (!data) {
    return (
      <FieldOpsShell
        right={
          <Link href="/admin/access" className="btn btn-ghost !px-3.5 !py-2.5">Access</Link>
        }
      >
        <div className="flex h-[60vh] items-center justify-center">
          {error ? (
            <div className="flex items-center gap-3 text-sm text-[#F87171]"><TriangleAlert className="h-4 w-4" />{error}</div>
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" />
          )}
        </div>
      </FieldOpsShell>
    );
  }

  const needsReview = data.inspections.filter((i) => i.status === "pending_review" && i.reviewStage === "pending");
  const needsFinalizer = data.inspections.filter((i) => i.reviewStage === "reviewed");
  const finalized = data.inspections.filter((i) => i.reviewStage === "finalized");
  const sent = data.inspections.filter((i) => i.reviewStage === "sent");
  const inField = data.inspections.filter((i) => ["assigned", "in_progress", "returned"].includes(i.status));

  const role = data.staff.role;

  return (
    <FieldOpsShell
      right={
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right md:block">
            <div className="mono text-[9px] uppercase tracking-[0.16em] text-white/35">Signed in</div>
            <div className="text-sm font-medium">{data.staff.name}</div>
            <div className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--brand-teal-soft)]">{data.staff.role}</div>
          </div>
          <button onClick={logout} className="btn btn-ghost !px-3.5 !py-2.5"><LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span></button>
        </div>
      }
    >
      <AnimatePresence>
        {showCompanyForm && companySettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] p-6 shadow-2xl">
              <button onClick={() => setShowCompanyForm(false)} className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
              <div className="mono-label mb-4 !text-[var(--brand-teal-soft)]">Company Profile & Logo</div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="shrink-0">
                    {companySettings.logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={companySettings.logoDataUrl} alt="Logo" className="h-14 w-auto object-contain rounded-md bg-white p-1" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-white/5">
                        <Camera className="h-5 w-5 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white/90">Dashboard & Report Logo</div>
                    <p className="mt-1 text-[11px] text-white/50 leading-relaxed">Upload a custom logo to appear on the portal and all generated reports. Max size 500KB.</p>
                    <div className="mt-2 flex gap-2">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden" 
                        id="logo-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 500 * 1024) {
                            alert("File is too large. Please upload an image under 500KB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => setCompanySettings({...companySettings, logoDataUrl: ev.target?.result as string});
                          reader.readAsDataURL(file);
                        }} 
                      />
                      <label htmlFor="logo-upload" className="btn btn-ghost !px-3 !py-1.5 !text-[10px] cursor-pointer">
                        Choose file
                      </label>
                      {companySettings.logoDataUrl && (
                        <button onClick={() => setCompanySettings({...companySettings, logoDataUrl: null})} className="btn btn-ghost !px-3 !py-1.5 !text-[10px] hover:!text-[#F87171]">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1">Company Name (Formal)</div>
                    <input className="field" value={companySettings.companyName} onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1">Registered Address / Office Location</div>
                    <input className="field" value={companySettings.address} onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1">Public Phone</div>
                    <input className="field" value={companySettings.phone} onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1">Public Email</div>
                    <input className="field" type="email" value={companySettings.email} onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1">Managing Director (appears on Compliance Certificates)</div>
                    <input className="field" placeholder="Full name and title" value={companySettings.managingDirector} onChange={(e) => setCompanySettings({...companySettings, managingDirector: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                <button onClick={() => setShowCompanyForm(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={() => saveCompanySettings(companySettings)} disabled={busy === "company"} className="btn btn-primary">
                  {busy === "company" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Administrative Hub — Controlled Release Workflow</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">COMPLIANCE COMMAND</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Role: {role} · Review, finalize and send with permission controls
            </p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => load().catch((e) => setError(e instanceof Error ? e.message : "Failed"))} className="btn btn-ghost !px-4"><RefreshCcw className="h-3.5 w-3.5" /></button>
            <button onClick={seed} disabled={seeding} className="btn btn-ghost !px-4">
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Seed demo</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/[0.08] px-4 py-3 text-sm text-[var(--brand-teal-soft)]">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* ── HIGH PRIORITY REVIEW QUEUE ── */}
        {needsReview.length > 0 && (
          <div className="mb-8 rounded-2xl border-2 border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/[0.03] p-1 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--brand-gold)]/20">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-[var(--brand-gold)] scan-pulse" />
                <h2 className="font-display text-2xl tracking-wide text-[var(--brand-gold-soft)]">
                  {needsReview.length} SUBMISSION{needsReview.length === 1 ? '' : 'S'} PENDING REVIEW
                </h2>
              </div>
              <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand-gold)] font-bold">Action Required</div>
            </div>
            <div className="divide-y divide-[var(--brand-gold)]/10">
              {needsReview.map((i) => {
                const verdict = verdictFor(i.stats);
                return (
                  <div key={i.id} className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-[var(--brand-gold)]/[0.05]">
                    <div className="min-w-0 flex-1">
                      <div className="mono text-[10px] uppercase text-white/40">{i.code} · {tradeById(i.trade).name}</div>
                      <Link href={`/admin/inspections/${i.id}`} className="mt-1 block text-lg font-bold tracking-tight text-white hover:text-[var(--brand-gold)] transition-colors">
                        {i.property.name}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] mono uppercase text-white/35">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{i.property.island}</span>
                        <span>Contractor: {i.contractor.name}</span>
                        {i.submittedAt && <span className="flex items-center gap-1.5"><Clock3 className="h-3 w-3" />Submitted {formatDate(i.submittedAt.toString())}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <div className="font-display text-3xl leading-none" style={{ color: verdict.hex }}>{i.stats.score}%</div>
                        <div className="mono mt-1 text-[8px] uppercase tracking-[0.16em]" style={{ color: verdict.hex }}>{verdict.label}</div>
                      </div>
                      <Link href={`/admin/inspections/${i.id}`} className="btn !bg-[var(--brand-gold)] !text-[var(--brand-navy)] !px-6 !py-3 font-bold bcso-gold-ring">
                        <FileText className="h-4 w-4" /> REVIEW DOCUMENT
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PRIMARY ACTION BUTTONS ────────────────────────────────── */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/inspections/new" className="group bcso-panel flex items-center gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)]/[0.06]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/20 text-[var(--brand-teal-soft)] transition-colors group-hover:bg-[var(--brand-teal)]/30">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg tracking-wide">NEW INSPECTION</div>
              <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">Dispatch a field inspection to a contractor</div>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
          </Link>
          <Link href="/assessments/new" className="group bcso-panel flex items-center gap-4 p-5 transition-colors hover:border-[var(--brand-gold)]/50 hover:bg-[var(--brand-gold)]/[0.04]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] transition-colors group-hover:bg-[var(--brand-gold)]/25">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg tracking-wide">NEW RISK ASSESSMENT</div>
              <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">Create a statutory risk assessment document</div>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[var(--brand-gold)]" />
          </Link>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/12 bg-[var(--brand-teal)]/12 md:grid-cols-5">
          {[
            { k: "Needs review", v: needsReview.length, c: "#EAB308" },
            { k: "Needs finalizer", v: needsFinalizer.length, c: "#7CD7E4" },
            { k: "Finalized", v: finalized.length, c: "#4ADE80" },
            { k: "Sent", v: sent.length, c: "#22C55E" },
            { k: "In field", v: inField.length, c: "#efede8" },
          ].map((s) => (
            <div key={s.k} className="bg-[var(--brand-navy-deep)] px-4 py-4">
              <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
              <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-6">
            <QueueCard title="Pending reviewer action" subtitle="Only users with reviewer/finalizer/admin access can move these files forward." iconColor="var(--brand-gold)">
              <QueueList items={needsReview} empty="Nothing waiting for review." />
            </QueueCard>
            <QueueCard title="Awaiting finalizer release" subtitle="Reviewed files waiting for a finalizer or admin to finalize before sending." iconColor="var(--brand-teal-soft)">
              <QueueList items={needsFinalizer} empty="No reviewed files are waiting on a finalizer." />
            </QueueCard>
            <QueueCard title="Release register" subtitle="Finalized and sent reports across BCSO operations." iconColor="#4ADE80">
              <QueueList items={[...finalized, ...sent]} empty="No finalized reports yet." showStage />
            </QueueCard>
          </div>

          <div className="space-y-6">
            <div className="bcso-panel p-5">
              <div className="mono-label mb-4 !text-[var(--brand-teal-soft)]">Dispatch Assignment</div>
              <div className="space-y-3">
                <select className="field !py-2.5 !text-[13px]" value={assignForm.propertyId} onChange={(e) => setAssignForm((f) => ({ ...f, propertyId: e.target.value }))}>
                  <option value="">Select property…</option>
                  {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.island}</option>)}
                </select>
                <select className="field !py-2.5 !text-[13px]" value={assignForm.contractorId} onChange={(e) => {
                  const c = data.contractors.find((x) => x.id === Number(e.target.value));
                  setAssignForm((f) => ({ ...f, contractorId: e.target.value, trade: c?.trade ?? f.trade }));
                }}>
                  <option value="">Select contractor…</option>
                  {data.contractors.map((c) => <option key={c.id} value={c.id}>{c.name} — {tradeById(c.trade).name} · {c.island}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select className="field !py-2.5 !text-[13px]" value={assignForm.trade} onChange={(e) => setAssignForm((f) => ({ ...f, trade: e.target.value }))}>
                    <option value="">From contractor</option>
                    {TRADES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <input type="date" className="field !py-2.5 !text-[13px]" value={assignForm.scheduledFor} onChange={(e) => setAssignForm((f) => ({ ...f, scheduledFor: e.target.value }))} />
                </div>
                <button onClick={createAssignment} disabled={busy === "assign" || !assignForm.propertyId || !assignForm.contractorId} className="btn btn-primary w-full">
                  {busy === "assign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Dispatch to portal <ArrowUpRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>

            {/* Site Registry shortcut */}
            <Link href="/admin/sites" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/15 text-[var(--brand-teal-soft)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Site Registry</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    All active job sites, marinas and facilities under oversight
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
            </Link>

            {/* Company Settings / Logo edit shortcut */}
            {data.staff.role === "admin" && (
              <button onClick={() => setShowCompanyForm(true)} className="group w-full bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold tracking-tight">Company Profile & Logo</div>
                    <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                      Edit details displayed on reports
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
              </button>
            )}

            {/* Compliance Certificates shortcut */}
            <Link href="/admin/hurricane" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors border-[#EAB308]/40 hover:bg-[#EAB308]/[0.04]">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
                  <Wind className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Hurricane Readiness</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    Bahamas-exclusive storm countdown &amp; insurance packs
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[#EAB308]" />
            </Link>

            <Link href="/admin/workers" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/15 text-[var(--brand-teal-soft)]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Worker Registry</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    Certification tracking, QR badges &amp; training logs
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
            </Link>

            <Link href="/admin/reinspections" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#22C55E]">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Compliance Certificates</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    Post-remediation re-inspections &amp; certificate issuance
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[#22C55E]" />
            </Link>

            {/* Training Management shortcut */}
            <Link href="/admin/training" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Training & Certification</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    Course catalog · Scheduling · QR verification · Auto-renewal
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-gold)]" />
            </Link>

            {/* Field FAQ shortcut */}
            <Link href="/admin/faq" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Field Technician FAQ</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    App troubleshooting · Connectivity · Standards · Print for field
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
            </Link>

            {/* Final Reports shortcut */}
            <Link href="/admin/reports" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/20 text-[var(--brand-teal-soft)]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Final Reports</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    View, print or email finalized compliance reports
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
            </Link>

            {/* Contractor management shortcut */}
            <Link href="/admin/contractors" className="group bcso-panel flex items-center justify-between gap-4 p-5 transition-colors hover:border-[var(--brand-teal)]/40">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/15 text-[var(--brand-teal-soft)]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold tracking-tight">Contractor Management</div>
                  <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/40">
                    {data.contractors.length} contractor{data.contractors.length === 1 ? "" : "s"} · create, credential cards, deactivate
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-colors group-hover:text-[var(--brand-teal-soft)]" />
            </Link>

            {/* Official Definition */}
            <div className="bcso-panel p-5 border-[var(--brand-teal)]/20 bg-gradient-to-br from-[var(--brand-navy-deep)] to-black">
              <div className="mono-label mb-3 !text-[var(--brand-teal-soft)]">Institutional Definition</div>
              <p className="text-[13px] leading-relaxed text-white/70 italic">
                &ldquo;{ABOUT_BCSO}&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="mono text-[8.5px] uppercase tracking-[0.2em] text-white/30">Oversight Agency Framework</span>
                <BrandLogo className="h-5 w-auto opacity-40" />
              </div>
            </div>

            <OpsVisualizer />

            <EntityCard title="Quick-add contractor" icon={<UserRound className="h-4 w-4 text-[var(--brand-teal-soft)]" />} open={showContractorForm} onToggle={() => setShowContractorForm((v) => !v)} count={data.contractors.length}>
              <AnimatePresence initial={false}>
                {showContractorForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bcso-soft-panel mb-3 space-y-2 rounded-xl p-3.5">
                      <input className="field !py-2.5 !text-[13px]" placeholder="Full name" value={contractorForm.name} onChange={(e) => setContractorForm((f) => ({ ...f, name: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="field !py-2.5 !text-[13px]" value={contractorForm.trade} onChange={(e) => setContractorForm((f) => ({ ...f, trade: e.target.value }))}>{TRADES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                        <select className="field !py-2.5 !text-[13px]" value={contractorForm.island} onChange={(e) => setContractorForm((f) => ({ ...f, island: e.target.value }))}>{ISLANDS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                      </div>
                      <input className="field !py-2.5 !text-[13px]" placeholder="Phone (optional)" value={contractorForm.phone} onChange={(e) => setContractorForm((f) => ({ ...f, phone: e.target.value }))} />
                      <button onClick={addContractor} disabled={busy === "contractor" || !contractorForm.name.trim()} className="btn btn-primary w-full !py-2.5">{busy === "contractor" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Provision access code"}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <ul className="space-y-2">
                {data.contractors.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="mono mt-0.5 text-[9px] uppercase tracking-[0.12em] text-white/35">{tradeById(c.trade).name} · {c.island}</div>
                    </div>
                    <span className="mono shrink-0 rounded-md border border-[var(--brand-teal)]/30 bg-black/40 px-2 py-1 text-[10px] font-bold tracking-[0.12em] text-[var(--brand-teal-soft)]">{c.accessCode}</span>
                  </li>
                ))}
              </ul>
            </EntityCard>

            <EntityCard title="Client Properties" icon={<Building2 className="h-4 w-4 text-[var(--brand-teal-soft)]" />} open={showPropertyForm} onToggle={() => setShowPropertyForm((v) => !v)} count={data.properties.length}>
              <AnimatePresence initial={false}>
                {showPropertyForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bcso-soft-panel mb-3 space-y-2 rounded-xl p-3.5">
                      <input className="field !py-2.5 !text-[13px]" placeholder="Property name" value={propertyForm.name} onChange={(e) => setPropertyForm((f) => ({ ...f, name: e.target.value }))} />
                      <input className="field !py-2.5 !text-[13px]" placeholder="Address" value={propertyForm.address} onChange={(e) => setPropertyForm((f) => ({ ...f, address: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="field !py-2.5 !text-[13px]" value={propertyForm.island} onChange={(e) => setPropertyForm((f) => ({ ...f, island: e.target.value }))}>{ISLANDS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                        <select className="field !py-2.5 !text-[13px]" value={propertyForm.propertyType} onChange={(e) => setPropertyForm((f) => ({ ...f, propertyType: e.target.value }))}><option value="villa">Villa / Luxury Rental</option><option value="residential">Residential</option><option value="condo">Condo / Apartment</option><option value="commercial">Commercial</option><option value="marina">Marina</option></select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="field !py-2.5 !text-[13px]" placeholder="Client name" value={propertyForm.clientName} onChange={(e) => setPropertyForm((f) => ({ ...f, clientName: e.target.value }))} />
                        <input className="field !py-2.5 !text-[13px]" placeholder="Client email" value={propertyForm.clientEmail} onChange={(e) => setPropertyForm((f) => ({ ...f, clientEmail: e.target.value }))} />
                      </div>
                      <button onClick={addProperty} disabled={busy === "property" || !propertyForm.name.trim() || !propertyForm.clientName.trim()} className="btn btn-primary w-full !py-2.5">{busy === "property" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add property"}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <ul className="space-y-2">
                {data.properties.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="mono mt-0.5 text-[9px] uppercase tracking-[0.12em] text-white/35">{p.island} · {p.propertyType}</div>
                    </div>
                    <span className="mono shrink-0 text-[9px] uppercase tracking-[0.12em] text-white/40">{p.clientName}</span>
                  </li>
                ))}
              </ul>
            </EntityCard>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/50">
          Demo staff access codes: <span className="mono text-white/70">REV-2026</span> (reviewer), <span className="mono text-white/70">FIN-2026</span> (finalizer), <span className="mono text-white/70">ADM-2026</span> (admin).
          {canReview(role) ? " You can review submissions." : ""}
          {canFinalize(role) ? " You can finalize and send reports." : ""}
        </div>
      </div>
    </FieldOpsShell>
  );
}

function QueueCard({ title, subtitle, children, iconColor }: { title: string; subtitle: string; children: React.ReactNode; iconColor: string }) {
  return (
    <div className="bcso-panel p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: iconColor }} />
        <div>
          <div className="mono-label" style={{ color: iconColor }}>{title}</div>
          <div className="text-xs text-white/45">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function QueueList({ items, empty, showStage = false }: { items: AdminInspection[]; empty: string; showStage?: boolean }) {
  if (items.length === 0) return <div className="rounded-xl border border-dashed border-white/12 p-8 text-center text-sm text-white/35">{empty}</div>;
  return (
    <div className="space-y-3">
      {items.map((i, idx) => {
        const verdict = verdictFor(i.stats);
        const status = STATUS_META[i.status];
        const stage = STAGE_META[i.reviewStage] ?? STAGE_META.pending;
        return (
          <motion.div key={i.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: idx * 0.04 }} className="rounded-xl border border-[var(--brand-teal)]/12 bg-black/25 p-4 transition-colors hover:border-[var(--brand-teal)]/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="mono text-[9.5px] uppercase tracking-[0.16em] text-white/35">{i.code} · {tradeById(i.trade).name}</div>
                <Link href={`/admin/inspections/${i.id}`} className="mt-1 block truncate text-[15px] font-semibold tracking-tight transition-colors hover:text-[var(--brand-teal-soft)]">{i.property.name}</Link>
                <div className="mono mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[9.5px] uppercase tracking-[0.12em] text-white/40">
                  <span>{i.contractor.name}</span>
                  <span>{i.property.island}</span>
                  {i.submittedAt && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Submitted {formatDate(i.submittedAt.toString())}</span>}
                  <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{i.stats.photoCount} photos</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-3xl leading-none" style={{ color: verdict.hex }}>{i.stats.score}</div>
                  <div className="mono mt-1 text-[8px] uppercase tracking-[0.14em]" style={{ color: verdict.hex }}>{verdict.label}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/inspections/${i.id}`} className="btn btn-ghost !p-2" title="Review / Edit"><Eye className="h-3.5 w-3.5" /></Link>
                  {(i.status === 'approved' || i.reviewStage === 'finalized' || i.reviewStage === 'sent') && (
                    <Link href={`/admin/reports/${i.id}`} className="btn btn-ghost !p-2" title="View PDF Report"><FileText className="h-3.5 w-3.5" /></Link>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`mono rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${status.cls}`}>{status.label}</span>
              {showStage && <span className={`mono rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] ${stage.cls}`}>{stage.label}</span>}
              {i.stats.criticalFails > 0 && <span className="mono rounded-full border border-[#ef4444]/45 bg-[#ef4444]/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-[#F87171]">{i.stats.criticalFails} critical</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function EntityCard({ title, icon, open, onToggle, count, children }: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bcso-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">{icon}<span className="mono-label">{title} — {count}</span></div>
        <button onClick={onToggle} className={`mono flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.12em] transition-colors ${open ? "border-[var(--brand-teal)]/50 text-[var(--brand-teal-soft)]" : "border-white/15 text-white/50 hover:border-[var(--brand-teal)]/35"}`}>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {open ? "Close" : "Add"}
        </button>
      </div>
      {children}
    </div>
  );
}
