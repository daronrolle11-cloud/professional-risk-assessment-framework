"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, UserPlus, Search, Filter, ShieldCheck, 
  Award, QrCode, MapPin, MoreHorizontal, Trash2, TriangleAlert,
  Plus, Check, X, Loader2, UserRound, Printer
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { BrandLogo } from "@/components/risk-badge";

const TRADES = [
  "General Laborer", "Carpenter", "Mason", "Electrician", "Plumber", 
  "Welder", "Crane Operator", "Scaffolder", "Marine Mechanic"
];

export default function WorkerRegistry() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badgeModal, setBadgeModal] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    trade: "General Laborer",
    employer: "",
    dob: "",
    nationality: "Bahamian",
    primaryLanguage: "English",
  });

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    try {
      const res = await adminFetch("/api/admin/workers", { cache: "no-store" }, s);
      const data = await safeJson<any[]>(res);
      if (res.ok && data) {
        setWorkers(data);
      }
    } catch (e) {
      setError("Failed to load workers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function registerWorker() {
    if (!form.name.trim() || !form.employer.trim()) return;
    setFormBusy(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/workers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await safeJson<any>(res);
      if (res.ok && data) {
        setShowForm(false);
        setForm({ name: "", trade: "General Laborer", employer: "", dob: "", nationality: "Bahamian", primaryLanguage: "English" });
        await load();
        setBadgeModal(data.worker);
      } else {
        throw new Error(data?.error ?? "Registration failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register");
    } finally {
      setFormBusy(false);
    }
  }

  async function deleteWorker(id: number) {
    if (!window.confirm("Permanently remove this worker from the registry?")) return;
    setBusy(id);
    try {
      const res = await adminFetch(`/api/admin/workers/${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch (e) {
      alert("Failed to delete worker");
    } finally {
      setBusy(null);
    }
  }

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Workforce Intelligence</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">WORKER REGISTRY</h1>
            <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Training Records · QR Credentials · PPE Issuance
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <UserPlus className="h-4 w-4" /> Register Worker
          </button>
        </div>
        
        {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#F87171]"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-6">
              <div className="bcso-panel p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="mono-label !text-[var(--brand-gold)]">Register New Worker</div>
                  <button onClick={() => { setShowForm(false); setError(null); }}><X className="h-4 w-4 text-white/50" /></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Full name *</div>
                    <input className="field" placeholder="e.g. Ricardo Johnson" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Employer / Subcontractor *</div>
                    <input className="field" placeholder="e.g. SunPower Bahamas" value={form.employer} onChange={(e) => setForm((f) => ({ ...f, employer: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Trade *</div>
                    <select className="field" value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}>
                      {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Date of Birth</div>
                    <input type="date" className="field" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Nationality</div>
                    <input className="field" value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Primary Language</div>
                    <select className="field" value={form.primaryLanguage} onChange={(e) => setForm((f) => ({ ...f, primaryLanguage: e.target.value }))}>
                      <option value="English">English</option>
                      <option value="Haitian Creole">Haitian Creole</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-white/40">A unique QR code badge will be generated for scanning on site.</p>
                  <button onClick={registerWorker} disabled={formBusy || !form.name.trim() || !form.employer.trim()} className="btn btn-primary !px-6">
                    {formBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register & Generate Badge"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              { k: "Total Workers", v: "847", c: "#efede8" },
              { k: "Fully Compliant", v: "792", c: "#4ADE80" },
              { k: "Certs Expiring", v: "34", c: "#EAB308" },
              { k: "Non-Compliant", v: "21", c: "#F87171" },
            ].map((s) => (
              <div key={s.k} className="bg-[var(--brand-navy-deep)] px-5 py-4">
                <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
                <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
              </div>
            ))}
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
          <Search className="h-4 w-4 text-white/35" />
          <input 
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" 
            placeholder="Search workers by name, trade or employer…" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <button className="btn btn-ghost !py-1.5 !px-3 !text-[10px]">
            <Filter className="h-3 w-3" /> Filters
          </button>
        </div>

        {loading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-teal)]" /></div>
        ) : (
            <div className="space-y-3">
                {workers.map(worker => (
                    <div key={worker.id} className="bcso-panel p-4 flex items-center justify-between group hover:border-[var(--brand-teal)]/40 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                <UserRound className="h-6 w-6 text-white/20" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-white/90">{worker.name}</h3>
                                    <span className={`mono text-[8px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                        worker.status === 'compliant' ? 'border-green-500/40 bg-green-500/10 text-green-400' :
                                        worker.status === 'expiring' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' :
                                        'border-red-500/40 bg-red-500/10 text-red-400'
                                    }`}>{worker.status}</span>
                                </div>
                                <div className="mono text-[10px] text-white/40 mt-1 uppercase tracking-wide">
                                    {worker.trade} · {worker.employer}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                            <div className="hidden sm:block">
                                <div className="font-display text-xl text-white/80">{worker.certs}</div>
                                <div className="mono text-[8px] text-white/30 uppercase">Active Certs</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setBadgeModal(worker)} className="btn btn-ghost !p-2" title="Show QR Badge"><QrCode className="h-4 w-4" /></button>
                                <button onClick={() => alert("Training Logs are scheduled for Phase 2 rollout.")} className="btn btn-ghost !p-2" title="View Training Log"><Award className="h-4 w-4" /></button>
                                <button onClick={() => deleteWorker(worker.id)} className="btn btn-ghost !p-2 hover:!border-[#ef4444]/60 hover:!text-[#ff8a8a]"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* QR Badge Modal */}
      <AnimatePresence>
        {badgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] p-6 shadow-2xl text-center">
              <button onClick={() => setBadgeModal(null)} className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
              <div className="mb-4">
                <BrandLogo className="h-10 w-auto mx-auto" />
              </div>
              <h3 className="font-display text-2xl uppercase tracking-wide">{badgeModal.name}</h3>
              <div className="mono text-[10px] uppercase text-[var(--brand-teal-soft)] mt-1">{badgeModal.trade} · {badgeModal.employer}</div>
              
              <div className="my-6 bg-white p-4 rounded-xl inline-block">
                {/* Mock QR Code visual */}
                <div className="w-48 h-48 bg-white flex flex-col items-center justify-center border-4 border-black relative">
                  <div className="absolute top-2 left-2 w-12 h-12 border-t-4 border-l-4 border-black" />
                  <div className="absolute top-2 right-2 w-12 h-12 border-t-4 border-r-4 border-black" />
                  <div className="absolute bottom-2 left-2 w-12 h-12 border-b-4 border-l-4 border-black" />
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiPjwvcmVjdD4KPC9zdmc+')] opacity-80 mix-blend-multiply" />
                  <div className="absolute bg-white px-2 py-1 font-bold text-black border-2 border-black">{badgeModal.qrCode.split('-')[1]}</div>
                </div>
              </div>
              
              <div className="mono font-bold text-xl tracking-[0.2em]">{badgeModal.qrCode}</div>
              
              <div className="mt-6 flex gap-3 border-t border-white/10 pt-5">
                <button onClick={() => window.print()} className="btn btn-primary flex-1"><Printer className="h-4 w-4" /> Print Badge ID</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FieldOpsShell>
  );
}
