"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, ClipboardCopy, KeyRound, Loader2, Mail, Pencil, Phone, Plus,
  Printer, RefreshCcw, ShieldCheck, ShieldOff, Trash2, TriangleAlert, UserCog, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { BrandLogo } from "@/components/risk-badge";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { getSession as getContractorSession } from "@/lib/portal-client";
import type { StaffClientUser } from "@/lib/staff-client";

type StaffMember = StaffClientUser & {
  phone: string;
  title: string;
  accessCode: string;
  lastLoginAt: string | null;
  loginCount: number;
  active: boolean;
  createdAt: string | null;
};

const ROLE_META: Record<string, { label: string; desc: string; cls: string }> = {
  admin:     { label: "Admin",     desc: "Full control — staff, contractors, review, finalize, send", cls: "border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[var(--brand-gold-soft)]" },
  finalizer: { label: "Finalizer", desc: "Review, finalize and send reports to clients",             cls: "border-[var(--brand-teal)]/50 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  reviewer:  { label: "Reviewer",  desc: "Review submissions and return for correction",             cls: "border-white/25 bg-white/5 text-white/70" },
};

const EMPTY = { name: "", email: "", phone: "", title: "", role: "reviewer" };

function StaffCredentialCard({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const [copied, setCopied] = useState<"code" | "invite" | null>(null);
  const accessUrl = typeof window !== "undefined" ? `${window.location.origin}/admin/access` : "/admin/access";
  const role = ROLE_META[member.role] ?? ROLE_META.reviewer;

  function copyCode() {
    navigator.clipboard.writeText(member.accessCode).catch(() => undefined);
    setCopied("code");
    setTimeout(() => setCopied(null), 2000);
  }

  function copyInvite() {
    const msg = [
      `BCSO Staff Dashboard Access`,
      ``,
      `Name: ${member.name}`,
      `Role: ${role.label}`,
      member.title ? `Title: ${member.title}` : null,
      member.email ? `Email: ${member.email}` : null,
      member.phone ? `Phone: ${member.phone}` : null,
      ``,
      `Sign-in URL: ${accessUrl}`,
      `Access Code: ${member.accessCode}`,
      ``,
      `Use this code to sign into the BCSO dashboard.`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(msg).catch(() => undefined);
    setCopied("invite");
    setTimeout(() => setCopied(null), 2200);
  }

  function printCard() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>BCSO Staff Access — ${member.name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;background:#fff;padding:24px}
        .card{border:2px solid #0a376a;border-radius:14px;overflow:hidden;max-width:420px;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,.12)}
        .header{background:#0a376a;color:#fff;padding:20px 24px}
        .header h2{font-size:16px;font-weight:700;letter-spacing:.5px}
        .header p{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;opacity:.65;margin-top:3px}
        .body{padding:22px 24px}
        .label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-bottom:3px}
        .value{font-size:14px;font-weight:600;color:#1a1a2e;margin-bottom:14px}
        .code-box{background:#f0f6ff;border:2px solid #F97316;border-radius:10px;padding:14px 20px;text-align:center;margin:16px 0}
        .code-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#F97316;margin-bottom:6px}
        .code-value{font-family:'Courier New',monospace;font-size:30px;font-weight:800;letter-spacing:6px;color:#0a376a}
        .steps{background:#fffbf0;border:1px solid #EAB308;border-radius:8px;padding:14px 16px;margin-top:16px}
        .steps h4{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#b8860b;margin-bottom:10px}
        .steps ol{padding-left:18px}
        .steps li{font-size:12px;color:#555;margin-bottom:6px;line-height:1.4}
        .footer{background:#f8f8fc;border-top:1px solid #eee;padding:14px 24px}
        .footer p{font-size:10px;color:#888;text-align:center;line-height:1.5}
        .role-badge{display:inline-block;background:#f0f6ff;border:1px solid #F97316;color:#0a376a;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
        .warning{background:#fff5f5;border:1px solid #ffcccc;border-radius:6px;padding:10px 14px;margin-top:12px;font-size:11px;color:#c00;line-height:1.4;text-align:center}
      </style></head><body>
      <div class="card">
        <div class="header"><h2>BCSO Staff Dashboard Access</h2><p>Bahamas Compliance &amp; Safety Oversight Ltd.</p></div>
        <div class="body">
          <div class="label">Staff name</div><div class="value">${member.name}</div>
          <div class="label">Role</div><div class="value"><span class="role-badge">${role.label}</span></div>
          ${member.title ? `<div class="label">Title</div><div class="value">${member.title}</div>` : ""}
          ${member.email ? `<div class="label">Email</div><div class="value">${member.email}</div>` : ""}
          ${member.phone ? `<div class="label">Phone</div><div class="value">${member.phone}</div>` : ""}
          <div class="code-box">
            <div class="code-label">Your personal dashboard access code</div>
            <div class="code-value">${member.accessCode}</div>
          </div>
          <div class="steps"><h4>How to sign in</h4><ol>
            <li>Open: <strong>${accessUrl}</strong></li>
            <li>Enter your access code exactly as shown above.</li>
            <li>The BCSO dashboard opens immediately.</li>
          </ol></div>
          <div class="warning">Keep this code private. If lost or compromised, contact your administrator to have a new code issued.</div>
        </div>
        <div class="footer"><p>Issued by Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO)<br/>This card is for the named staff member only. It is not transferable.</p></div>
      </div></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.25 }} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 transition-colors hover:text-white"><X className="h-4 w-4" /></button>
        <div className="bg-[#0a376a] px-6 py-5">
          <BrandLogo className="h-10 w-auto" />
          <div className="mono mt-2 text-[9px] uppercase tracking-[0.22em] text-white/50">Staff Dashboard Access Card</div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Name", member.name],
              ["Role", role.label],
              ["Title", member.title || "—"],
              ["Email", member.email || "—"],
              ["Phone", member.phone || "—"],
              ["Status", member.active ? "Active" : "Deactivated"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="mono text-[9px] uppercase tracking-[0.18em] text-white/40">{k}</div>
                <div className={`mt-0.5 font-medium ${k === "Status" ? (member.active ? "text-[#4ADE80]" : "text-[#F87171]") : "text-white/90"}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border-2 border-[var(--brand-teal)]/50 bg-[var(--brand-teal)]/[0.08] p-5 text-center">
            <div className="mono mb-2 text-[9px] uppercase tracking-[0.24em] text-[var(--brand-teal-soft)]">Dashboard access code</div>
            <div className="font-display text-4xl tracking-[0.28em] text-white md:text-5xl">{member.accessCode}</div>
            <div className="mono mt-2 text-[9px] uppercase tracking-[0.14em] text-white/40">Sign-in URL</div>
            <div className="mt-1 break-all text-sm font-medium text-[var(--brand-gold-soft)]">{accessUrl}</div>
          </div>
        </div>
        <div className="grid gap-2.5 border-t border-white/10 px-6 py-4 sm:grid-cols-3">
          <button onClick={copyCode} className="btn btn-ghost flex-1">
            {copied === "code" ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
          <button onClick={copyInvite} className="btn btn-ghost flex-1">
            {copied === "invite" ? <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied === "invite" ? "Copied" : "Copy invite"}
          </button>
          <button onClick={printCard} className="btn btn-primary flex-1">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EditProfileModal({ member, onClose, onSave }: { member: StaffMember; onClose: () => void; onSave: (id: number, body: object) => Promise<void> }) {
  const [form, setForm] = useState({ name: member.name, email: member.email, phone: member.phone, title: member.title });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave(member.id, { action: "update", ...form });
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        <div className="mono-label mb-4 !text-[var(--brand-teal-soft)]">Edit Staff Profile</div>
        <div className="grid gap-3">
          <div>
            <div className="mono-label !text-[9px] mb-1">Full name</div>
            <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <div className="mono-label !text-[9px] mb-1">Email</div>
            <input className="field" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <div className="mono-label !text-[9px] mb-1">Job title</div>
            <input className="field" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <div className="mono-label !text-[9px] mb-1">Phone</div>
            <input className="field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={busy || !form.name.trim()} className="btn btn-primary flex-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StaffCard({ member, isMe, isAdmin, busy, onAction, onDelete, onShowCard, onEdit }: {
  member: StaffMember;
  isMe: boolean;
  isAdmin: boolean;
  busy: boolean;
  onAction: (id: number, action: string, extra?: object) => Promise<void>;
  onDelete: (m: StaffMember) => void;
  onShowCard: (m: StaffMember) => void;
  onEdit: (m: StaffMember) => void;
}) {
  const role = ROLE_META[member.role] ?? ROLE_META.reviewer;
  const [editingRole, setEditingRole] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-5 transition-colors ${member.active ? "border-[var(--brand-teal)]/15 bg-[var(--brand-navy-deep)]" : "border-[#ef4444]/15 bg-[#ef4444]/[0.02]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${member.active ? "border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/10" : "border-[#ef4444]/20 bg-[#ef4444]/10"}`}>
            <UserCog className={`h-5 w-5 ${member.active ? "text-[var(--brand-teal-soft)]" : "text-[#F87171]"}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[17px] font-semibold tracking-tight">{member.name}</h3>
              {isMe && <span className="mono rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-white/55">You</span>}
              <span className={`mono rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] ${role.cls}`}>{role.label}</span>
              {!member.active && <span className="mono rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-[#F87171]">Deactivated</span>}
              {member.loginCount === 0 && member.active && <span className="mono rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-[var(--brand-gold)]">Not yet signed in</span>}
            </div>
            <div className="mono mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.13em] text-white/45">
              {member.title && <span>{member.title}</span>}
              {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</span>}
              {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</span>}
              <span>{member.loginCount} login{member.loginCount !== 1 ? "s" : ""}</span>
              {member.lastLoginAt && <span>Last: {new Date(member.lastLoginAt).toLocaleDateString("en-GB")}</span>}
            </div>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-[var(--brand-teal)]/25 bg-[var(--brand-teal)]/[0.07] px-3 py-1.5">
              <KeyRound className="h-3.5 w-3.5 text-[var(--brand-teal-soft)]" />
              <span className="mono text-[12px] font-bold tracking-[0.2em] text-white">{member.accessCode}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(isAdmin || isMe) && (
            <button onClick={() => onEdit(member)} className="btn btn-ghost !px-3.5 !py-2">
              <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <button onClick={() => onShowCard(member)} className="btn btn-ghost !px-3.5 !py-2">
            <KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Credential card</span>
          </button>
          {isAdmin && (
            <>
              <button onClick={() => onAction(member.id, "regenerate")} disabled={busy} className="btn btn-ghost !px-3.5 !py-2" title="Generate new access code">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">New code</span>
              </button>
              {member.active ? (
                !isMe && <button onClick={() => onAction(member.id, "deactivate")} disabled={busy} className="btn btn-ghost !px-3.5 !py-2 hover:!border-[#ef4444]/60 hover:!text-[#F87171]"><ShieldOff className="h-3.5 w-3.5" /><span className="hidden sm:inline">Deactivate</span></button>
              ) : (
                <button onClick={() => onAction(member.id, "reactivate")} disabled={busy} className="btn btn-ghost !px-3.5 !py-2 hover:!border-[#22C55E]/60 hover:!text-[#4ADE80]"><ShieldCheck className="h-3.5 w-3.5" /><span className="hidden sm:inline">Reactivate</span></button>
              )}
              {!isMe && <button onClick={() => onDelete(member)} disabled={busy} className="btn btn-ghost !px-3 !py-2 hover:!border-[#ef4444]/60 hover:!text-[#F87171]"><Trash2 className="h-3.5 w-3.5" /></button>}
            </>
          )}
        </div>
      </div>

      {isAdmin && !isMe && member.active && (
        <div className="mt-4 border-t border-white/8 pt-4">
          <button onClick={() => setEditingRole((v) => !v)} className="mono flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
            <UserCog className="h-3 w-3" /> Change role
          </button>
          <AnimatePresence>
            {editingRole && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 flex flex-wrap gap-2">
                  {["reviewer", "finalizer", "admin"].map((r) => {
                    const m = ROLE_META[r];
                    const activeRole = member.role === r;
                    return (
                      <button key={r} onClick={() => { onAction(member.id, "changeRole", { role: r }); setEditingRole(false); }} className={`mono rounded-full border px-3 py-1.5 text-[9.5px] uppercase tracking-[0.12em] transition-colors ${activeRole ? m.cls : "border-white/15 text-white/50 hover:border-white/35"}`}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function StaffPage() {
  const router = useRouter();
  const [me, setMe] = useState<StaffMember | null>(null);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cardMember, setCardMember] = useState<StaffMember | null>(null);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<StaffMember | null>(null);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) {
      if (getContractorSession()) { window.location.href = "/portal"; }
      else { window.location.href = "/admin/access"; }
      return;
    }
    const [meRes, staffRes] = await Promise.all([
      adminFetch("/api/admin/me", { cache: "no-store" }, s),
      adminFetch("/api/admin/staff", { cache: "no-store" }, s),
    ]);
    if (meRes.status === 401) { window.location.href = "/admin/access"; return; }
    if (staffRes.status === 403) { window.location.href = "/admin"; return; }
    
    const meData = await safeJson<any>(meRes);
    const staffData = await safeJson<any>(staffRes);
    
    if (meData) setMe(meData.staff);
    if (staffData) setStaff(staffData);
  }, []);

  useEffect(() => { load(); }, [load]);

  function copyInviteText(text: string) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setNotice("Invite text copied.");
  }

  async function createStaff() {
    setFormBusy(true);
    setFormError(null);
    try {
      const res = await adminFetch("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCardMember(data.staff);
      setShowForm(false);
      setForm(EMPTY);
      setNotice(`${data.staff.name} created — access code ${data.staff.accessCode}`);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setFormBusy(false);
    }
  }

  async function doAction(id: number, action: string, extra?: object) {
    setBusy(id);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      if (action === "regenerate") {
        setCardMember(data.staff);
        setNotice(`New access code generated for ${data.staff.name}: ${data.staff.accessCode}`);
      }
      if (action === "deactivate") setNotice("Staff member deactivated.");
      if (action === "reactivate") setNotice("Staff member reactivated.");
      if (action === "update") setNotice("Profile updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteStaff(id: number) {
    setBusy(id);
    try {
      const res = await adminFetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await safeJson<any>(res) || {}).error ?? "Delete failed");
      setConfirmDel(null);
      setNotice("Staff member removed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  const isAdmin = me?.role === "admin";
  const active = (staff ?? []).filter((s) => s.active);
  const inactive = (staff ?? []).filter((s) => !s.active);

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <button onClick={() => router.push("/admin")} className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
            </button>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Staff Management</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">BCSO STAFF ACCOUNTS</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">Create accounts · Generate access codes · Manage profiles and roles</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add staff member
            </button>
          )}
        </div>

        {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/[0.08] px-4 py-3 text-sm text-[var(--brand-teal-soft)]"><span>{notice}</span><button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button></div>}
        {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-6">
              <div className="bcso-panel p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="mono-label !text-[var(--brand-gold)]">New staff account</div>
                  <button onClick={() => { setShowForm(false); setFormError(null); setForm(EMPTY); }}><X className="h-4 w-4 text-white/50" /></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Full name *</div>
                    <input className="field" placeholder="e.g. Nadia Rolle" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Work email</div>
                    <input className="field" type="email" placeholder="nadia@bcso.bs" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Job title</div>
                    <input className="field" placeholder="Safety Inspector" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Phone</div>
                    <input className="field" placeholder="(242) 555-0100" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="mono-label !text-[9px] mb-1.5">Role *</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {["reviewer", "finalizer", "admin"].map((r) => {
                        const m = ROLE_META[r];
                        return (
                          <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, role: r }))} className={`rounded-xl border p-3.5 text-left transition-all ${form.role === r ? `${m.cls}` : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                            <div className="font-semibold">{m.label}</div>
                            <div className="mt-1 text-[11px] leading-snug text-white/50">{m.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {formError && <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2.5 text-xs text-[#F87171]"><TriangleAlert className="h-3.5 w-3.5 shrink-0" />{formError}</div>}
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-white/40">An access code is generated automatically and displayed on a credential card immediately after creation.</p>
                  <button onClick={createStaff} disabled={formBusy || !form.name.trim()} className="btn btn-primary !px-6">
                    {formBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & show card"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {staff === null ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : (
          <div className="space-y-3">
            {active.length > 0 && <div className="mono-label mb-2 !text-[#4ADE80]">Active — {active.length}</div>}
            {active.map((s) => <StaffCard key={s.id} member={s} isMe={me?.id === s.id} isAdmin={isAdmin} busy={busy === s.id} onAction={doAction} onDelete={setConfirmDel} onShowCard={setCardMember} onEdit={setEditMember} />)}
            {inactive.length > 0 && <><div className="mono-label mb-2 mt-7 !text-[#F87171]">Deactivated — {inactive.length}</div>{inactive.map((s) => <StaffCard key={s.id} member={s} isMe={false} isAdmin={isAdmin} busy={busy === s.id} onAction={doAction} onDelete={setConfirmDel} onShowCard={setCardMember} onEdit={setEditMember} />)}</>}
          </div>
        )}
      </div>

      <AnimatePresence>{cardMember && <StaffCredentialCard member={cardMember} onClose={() => setCardMember(null)} />}</AnimatePresence>
      <AnimatePresence>{editMember && <EditProfileModal member={editMember} onClose={() => setEditMember(null)} onSave={async (id, body) => { await doAction(id, "update", body); }} />}</AnimatePresence>
      <AnimatePresence>
        {confirmDel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl border border-[#ef4444]/40 bg-[var(--brand-navy-deep)] p-6 shadow-2xl">
              <TriangleAlert className="mb-4 h-8 w-8 text-[#ef4444]" />
              <h3 className="font-display text-xl">Remove staff member?</h3>
              <p className="mt-2 text-sm text-white/60"><strong className="text-white">{confirmDel.name}</strong> will be permanently removed. This cannot be undone.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirmDel(null)} className="btn btn-ghost flex-1">Cancel</button>
                <button onClick={() => deleteStaff(confirmDel.id)} disabled={busy === confirmDel.id} className="btn flex-1 !border-[#ef4444]/60 !bg-[#ef4444]/10 !text-[#F87171] hover:!bg-[#ef4444]/20">
                  {busy === confirmDel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FieldOpsShell>
  );
}
