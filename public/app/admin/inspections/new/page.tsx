"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Building2, Calendar, Loader2, MapPin, ShieldCheck, TriangleAlert,
  UserRound, Wrench,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { ISLANDS, TRADES } from "@/lib/operations";

interface Property { id: number; name: string; address: string; island: string; propertyType: string; clientName: string; }
interface Contractor { id: number; name: string; trade: string; island: string; phone: string; }

export default function NewInspectionPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    propertyId: "",
    contractorId: "",
    trade: "",
    scheduledFor: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    const res = await adminFetch("/api/admin/overview", { cache: "no-store" }, s);
    if (res.status === 401) { window.location.href = "/admin/access"; return; }
    const data = await safeJson<any>(res) || {};
    setProperties(data.properties ?? []);
    setContractors(data.contractors ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedProperty = properties.find((p) => p.id === Number(form.propertyId));
  const selectedContractor = contractors.find((c) => c.id === Number(form.contractorId));
  const selectedTrade = TRADES.find((t) => t.id === form.trade);
  const effectiveTrade = form.trade || selectedContractor?.trade || "";

  async function submit() {
    if (!form.propertyId || !form.contractorId) {
      setError("Please select both a property and a contractor.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/inspections", {
        method: "POST",
        body: JSON.stringify({
          propertyId: Number(form.propertyId),
          contractorId: Number(form.contractorId),
          trade: effectiveTrade || undefined,
          scheduledFor: form.scheduledFor,
        }),
      });
      const data = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(data.error ?? "Failed to create inspection");
      router.push(`/admin/inspections/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-8">
          <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Field Operations</div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">NEW INSPECTION</h1>
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            Select a property · Assign a contractor · Set trade scope · Dispatch
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ff8a8a]">
            <TriangleAlert className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step 1 — Property */}
            <div className="bcso-panel p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <Building2 className="h-4.5 w-4.5 text-[var(--brand-teal-soft)]" />
                <div className="mono-label !text-[var(--brand-teal-soft)]">Step 1 — Select Property</div>
              </div>
              <select
                className="field !text-[14px]"
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
              >
                <option value="">Choose a client property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.island} ({p.propertyType})
                  </option>
                ))}
              </select>
              {selectedProperty && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--brand-teal)]/15 bg-[var(--brand-teal)]/[0.04] px-4 py-3 text-[12.5px] text-white/70">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[var(--brand-teal-soft)]" />{selectedProperty.address || selectedProperty.island}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-teal-soft)]" />Client: {selectedProperty.clientName}</span>
                </motion.div>
              )}
              {properties.length === 0 && (
                <p className="mt-2 text-xs text-white/35">No properties found. <button onClick={() => router.push("/admin")} className="text-[var(--brand-teal-soft)] hover:underline">Add a property first</button>.</p>
              )}
            </div>

            {/* Step 2 — Contractor */}
            <div className="bcso-panel p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <UserRound className="h-4.5 w-4.5 text-[var(--brand-teal-soft)]" />
                <div className="mono-label !text-[var(--brand-teal-soft)]">Step 2 — Assign Contractor</div>
              </div>
              <select
                className="field !text-[14px]"
                value={form.contractorId}
                onChange={(e) => {
                  const c = contractors.find((x) => x.id === Number(e.target.value));
                  setForm((f) => ({ ...f, contractorId: e.target.value, trade: c?.trade ?? f.trade }));
                }}
              >
                <option value="">Choose a contractor…</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {TRADES.find((t) => t.id === c.trade)?.name ?? c.trade} · {c.island}
                  </option>
                ))}
              </select>
              {selectedContractor && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--brand-teal)]/15 bg-[var(--brand-teal)]/[0.04] px-4 py-3 text-[12.5px] text-white/70">
                  <span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-[var(--brand-teal-soft)]" />{TRADES.find((t) => t.id === selectedContractor.trade)?.name ?? selectedContractor.trade}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[var(--brand-teal-soft)]" />{selectedContractor.island}</span>
                  {selectedContractor.phone && <span>{selectedContractor.phone}</span>}
                </motion.div>
              )}
              {contractors.length === 0 && (
                <p className="mt-2 text-xs text-white/35">No contractors found. <button onClick={() => router.push("/admin/contractors")} className="text-[var(--brand-teal-soft)] hover:underline">Add contractors first</button>.</p>
              )}
            </div>

            {/* Step 3 — Trade & Schedule */}
            <div className="bcso-panel p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <Wrench className="h-4.5 w-4.5 text-[var(--brand-teal-soft)]" />
                <div className="mono-label !text-[var(--brand-teal-soft)]">Step 3 — Trade Scope & Schedule</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mono-label !text-[9px] mb-1.5 block">Inspection trade scope</label>
                  <select
                    className="field !text-[14px]"
                    value={form.trade}
                    onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}
                  >
                    <option value="">{selectedContractor ? `From contractor (${TRADES.find((t) => t.id === selectedContractor.trade)?.name ?? selectedContractor.trade})` : "Select trade…"}</option>
                    {TRADES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {effectiveTrade && (
                    <p className="mono mt-1.5 text-[9px] uppercase tracking-[0.14em] text-[var(--brand-teal-soft)]">
                      Checklist: {TRADES.find((t) => t.id === effectiveTrade)?.name} ({effectiveTrade === "comprehensive" ? "20 items" : "10 items"})
                    </p>
                  )}
                </div>
                <div>
                  <label className="mono-label !text-[9px] mb-1.5 block">Scheduled date</label>
                  <input
                    type="date"
                    className="field !text-[14px]"
                    value={form.scheduledFor}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Summary & dispatch */}
            {form.propertyId && form.contractorId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/[0.05] p-5">
                <div className="mono-label mb-3 !text-[var(--brand-gold-soft)]">Ready to dispatch</div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.16em] text-white/35 mb-0.5">Property</div>
                    <div className="font-medium text-white/90">{selectedProperty?.name}</div>
                    <div className="mono text-[10px] text-white/45">{selectedProperty?.island}</div>
                  </div>
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.16em] text-white/35 mb-0.5">Contractor</div>
                    <div className="font-medium text-white/90">{selectedContractor?.name}</div>
                    <div className="mono text-[10px] text-white/45">{TRADES.find((t) => t.id === selectedContractor?.trade)?.name}</div>
                  </div>
                  <div>
                    <div className="mono text-[9px] uppercase tracking-[0.16em] text-white/35 mb-0.5">Scheduled</div>
                    <div className="font-medium text-white/90">{new Date(form.scheduledFor).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>
                    <div className="mono text-[10px] text-white/45">{TRADES.find((t) => t.id === effectiveTrade)?.name || "Trade from contractor"}</div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => router.push("/admin")} className="btn btn-ghost">Cancel</button>
              <button
                onClick={submit}
                disabled={busy || !form.propertyId || !form.contractorId}
                className="btn btn-primary !px-8 !py-3.5"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Dispatch to contractor portal <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </FieldOpsShell>
  );
}
