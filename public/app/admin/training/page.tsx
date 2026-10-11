"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Award, BookOpen, Calendar, CheckCircle2, Clock, GraduationCap,
  Loader2, Plus, QrCode, Search, Users, X, Printer, MapPin, User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { getLocalSession as getStaffSession } from "@/lib/session-store";
import { adminFetch, safeJson } from "@/lib/admin-fetch";
import { SYLLABUS_DATA, CourseSyllabus } from "@/lib/syllabus";
import { formatDate } from "@/lib/risk";

const COURSES = [
  { id: "orientation", name: "Basic Worker Safety Orientation", duration: "4 hours", renewal: "12 months", tier: 1 },
  { id: "fall-protection", name: "Fall Protection Certification", duration: "8 hours", renewal: "24 months", tier: 2 },
  { id: "confined-space", name: "Confined Space Entry", duration: "8 hours", renewal: "24 months", tier: 2 },
  { id: "scaffold", name: "Scaffold Erection & Safety", duration: "8 hours", renewal: "24 months", tier: 2 },
  { id: "hot-work", name: "Hot Work Permit Operations", duration: "4 hours", renewal: "12 months", tier: 2 },
  { id: "first-aid", name: "First Aid / CPR / AED", duration: "8 hours", renewal: "24 months", tier: 3 },
  { id: "crane-signal", name: "Crane Signalperson", duration: "16 hours", renewal: "36 months", tier: 3 },
  { id: "electrical-safety", name: "Electrical Safety for Non-Electricians", duration: "4 hours", renewal: "12 months", tier: 2 },
  { id: "heat-stress", name: "Heat Stress Prevention (Bahamas-specific)", duration: "2 hours", renewal: "12 months", tier: 1 },
  { id: "hurricane-prep", name: "Hurricane Site Preparedness", duration: "2 hours", renewal: "12 months", tier: 1 },
  { id: "marine-safety", name: "Marine/Shipyard Safety", duration: "8 hours", renewal: "24 months", tier: 3 },
  { id: "hazcom", name: "Hazard Communication (GHS)", duration: "4 hours", renewal: "24 months", tier: 2 },
];

const TIER_META: Record<number, { label: string; cls: string }> = {
  1: { label: "Tier 1 — Mandatory", cls: "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#F87171]" },
  2: { label: "Tier 2 — Trade-Specific", cls: "border-[var(--brand-teal)]/40 bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]" },
  3: { label: "Tier 3 — Specialized", cls: "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]" },
};

function SyllabusModal({ course, onClose }: { course: CourseSyllabus; onClose: () => void }) {
  const printSyllabus = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--brand-teal)]/20 bg-[var(--brand-navy-deep)] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1C2128] px-6 py-5 flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <GraduationCap className="h-6 w-6 text-[var(--brand-gold)]" />
            <div>
              <h2 className="font-display text-xl tracking-wide text-white uppercase">Course Syllabus</h2>
              <p className="mono text-[9px] uppercase tracking-[0.2em] text-white/50">Bahamas Compliance & Safety Oversight Ltd.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/50 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8 bg-[var(--paper)] text-[#1a1a2e]">
          <div className="border-b-2 border-[#1C2128] pb-4">
            <div className="flex justify-between items-baseline gap-4">
              <h1 className="font-display text-3xl text-[#1C2128]">{course.courseId.toUpperCase().replace(/-/g, ' ')}</h1>
              <span className="mono text-xs font-bold text-gray-400">ID: BCSO-TR-{course.courseId.toUpperCase()}</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed italic text-gray-700">{course.description}</p>
          </div>

          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#F97316] font-bold mb-4 border-l-4 border-[#F97316] pl-3">Learning Objectives</div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {course.objectives.map((obj, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-[#22C55E]" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="mono text-[10px] uppercase tracking-widest text-[#F97316] font-bold border-l-4 border-[#F97316] pl-3">Curriculum Structure</div>
            <div className="space-y-4">
              {course.modules.map((mod, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="font-bold text-[#1C2128] mb-2">Module {i + 1}: {mod.title}</h3>
                  <ul className="space-y-1.5">
                    {mod.topics.map((topic, ti) => (
                      <li key={ti} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-[#F97316]">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <div className="mono text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-2">Assessment Methodology</div>
              <p className="text-sm font-medium text-gray-800">{course.assessmentMethod}</p>
            </div>
            <div>
              <div className="mono text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-2">Issued Credential</div>
              <p className="text-sm font-medium text-gray-800">{course.certificationType}</p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-100 p-4 text-[10px] leading-relaxed text-gray-500 italic">
            This syllabus represents the official TridentSafety / BCSO training curriculum. Content is subject to periodic review by the Compliance Board to ensure alignment with the latest Bahamian Health and Safety at Work Act (Ch. 321C) standards.
          </div>
        </div>

        <div className="bg-[#1C2128] border-t border-white/10 p-4 flex justify-end gap-3 no-print">
          <button onClick={onClose} className="btn btn-ghost !px-6">Close</button>
          <button onClick={printSyllabus} className="btn btn-primary !px-6">
            <Printer className="h-4 w-4" /> Print Syllabus
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TrainingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [viewingSyllabus, setViewingSyllabus] = useState<CourseSyllabus | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [schedulingCourse, setSchedulingCourse] = useState<any>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [form, setForm] = useState({
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    location: "Nassau Training Center",
    maxEnrollment: 20,
    instructorName: "Lead Safety Officer",
  });

  const loadSessions = useCallback(async () => {
    const s = getStaffSession();
    if (!s) return;
    const res = await adminFetch("/api/admin/training/sessions", {}, s);
    const data = await safeJson<any[]>(res);
    if (data) setSessions(data);
    setLoadingSessions(false);
  }, []);

  useEffect(() => {
    if (!getStaffSession()) {
      window.location.href = "/admin/access";
    } else {
      loadSessions();
    }
  }, [loadSessions]);

  async function scheduleClass() {
    if (!schedulingCourse) return;
    const res = await adminFetch("/api/admin/training/sessions", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        courseId: schedulingCourse.id,
        courseName: schedulingCourse.name,
      }),
    });
    if (res.ok) {
      setShowScheduleForm(false);
      setSchedulingCourse(null);
      loadSessions();
    }
  }

  const filtered = COURSES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Module 6 — Training Management System</div>
            <h1 className="font-display text-4xl tracking-wide md:text-5xl">TRAINING & CERTIFICATION</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--brand-teal)]/12 bg-[var(--brand-teal)]/12 md:grid-cols-4">
          {[
            { k: "Course catalog", v: COURSES.length, c: "#efede8", icon: BookOpen },
            { k: "Upcoming Classes", v: sessions.length, c: "var(--brand-gold)", icon: Calendar },
            { k: "Tier 1 (Mandatory)", v: COURSES.filter((c) => c.tier === 1).length, c: "#EF4444", icon: Award },
            { k: "Tier 2 (Trade)", v: COURSES.filter((c) => c.tier === 2).length, c: "var(--brand-teal-soft)", icon: GraduationCap },
          ].map((s) => (
            <div key={s.k} className="bg-[var(--brand-navy-deep)] px-5 py-4">
              <div className="flex items-center gap-3">
                <s.icon className="h-4.5 w-4.5" style={{ color: s.c }} />
                <div>
                  <div className="font-display text-2xl" style={{ color: s.c }}>{s.v}</div>
                  <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/40">{s.k}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <section className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--brand-navy-deep)] px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" placeholder="Search course catalog…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            {/* Course catalog */}
            <div className="space-y-3">
              <div className="mono-label !text-[var(--brand-teal-soft)]">Course Catalog</div>
              {filtered.map((course) => {
                const tier = TIER_META[course.tier] ?? TIER_META[1];
                return (
                  <div key={course.id} className="bcso-panel p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)]">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-semibold text-white/90">{course.name}</h3>
                          <span className={`mono rounded-full border px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] ${tier.cls}`}>{tier.label}</span>
                        </div>
                        <div className="mono mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.13em] text-white/40">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Renewal: {course.renewal}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const syl = SYLLABUS_DATA[course.id];
                          if (syl) setViewingSyllabus(syl);
                          else alert("Detailed syllabus is being finalized.");
                        }} 
                        className="btn btn-ghost !py-2 !px-3 !text-[10px]"
                      >
                        View Syllabus
                      </button>
                      <button 
                        onClick={() => {
                          setSchedulingCourse(course);
                          setShowScheduleForm(true);
                        }}
                        className="btn btn-primary !py-2 !px-3 !text-[10px]"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bcso-panel p-5">
              <div className="mono-label mb-4 !text-[var(--brand-gold)]">Upcoming Sessions</div>
              {loadingSessions ? (
                <div className="flex py-8 justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand-teal)]" /></div>
              ) : sessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">No classes scheduled.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                      <div className="font-bold text-white/90 text-[13px]">{s.courseName}</div>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px] text-white/50"><Calendar className="h-3 w-3" /> {new Date(s.scheduledAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="flex items-center gap-2 text-[11px] text-white/50"><MapPin className="h-3 w-3" /> {s.location}</div>
                        <div className="flex items-center gap-2 text-[11px] text-white/50"><User className="h-3 w-3" /> {s.instructorName}</div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                         <span className="mono text-[9px] uppercase text-[var(--brand-teal-soft)]">{s.enrolledCount} / {s.maxEnrollment} Enrolled</span>
                         <button className="mono text-[9px] uppercase text-white/30 hover:text-white transition-colors">Manage</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        <AnimatePresence>
          {viewingSyllabus && <SyllabusModal course={viewingSyllabus} onClose={() => setViewingSyllabus(null)} />}
          {showScheduleForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bcso-panel p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-5">
                  <div className="mono-label !text-[var(--brand-gold)]">Schedule New Class</div>
                  <button onClick={() => setShowScheduleForm(false)}><X className="h-4 w-4 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="mono text-[9px] uppercase text-white/40 mb-1">Course</div>
                    <div className="font-bold text-[var(--brand-teal-soft)]">{schedulingCourse?.name}</div>
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Date & Time</div>
                    <input type="datetime-local" className="field" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
                  </div>
                  <div>
                    <div className="mono-label !text-[9px] mb-1.5">Location</div>
                    <input className="field" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mono-label !text-[9px] mb-1.5">Max Enrollment</div>
                      <input type="number" className="field" value={form.maxEnrollment} onChange={e => setForm({...form, maxEnrollment: Number(e.target.value)})} />
                    </div>
                    <div>
                      <div className="mono-label !text-[9px] mb-1.5">Instructor</div>
                      <input className="field" value={form.instructorName} onChange={e => setForm({...form, instructorName: e.target.value})} />
                    </div>
                  </div>
                </div>
                <button onClick={scheduleClass} className="btn btn-primary w-full mt-6 !py-3.5">Confirm Schedule</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </FieldOpsShell>
  );
}
