"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Check, Clock3, Crosshair, ImagePlus, Loader2, MapPin, Minus,
  Send, ShieldCheck, TriangleAlert, X,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { authHeaders, getSession, setSession, type PortalSession } from "@/lib/portal-client";
import { safeJson } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/risk";
import { tradeById } from "@/lib/operations";
import type { ChecklistItemRow, InspectionRow, ItemStatus, PropertyRow } from "@/db/schema";

const SEV_META: Record<string, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ff8a8a]" },
  major: { label: "Major", cls: "border-[#f97316]/50 bg-[#f97316]/10 text-[#ffb37a]" },
  minor: { label: "Minor", cls: "border-white/15 bg-white/5 text-white/50" },
};

type LoadState = "loading" | "ready" | "forbidden" | "error";

export default function PortalInspectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session] = useState<PortalSession | null>(() => getSession());
  const [state, setState] = useState<LoadState>("loading");
  const [inspection, setInspection] = useState<InspectionRow | null>(null);
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [items, setItems] = useState<ChecklistItemRow[]>([]);
  const [docType, setDocType] = useState<'standard' | 'reinspection'>('standard');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const geoRef = useRef<GeolocationPosition | null | "denied">(null);
  const [uploadingItem, setUploadingItem] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const editable = inspection ? ["assigned", "in_progress", "returned"].includes(inspection.status) : false;

  const load = useCallback(async (s: PortalSession) => {
    const res = await fetch(`/api/portal/inspections/${params.id}`, { headers: authHeaders(s), cache: "no-store" });
    if (res.status === 401) {
      setSession(null);
      router.push("/portal");
      return;
    }
    if (res.status === 404) { setState("forbidden"); return; }
    const data = await safeJson<any>(res) || {};
    setInspection(data.inspection);
    setProperty(data.property);
    setItems(data.items);
    setDocType(data.type || 'standard');
    setState("ready");
  }, [params.id, router]);

  useEffect(() => {
    if (!session) { router.push("/portal"); return; }
    load(session);
  }, [session, load, router]);

  async function patch(action: "start" | "save" | "submit", itemPatches?: { id: number; status: ItemStatus; note: string }[]) {
    if (!session) return null;
    const res = await fetch(`/api/portal/inspections/${params.id}`, {
      method: "PATCH",
      headers: authHeaders(session),
      body: JSON.stringify({
        action,
        items: itemPatches ?? items.map((i) => ({ id: i.id, status: i.status as ItemStatus, note: i.note })),
      }),
    });
    return res;
  }

  async function start() {
    setBusyAction("start");
    await patch("start");
    if (session) await load(session);
    setBusyAction(null);
  }

  async function save() {
    setBusyAction("save");
    setNotice(null);
    const res = await patch("save");
    setBusyAction(null);
    setNotice(res?.ok ? { kind: "ok", text: "Progress saved." } : { kind: "error", text: "Save failed — try again." });
    setTimeout(() => setNotice(null), 2500);
  }

  async function submit() {
    if (!window.confirm("Submit this inspection for coordinator review? It will become read-only until reviewed.")) return;
    setBusyAction("submit");
    setNotice(null);
    const res = await patch("submit");
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) {
      setNotice({ kind: "ok", text: `Submitted — compliance score ${data.score}. Awaiting coordinator review.` });
      if (session) await load(session);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setNotice({ kind: "error", text: data.error ?? "Submission failed." });
    }
    setBusyAction(null);
  }

  function setItemStatus(id: number, status: ItemStatus) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    // persist immediately for smooth mobile use
    if (editable) {
      const found = items.find((i) => i.id === id);
      if (found) patch("save", [{ id, status, note: found.note }]);
    }
  }

  function setItemNote(id: number, note: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, note } : i)));
  }

  async function ensureGeo(): Promise<GeolocationPosition | null> {
    if (geoRef.current === "denied") return null;
    if (geoRef.current) return geoRef.current;
    return new Promise((resolve) => {
      if (!navigator.geolocation) { geoRef.current = "denied"; resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { geoRef.current = pos; resolve(pos); },
        () => { geoRef.current = "denied"; resolve(null); },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  async function compressImage(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.72);
  }

  async function capturePhoto(itemId: number, file: File) {
    if (!session) return;
    setUploadingItem(itemId);
    setNotice(null);
    try {
      const [dataUrl, pos] = await Promise.all([compressImage(file), ensureGeo()]);
      const res = await fetch(`/api/portal/inspections/${params.id}/photos`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify({
          itemId,
          dataUrl,
          caption: items.find((i) => i.id === itemId)?.note?.slice(0, 120) || "Field evidence",
          takenAt: new Date().toISOString(),
          lat: pos?.coords.latitude ?? null,
          lng: pos?.coords.longitude ?? null,
          accuracy: pos?.coords.accuracy ?? null,
        }),
      });
      const data = await safeJson<any>(res) || {};
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, photos: [...i.photos, data.photo] } : i)));
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "Photo upload failed." });
    } finally {
      setUploadingItem(null);
      if (fileInputs.current[itemId]) fileInputs.current[itemId]!.value = "";
    }
  }

  if (state !== "ready" || !inspection || !property) {
    return (
      <FieldOpsShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          {state === "loading" ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#22d3ee]" />
          ) : (
            <>
              <TriangleAlert className="h-6 w-6 text-[#ffb000]" />
              <p className="text-sm text-white/50">Inspection not available for your account.</p>
            </>
          )}
        </div>
      </FieldOpsShell>
    );
  }

  const trade = tradeById(inspection.trade);
  const answered = items.filter((i) => i.status !== "pending").length;
  const fails = items.filter((i) => i.status === "fail");
  const photoCount = items.reduce((n, i) => n + i.photos.length, 0);

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-2xl px-4 pb-40 pt-6 md:px-8">
        <button onClick={() => router.push("/portal")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[#67e8f9]">
          <ArrowLeft className="h-3.5 w-3.5" /> All assignments
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0f13] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/35">{inspection.code} · {trade.name}</div>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">{property.name}</h1>
              <div className="mono mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#22d3ee]" />{property.address || property.island}</span>
                <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Due {inspection.scheduledFor ? formatDate(inspection.scheduledFor) : "—"}</span>
              </div>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 text-[#22d3ee]" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 text-center">
            {[
              [`${answered}/${items.length}`, "Answered"],
              [String(fails.length), "Findings"],
              [String(photoCount), "Photos"],
            ].map(([v, k]) => (
              <div key={k} className="bg-[#0b0f13] px-2 py-2.5">
                <div className="font-display text-lg text-[#67e8f9]">{v}</div>
                <div className="mono text-[8.5px] uppercase tracking-[0.16em] text-white/35">{k}</div>
              </div>
            ))}
          </div>

          {inspection.status === "returned" && inspection.adminNote && (
            <div className="mt-4 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.07] px-3.5 py-3 text-sm leading-relaxed text-[#ffb3b3]">
              <span className="mono mr-2 text-[9px] font-bold uppercase tracking-wider">Returned by coordinator:</span>
              {inspection.adminNote}
            </div>
          )}
          {inspection.status === "pending_review" && (
            <div className="mt-4 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-3 text-sm text-white/60">
              Submitted {inspection.submittedAt ? formatDate(inspection.submittedAt.toString()) : ""}. Awaiting coordinator verification — this file is read-only.
            </div>
          )}
          {inspection.status === "approved" && (
            <div className="mt-4 rounded-lg border border-[#22bf6b]/30 bg-[#22bf6b]/[0.07] px-3.5 py-3 text-sm text-[#7cebab]">
              Approved by the coordinator. Compliance score {inspection.complianceScore}. Report {inspection.reportNo}.
            </div>
          )}
        </div>

        {/* Start gate */}
        {inspection.status === "assigned" && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={start}
            disabled={busyAction !== null}
            className="btn btn-primary mt-5 w-full !py-5 !text-sm"
            style={{ background: "#22d3ee" }}
          >
            {busyAction === "start" ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Begin on-site inspection <Check className="h-4.5 w-4.5" strokeWidth={3} /></>}
          </motion.button>
        )}

        {/* Checklist */}
        {inspection.status !== "assigned" && (
          <div className="mt-6 space-y-4">
            {items.map((item, idx) => {
              const sev = SEV_META[item.severity] ?? SEV_META.major;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
                  className={`overflow-hidden rounded-2xl border bg-[#0b0f13] transition-colors ${
                    item.status === "fail" ? "border-[#ef4444]/35" : item.status === "pass" ? "border-[#22bf6b]/25" : "border-white/10"
                  }`}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <span className="font-display w-7 shrink-0 pt-0.5 text-lg text-white/20">{String(idx + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className={`mono rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] ${sev.cls}`}>{sev.label}</span>
                          {item.status === "fail" && (
                            <span className="mono rounded-full border border-[#ef4444]/50 bg-[#ef4444]/10 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#ff8a8a]">
                              {docType === 'reinspection' ? "STILL FAILED" : "REPAIR NEEDED"}
                            </span>
                          )}
                          {item.status === "fail" && item.photos.length === 0 && (
                            <span className="mono rounded-full border border-[#ef4444]/50 bg-[#ef4444]/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-[#ff8a8a]">
                              Photo required
                            </span>
                          )}
                          {item.status === "pass" && docType === "reinspection" && item.photos.length === 0 && (
                            <span className="mono rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] text-[var(--brand-gold)]">
                              Repair photo required
                            </span>
                          )}
                        </div>
                        <p className="text-[14.5px] leading-snug text-white/90">{item.label}</p>
                        <p className="mono mt-2 text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[#67e8f9]/60">{item.requirement}</p>
                      </div>
                    </div>

                    {/* Result control */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {(["pass", "fail", "na"] as const).map((s) => {
                        const active = item.status === s;
                        const styles =
                          s === "pass"
                            ? active ? "border-[#22bf6b] bg-[#22bf6b]/15 text-[#3ce38e]" : "border-white/12 text-white/45"
                            : s === "fail"
                              ? active ? "border-[#ef4444] bg-[#ef4444]/15 text-[#ff8a8a]" : "border-white/12 text-white/45"
                              : active ? "border-white/60 bg-white/10 text-white/85" : "border-white/12 text-white/45";
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={!editable}
                            onClick={() => setItemStatus(item.id, s)}
                            className={`mono flex items-center justify-center gap-1.5 rounded-xl border px-2 py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${styles} ${!editable ? "opacity-60" : "active:scale-[0.97]"}`}
                          >
                            {s === "pass" ? <Check className="h-4 w-4" strokeWidth={3} /> : s === "fail" ? <X className="h-4 w-4" strokeWidth={3} /> : <Minus className="h-4 w-4" strokeWidth={3} />}
                            {s === "na" ? "N/A" : s === "fail" ? (docType === 'reinspection' ? "STILL FAILED" : "REPAIR NEEDED") : s === "pass" ? (docType === 'reinspection' ? "REPAIRED" : "PASS") : s}
                          </button>
                        );
                      })}
                    </div>

                    {/* Finding note + photos */}
                    <AnimatePresence initial={false}>
                      {item.status === "fail" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                          <textarea
                            className="field mt-3 !min-h-[64px] !text-[13.5px] !border-[#ef4444]/40"
                            placeholder="State Repair: What remediation is needed? (This populates the client report)..."
                            value={item.note}
                            disabled={!editable}
                            onChange={(e) => setItemNote(item.id, e.target.value)}
                            onBlur={() => editable && patch("save", [{ id: item.id, status: item.status as ItemStatus, note: item.note }])}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Evidence */}
                    <div className="mt-3">
                      {item.photos.length > 0 && (
                        <div className="mb-2.5 grid grid-cols-2 gap-2">
                          {item.photos.map((p) => (
                            <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.dataUrl} alt={p.caption} className="aspect-[3/2] w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6">
                                <div className="mono flex items-center gap-1 text-[8px] uppercase tracking-wider text-white/80">
                                  <Clock3 className="h-2.5 w-2.5" /> {new Date(p.takenAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div className="mono flex items-center gap-1 text-[8px] uppercase tracking-wider text-[#67e8f9]">
                                  <Crosshair className="h-2.5 w-2.5" />
                                  {p.lat != null && p.lng != null ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "No GPS fix"}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                      {editable && (
                        <>
                          <input
                            ref={(el) => { fileInputs.current[item.id] = el; }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) capturePhoto(item.id, f);
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingItem === item.id}
                            onClick={() => fileInputs.current[item.id]?.click()}
                            className={`mono flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                              (item.status === "fail" || (docType === "reinspection" && item.status === "pass")) && item.photos.length === 0
                                ? "border-[#ef4444]/50 text-[#ff8a8a] hover:bg-[#ef4444]/10"
                                : "border-white/20 text-white/50 hover:border-[var(--brand-teal)]/60 hover:text-[var(--brand-teal-soft)]"
                            }`}
                          >
                            {uploadingItem === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : item.photos.length === 0 ? <Camera className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                            {uploadingItem === item.id ? "Uploading evidence…" : item.photos.length === 0 ? "Capture photo (time + GPS stamped)" : `Add photo (${item.photos.length}/4)`}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {notice && (
          <div className={`fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${
            notice.kind === "ok" ? "border-[#22bf6b]/50 bg-[#0b1f14]/95 text-[#7cebab]" : "border-[#ef4444]/50 bg-[#260d0d]/95 text-[#ffb3b3]"
          }`}>
            {notice.text}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {editable && inspection.status !== "assigned" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07090c]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 py-3.5 md:px-8">
            <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#22d3ee] transition-all duration-500" style={{ width: `${items.length ? (answered / items.length) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center gap-3">
              <span className="mono flex-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
                {answered}/{items.length} answered{fails.length > 0 ? ` · ${fails.length} findings` : ""}
              </span>
              <button onClick={save} disabled={busyAction !== null} className="btn btn-ghost !px-4 !py-2.5">
                {busyAction === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
              </button>
              <button onClick={submit} disabled={busyAction !== null || answered < items.length} className="btn btn-primary !px-5 !py-2.5" style={{ background: "#22d3ee" }}>
                {busyAction === "submit" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submit for review
              </button>
            </div>
          </div>
        </div>
      )}
    </FieldOpsShell>
  );
}
