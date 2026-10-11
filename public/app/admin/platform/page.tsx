"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, Box, Database, Globe2, Layers3, MapPinned, Milestone,
  ShieldCheck, Smartphone, Users, WifiOff,
} from "lucide-react";
import { FieldOpsShell } from "@/components/fieldops-shell";
import { getLocalSession as getStaffSession } from "@/lib/session-store";
import { getSession as getContractorSession } from "@/lib/portal-client";
import {
  MODULES, NAMING_OPTIONS, OFFLINE_REQUIREMENTS, PLATFORM_NAME,
  RECOMMENDED_PRODUCT_NAME, ROADMAP_90_DAYS, STACK_OPTIONS, USER_ROLES, VISION_POINTS,
} from "@/lib/platform-spec";

const ICONS = [ShieldCheck, Users, Layers3, Box, Database, Smartphone, Globe2, MapPinned, Milestone];

export default function PlatformBlueprintPage() {
  const router = useRouter();

  useEffect(() => {
    const staff = getStaffSession();
    if (!staff) {
      if (getContractorSession()) window.location.href = "/portal";
      else window.location.href = "/admin/access";
    }
  }, []);

  return (
    <FieldOpsShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <button onClick={() => router.push("/admin")} className="mono mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[var(--brand-teal-soft)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin Hub
        </button>

        <div className="mb-8">
          <div className="mono-label mb-2 !text-[var(--brand-teal-soft)]">Revised Product Architecture</div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">{PLATFORM_NAME.toUpperCase()}</h1>
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            Operating model, roles, modules, stack options and roadmap
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="bcso-panel p-6">
              <div className="mono-label mb-3 !text-[var(--brand-gold)]">Part 1 — The Vision</div>
              <ul className="space-y-3 text-sm leading-relaxed text-white/65">
                {VISION_POINTS.map((p) => (
                  <li key={p} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-teal)]" />{p}</li>
                ))}
              </ul>
            </div>

            <div className="bcso-panel p-6">
              <div className="mono-label mb-3 !text-[var(--brand-gold)]">Part 2 — Naming & Branding</div>
              <div className="mb-4 rounded-xl border border-[var(--brand-teal)]/20 bg-[var(--brand-teal)]/[0.04] p-4">
                <div className="text-sm font-semibold text-white/90">Recommended Product Name</div>
                <div className="font-display mt-1 text-3xl text-[var(--brand-teal-soft)]">{RECOMMENDED_PRODUCT_NAME}</div>
                <p className="mt-2 text-sm text-white/55">Best fit for both construction and marine environments with a distinctive, authoritative identity.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {NAMING_OPTIONS.map((n) => (
                  <div key={n.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="font-semibold">{n.name}</div>
                    <div className="mt-1 text-sm text-white/50">{n.rationale}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bcso-panel p-6">
              <div className="mono-label mb-3 !text-[var(--brand-gold)]">Part 3 — User Roles & Access</div>
              <div className="grid gap-4 lg:grid-cols-2">
                {USER_ROLES.map((role, i) => {
                  const Icon = ICONS[i % ICONS.length];
                  return (
                    <div key={role.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-teal)]/12 text-[var(--brand-teal-soft)]"><Icon className="h-5 w-5" /></div>
                        <div>
                          <div className="font-semibold text-white/90">{role.title}</div>
                          <div className="mono text-[9px] uppercase tracking-[0.14em] text-white/35">{role.audience}</div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-white/55">{role.note}</p>
                      <ul className="mt-3 space-y-1.5 text-[13px] text-white/60">
                        {role.permissions.map((p) => <li key={p}>• {p}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="bcso-panel p-6">
              <div className="mono-label mb-3 !text-[var(--brand-gold)]">Part 6 — Offline Capability</div>
              <div className="mb-4 flex items-center gap-3 text-[var(--brand-teal-soft)]"><WifiOff className="h-5 w-5" /><span className="font-semibold">Critical for the Family Islands</span></div>
              <ul className="space-y-2 text-sm text-white/60">
                {OFFLINE_REQUIREMENTS.map((x) => <li key={x}>• {x}</li>)}
              </ul>
            </div>

            <div className="bcso-panel p-6">
              <div className="mono-label mb-3 !text-[var(--brand-gold)]">Part 11 — 90-Day Roadmap</div>
              <ol className="space-y-2 text-sm text-white/60">
                {ROADMAP_90_DAYS.map((x, idx) => <li key={x}><span className="mr-2 font-semibold text-[var(--brand-teal-soft)]">{idx + 1}.</span>{x}</li>)}
              </ol>
            </div>
          </aside>
        </div>

        <section className="mt-8">
          <div className="bcso-panel p-6">
            <div className="mono-label mb-4 !text-[var(--brand-gold)]">Part 4 — Module Breakdown</div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {MODULES.map((m, i) => {
                const Icon = ICONS[(i + 2) % ICONS.length];
                return (
                  <div key={m.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-teal)]/12 text-[var(--brand-teal-soft)]"><Icon className="h-5 w-5" /></div>
                      <div>
                        <div className="font-semibold text-white/90">{m.title}</div>
                        <div className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--brand-gold)]">{m.status}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/55">{m.summary}</p>
                    <ul className="mt-3 space-y-1.5 text-[13px] text-white/60">
                      {m.details.map((d) => <li key={d}>• {d}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="bcso-panel p-6">
            <div className="mono-label mb-4 !text-[var(--brand-gold)]">Part 5 — Technology Stack Options</div>
            <div className="grid gap-4 lg:grid-cols-3">
              {STACK_OPTIONS.map((s) => (
                <div key={s.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="font-semibold text-white/90">{s.title}</div>
                  <div className="mono mt-1 text-[9px] uppercase tracking-[0.14em] text-white/35">{s.note}</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/60">
                    {s.bullets.map((b) => <li key={b}>• {b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </FieldOpsShell>
  );
}
