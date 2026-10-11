"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Camera, Check, Clock, FileText, Loader2, MapPin, 
  Printer, ShieldCheck, Trash2, TriangleAlert, User, X, ImagePlus
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/risk";
import { SignaturePad } from "@/components/signature-pad";
import { IncidentInvestigationDoc } from "@/components/incident-investigation-doc";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [rootCause, setRootCause] = useState("");

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    try {
      const res = await adminFetch(`/api/admin/incidents/${params.id}`, {}, s);
      const payload = await safeJson<any>(res);
      if (res.ok && payload) {
        setData(payload);
        setRootCause(payload.incident.rootCause || "");
      } else {
        setError("Incident not found.");
      }
    } catch (e) {
      setError("Failed to load incident.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function updateIncident(updates: any) {
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/incidents/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await load();
      } else {
        const d = await safeJson<any>(res);
        alert(d?.error || "Update failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSign(signatureData: string) {
    setShowSignature(false);
    await updateIncident({ signatureData, status: "closed", rootCause });
    alert("Investigation finalized and signed. Invoice generated.");
  }

  async function onPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app we'd upload to S3, here we convert to base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const newPhoto = {
        id: crypto.randomUUID(),
        dataUrl,
        caption: "Investigation Evidence",
        takenAt: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
      };
      const photos = [...(data.incident.photos || []), newPhoto];
      await updateIncident({ photos });
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <FieldOpsShell><div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[var(--brand-teal)]" /></div></FieldOpsShell>;
  if (error || !data) return <FieldOpsShell><div className="p-10 text-center">{error || "Not found"}</div></FieldOpsShell>;

  const { incident, site } = data;
  const isClosed = incident.status === "closed";

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin/incidents")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Incidents
        </button>

        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="mono text-xs font-bold text-[var(--brand-gold)]">{incident.incidentNo}</div>
                    <span className="mono rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/60">{incident.status}</span>
                </div>
                <h1 className="font-display text-4xl tracking-wide">{site.name}</h1>
                <p className="text-white/50 flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-[var(--brand-teal-soft)]" /> {incident.location} · {site.island}
                </p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setShowReport(true)} className="btn btn-ghost !px-6">
                    <FileText className="h-4 w-4" /> Preview Report
                </button>
                {!isClosed && (
                    <button onClick={() => setShowSignature(true)} className="btn btn-primary !bg-[#22C55E] !border-[#22C55E]">
                        <ShieldCheck className="h-4 w-4" /> Finalize & Sign
                    </button>
                )}
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div className="bcso-panel p-6">
                    <div className="mono-label mb-4 !text-[var(--brand-teal-soft)]">Incident Details</div>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <div className="mono text-[10px] uppercase text-white/30 mb-1">Classification</div>
                            <div className="font-bold text-white/90">{incident.classification}</div>
                        </div>
                        <div>
                            <div className="mono text-[10px] uppercase text-white/30 mb-1">Date & Time</div>
                            <div className="font-bold text-white/90">{new Date(incident.date).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="mono text-[10px] uppercase text-white/30 mb-1">Narrative Description</div>
                    <p className="text-white/70 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">{incident.description}</p>
                </div>

                {/* Root Cause Analysis */}
                <div className="bcso-panel p-6">
                    <div className="mono-label mb-4 !text-[var(--brand-gold)]">Root Cause Analysis</div>
                    <textarea 
                        className="field !min-h-[120px]" 
                        placeholder="Determine the root cause of this event..."
                        value={rootCause}
                        disabled={isClosed}
                        onChange={(e) => setRootCause(e.target.value)}
                        onBlur={() => !isClosed && updateIncident({ rootCause })}
                    />
                </div>

                {/* Photo Evidence */}
                <div className="bcso-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="mono-label !text-[var(--brand-teal-soft)]">Evidence Gallery</div>
                        {!isClosed && (
                            <label className="btn btn-ghost !py-1.5 !px-3 !text-[10px] cursor-pointer">
                                <ImagePlus className="h-3.5 w-3.5" /> Add Photo
                                <input type="file" accept="image/*" className="hidden" onChange={onPhotoUpload} />
                            </label>
                        )}
                    </div>
                    {incident.photos && incident.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                            {incident.photos.map((p: any) => (
                                <div key={p.id} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square">
                                    <img src={p.dataUrl} alt={p.caption} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={async () => {
                                            if(!confirm("Remove photo?")) return;
                                            const photos = incident.photos.filter((x: any) => x.id !== p.id);
                                            await updateIncident({ photos });
                                        }} className="p-2 bg-red-500 rounded-full text-white">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-xl text-white/20 italic text-sm">
                            No evidence photos attached.
                        </div>
                    )}
                </div>
            </div>

            <aside className="space-y-6">
                <div className="bcso-panel p-5">
                    <div className="mono-label mb-4">Audit Trail</div>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-white/30" />
                            </div>
                            <div>
                                <div className="text-xs text-white/80">Report Logged</div>
                                <div className="text-[10px] text-white/40">{formatDate(incident.date)}</div>
                            </div>
                        </div>
                        {incident.signatureData && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-4 w-4 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-white/80">Signed & Finalized</div>
                                    <div className="text-[10px] text-white/40">{incident.signedAt ? new Date(incident.signedAt).toLocaleString() : "—"}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bcso-panel p-5 bg-gradient-to-br from-[#0a2340] to-black border-[var(--brand-teal)]/20">
                    <div className="mono-label mb-3 !text-[var(--brand-teal-soft)]">Administrative Fee</div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Investigation Fee</span>
                        <span className="font-bold text-white">$150.00 BSD</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-3 italic leading-relaxed">
                        Automatic invoice is generated upon finalization and signature of this investigation file.
                    </p>
                </div>
            </aside>
        </div>

        {/* Signature Pad */}
        <AnimatePresence>
            {showSignature && (
                <SignaturePad 
                    onCancel={() => setShowSignature(false)} 
                    onSave={onSign} 
                    title="Investigator's Attestation" 
                />
            )}
        </AnimatePresence>

        {/* Report Preview Modal */}
        <AnimatePresence>
            {showReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-4 md:p-10">
                    <div className="mx-auto max-w-5xl mb-6 flex justify-between items-center no-print">
                        <div className="mono text-[10px] text-white/40 uppercase tracking-widest">Case File: {incident.incidentNo}</div>
                        <div className="flex gap-3">
                            <button onClick={() => window.print()} className="btn btn-primary"><Printer className="h-4 w-4" /> Print PDF</button>
                            <button onClick={() => setShowReport(false)} className="btn btn-ghost !p-2"><X className="h-5 w-5" /></button>
                        </div>
                    </div>
                    <div className="mx-auto max-w-4xl shadow-2xl">
                        <IncidentInvestigationDoc incident={incident} site={site} />
                    </div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </FieldOpsShell>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, FileText, Loader2, MapPin, Printer, ShieldCheck, 
  Trash2, TriangleAlert, Clock, Check, Camera, ImagePlus 
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { adminFetch, getSession, safeJson } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/risk";
import { SignaturePad } from "@/components/signature-pad";
import { IncidentInvestigationDoc } from "@/components/incident-investigation-doc";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [rootCause, setRootCause] = useState("");

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) { window.location.href = "/admin/access"; return; }
    try {
      const res = await adminFetch(`/api/admin/incidents/${params.id}`, {}, s);
      const payload = await safeJson<any>(res);
      if (res.ok && payload) {
        setData(payload);
        setRootCause(payload.incident.rootCause || "");
      } else {
        setError("Incident record not found in database.");
      }
    } catch (e) {
      setError("Failed to load incident documentation registry.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function updateIncident(updates: any) {
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/incidents/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await load();
      } else {
        const d = await safeJson<any>(res);
        alert(d?.error || "Update operation failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSign(signatureData: string) {
    setShowSignature(false);
    await updateIncident({ signatureData, status: "closed", rootCause });
    alert("Investigation finalized and signed. Ministry notification logged.");
  }

  async function onPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const newPhoto = {
        id: crypto.randomUUID(),
        dataUrl,
        caption: "Investigation Site Evidence",
        takenAt: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
      };
      const photos = [...(data.incident.photos || []), newPhoto];
      await updateIncident({ photos });
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <FieldOpsShell><div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[var(--brand-teal)]" /></div></FieldOpsShell>;
  if (error || !data) return <FieldOpsShell><div className="p-10 text-center text-red-400">{error || "Not found"}</div></FieldOpsShell>;

  const { incident, site } = data;
  const isClosed = incident.status === "closed";

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin/incidents")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Incidents
        </button>
        
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="mono text-xs font-bold text-[var(--brand-gold)]">{incident.incidentNo}</div>
              <span className="mono rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/60">{incident.status}</span>
            </div>
            <h1 className="font-display text-4xl tracking-wide">{site.name}</h1>
            <p className="text-white/50 flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 text-[var(--brand-teal-soft)]" /> {incident.location} — {site.island}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReport(true)} className="btn btn-ghost !px-6">
              <FileText className="h-4 w-4" /> Preview Report
            </button>
            {!isClosed && (
              <button onClick={() => setShowSignature(true)} className="btn btn-primary !bg-[#22C55E] !border-[#22C55E]">
                <ShieldCheck className="h-4 w-4" /> Finalize &amp; Sign
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bcso-panel p-6">
              <div className="mono-label mb-4 !text-[var(--brand-teal-soft)]">Incident Details</div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="mono text-[10px] uppercase text-white/30 mb-1">Classification</div>
                  <div className="font-bold text-white/90">{incident.classification}</div>
                </div>
                <div>
                  <div className="mono text-[10px] uppercase text-white/30 mb-1">Date &amp; Time</div>
                  <div className="font-bold text-white/90">{new Date(incident.date).toLocaleString()}</div>
                </div>
              </div>
              <div className="mono text-[10px] uppercase text-white/30 mb-1">Narrative Description</div>
              <p className="text-white/70 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">{incident.description}</p>
            </div>

            <div className="bcso-panel p-6">
              <div className="mono-label mb-4 !text-[var(--brand-gold)]">Root Cause Analysis</div>
              <textarea 
                className="field !min-h-[120px]" 
                placeholder="Determine the contributing factors under Ministry OSH standards..."
                value={rootCause}
                disabled={isClosed}
                onChange={(e) => setRootCause(e.target.value)}
                onBlur={() => !isClosed && updateIncident({ rootCause })}
              />
            </div>

            <div className="bcso-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="mono-label !text-[var(--brand-teal-soft)]">Evidence Gallery</div>
                {!isClosed && (
                  <label className="btn btn-ghost !py-1.5 !px-3 !text-[10px] cursor-pointer">
                    <ImagePlus className="h-3.5 w-3.5" /> Add Photo
                    <input type="file" accept="image/*" className="hidden" onChange={onPhotoUpload} />
                  </label>
                )}
              </div>
              {incident.photos && incident.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {incident.photos.map((p: any) => (
                    <div key={p.id} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square">
                      <img src={p.dataUrl} alt={p.caption} className="w-full h-full object-cover" />
                      {!isClosed && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={async () => {
                            if(!confirm("Remove photo evidence?")) return;
                            const photos = incident.photos.filter((x: any) => x.id !== p.id);
                            await updateIncident({ photos });
                          }} className="p-2 bg-red-500 rounded-full text-white">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-xl text-white/20 italic text-sm">
                  No photographic scene evidence attached.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bcso-panel p-5">
              <div className="mono-label mb-4">Audit Trail</div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-white/33" />
                  </div>
                  <div>
                    <div className="text-xs text-white/80">Case Registered</div>
                    <div className="text-[10px] text-white/40">{formatDate(incident.date)}</div>
                  </div>
                </div>
                {incident.signatureData && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-white/80">Signed &amp; Finalized</div>
