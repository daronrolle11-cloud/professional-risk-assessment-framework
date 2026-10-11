"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Building2, FileCheck2, FileText, Layers, Loader2, Save, Search, SlidersHorizontal, Check,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { IndustryStep, DetailsStep } from "@/components/wizard/steps-1";
import { HazardsStep, EvaluateStep } from "@/components/wizard/steps-2";
import { ControlsStep, ReviewStep } from "@/components/wizard/steps-3";
import { bahamasRefsFor, compileRegulations, HAZARD_LIBRARY, templateToDraft } from "@/lib/data";
import { adminFetch, safeJson } from "@/lib/admin-fetch";
import { emptyHazard } from "@/lib/types";
import { scoreOf } from "@/lib/risk";
import { SignaturePad } from "@/components/signature-pad";
import type { AssessmentForm, HazardDraft, HazardTemplate } from "@/lib/types";
import type { AssessmentRow, HazardRow } from "@/db/schema";

const STEPS = [
  { id: "industry", label: "Industry & Task", icon: Building2 },
  { id: "details", label: "Document Header", icon: FileText },
  { id: "hazards", label: "Identify Hazards", icon: Search },
  { id: "evaluate", label: "Evaluate Risk", icon: SlidersHorizontal },
  { id: "controls", label: "Controls & Actions", icon: Layers },
  { id: "review", label: "Review & Issue", icon: FileCheck2 },
];

function initialForm(): AssessmentForm {
  return {
    industry: "office",
    activity: "",
    organization: "",
    department: "",
    location: "",
    assessmentNo: "",
    assessmentDate: new Date().toISOString().slice(0, 10),
    reviewDate: new Date(Date.now() + 182 * 86400000).toISOString().slice(0, 10),
    assessor: "",
    responsibleManager: "",
    employeesExposed: "",
    jurisdiction: "bahamas-intl",
    status: "draft",
    regulations: "",
    hazards: [],
  };
}

function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");

  const [form, setForm] = useState<AssessmentForm>(initialForm);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState<"draft" | "issued" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [loadedEdit, setLoadedEdit] = useState(false);

  // Assessment number for fresh assessments
  useEffect(() => {
    if (editId) return;
    (async () => {
      try {
        const res = await adminFetch("/api/assessments", { cache: "no-store" });
        const list: AssessmentRow[] = res.ok ? await res.json() : [];
        const year = new Date().getFullYear();
        const maxSuffix = list.reduce((m, a) => {
          const match = a.assessmentNo.match(/(\d+)$/);
          return match ? Math.max(m, parseInt(match[1], 10)) : m;
        }, 0);
        setForm((f) => (f.assessmentNo ? f : { ...f, assessmentNo: `RA-${year}-${String(maxSuffix + 1).padStart(4, "0")}` }));
      } catch {
        setForm((f) => (f.assessmentNo ? f : { ...f, assessmentNo: `RA-${new Date().getFullYear()}-0001` }));
      }
    })();
  }, [editId]);

  // Edit mode — load existing
  useEffect(() => {
    if (!editId || loadedEdit) return;
    (async () => {
      const res = await adminFetch(`/api/assessments/${editId}`);
      if (!res.ok) return;
      const data: { assessment: AssessmentRow; hazards: HazardRow[] } = await res.json();
      const a = data.assessment;
      setForm({
        industry: a.industry,
        activity: a.activity,
        organization: a.organization,
        department: a.department,
        location: a.location,
        assessmentNo: a.assessmentNo,
        assessmentDate: a.assessmentDate,
        reviewDate: a.reviewDate,
        assessor: a.assessor,
        responsibleManager: a.responsibleManager,
        employeesExposed: String(a.employeesExposed ?? ""),
        jurisdiction: (a.jurisdiction as AssessmentForm["jurisdiction"]) ?? "bahamas-intl",
        status: (a.status as AssessmentForm["status"]) ?? "draft",
        regulations: a.regulations,
        hazards: data.hazards.map((h) => {
          const tpl = HAZARD_LIBRARY.find((t) => t.description === h.description);
          return {
            uid: crypto.randomUUID(),
            category: h.category,
            description: h.description,
            personsAtRisk: h.personsAtRisk,
            existingControls: h.existingControls,
            likelihood: h.likelihood,
            severity: h.severity,
            controls: h.controls,
            responsiblePerson: h.responsiblePerson,
            dueDate: h.dueDate,
            residualLikelihood: h.residualLikelihood,
            residualSeverity: h.residualSeverity,
            bahamasRefs: tpl ? bahamasRefsFor(tpl.key) : [],
            oshaRefs: tpl ? [...tpl.oshaRefs] : [],
            hseRefs: tpl ? [...tpl.hseRefs] : [],
          };
        }),
      });
      setLoadedEdit(true);
    })();
  }, [editId, loadedEdit]);

  const patch = (p: Partial<AssessmentForm>) => setForm((f) => ({ ...f, ...p }));
  const updateHazard = (uid: string, p: Partial<HazardDraft>) =>
    setForm((f) => ({ ...f, hazards: f.hazards.map((h) => (h.uid === uid ? { ...h, ...p } : h)) }));
  const addFromTemplate = (t: HazardTemplate) => setForm((f) => ({ ...f, hazards: [...f.hazards, templateToDraft(t)] }));
  const addCustom = () => setForm((f) => ({ ...f, hazards: [...f.hazards, emptyHazard()] }));
  const removeHazard = (uid: string) => setForm((f) => ({ ...f, hazards: f.hazards.filter((h) => h.uid !== uid) }));

  const stepValid = useMemo(() => {
    switch (step) {
      case 0: return Boolean(form.industry) && form.activity.trim().length > 2;
      case 1: return form.organization.trim().length > 1 && form.assessmentNo.trim().length > 0;
      case 2: return form.hazards.length > 0;
      case 3: return form.hazards.every((h) => h.description.trim().length > 2);
      case 4: return true;
      default: return true;
    }
  }, [step, form]);

  function goTo(next: number) {
    if (next === 5 && !form.regulations.trim()) {
      patch({ regulations: compileRegulations(form.jurisdiction, form.hazards) });
    }
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(status: "draft" | "issued", signatureData?: string) {
    if (status === "issued" && !signatureData) {
      setShowSignature(true);
      return;
    }
    
    setSaving(status);
    setError(null);
    const payload: AssessmentForm = { ...form, status, signatureData };
    try {
      const res = await adminFetch(editId ? `/api/assessments/${editId}` : "/api/assessments", {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || !data) throw new Error(data?.error ?? "Save failed");
      router.push(`/assessments/${data.id || editId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(null);
    }
  }

  const stepProps = { form, patch, addFromTemplate, addCustom, removeHazard, updateHazard };
  const riskSignals = form.hazards.reduce((m, h) => Math.max(m, scoreOf(h.likelihood, h.severity)), 0);

  return (
    <AppShell
      action={
        <button onClick={() => save("draft")} disabled={saving !== null} className="btn btn-ghost !px-4 !py-2.5">
          {saving === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Save draft</span>
        </button>
      }
    >
      <div className="mb-8">
        <div className="mono-label mb-2">{editId ? "Editing Document" : "New Document"}</div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-4xl md:text-5xl">RISK ASSESSMENT</h1>
          <div className="mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            {form.assessmentNo} {riskSignals > 0 && <span className="text-white/25">· peak score {riskSignals}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => (i <= step || done) && goTo(i)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                      active
                        ? "border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/[0.07]"
                        : done
                          ? "border-white/10 bg-white/[0.03] hover:border-white/25"
                          : "cursor-default border-white/5 opacity-45"
                    }`}
                  >
                    <span className={`mono flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                      active ? "bg-[var(--brand-teal)] text-white" : done ? "bg-white/10 text-[var(--brand-gold)]" : "bg-white/5 text-white/40"
                    }`}>
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={`mono text-[10px] uppercase tracking-[0.14em] ${active ? "text-[var(--brand-gold)]" : "text-white/60"}`}>
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 hidden rounded-xl border border-white/10 bg-[#0d1013] p-4 lg:block">
            <div className="mono-label !text-[9px] mb-2">Progress</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-[var(--brand-gold)]" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="mono mt-2.5 text-[9.5px] uppercase tracking-[0.14em] text-white/40">
              {form.hazards.length} hazard{form.hazards.length === 1 ? "" : "s"} recorded
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && <IndustryStep {...stepProps} />}
              {step === 1 && <DetailsStep {...stepProps} />}
              {step === 2 && <HazardsStep {...stepProps} />}
              {step === 3 && <EvaluateStep {...stepProps} />}
              {step === 4 && <ControlsStep {...stepProps} />}
              {step === 5 && <ReviewStep {...stepProps} />}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-5 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ff8a8a]">{error}</div>
          )}

          {/* Bottom bar */}
          <div className="sticky bottom-0 z-30 mt-10 -mx-5 border-t border-white/10 bg-[var(--brand-navy-deep)]/90 px-5 py-4 backdrop-blur-xl md:-mx-8 md:px-8">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <button onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} className="btn btn-ghost">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="mono hidden text-[10px] uppercase tracking-[0.2em] text-white/35 sm:block">
                Step {step + 1} / {STEPS.length}
              </span>
              {step < 5 ? (
                <button onClick={() => goTo(step + 1)} disabled={!stepValid} className="btn btn-primary">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex gap-2.5">
                  <button onClick={() => save("draft")} disabled={saving !== null} className="btn btn-ghost">
                    {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save draft
                  </button>
                  <button onClick={() => save("issued")} disabled={saving !== null} className="btn btn-primary">
                    {saving === "issued" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                    Issue assessment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSignature && (
            <SignaturePad 
                onCancel={() => setShowSignature(false)} 
                onSave={(sig) => save("issued", sig)} 
                title="Assessor's Final Attestation" 
            />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--brand-navy-deep)]"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-gold)]" /></div>}>
      <Wizard />
    </Suspense>
  );
}
