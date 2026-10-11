import { LandingNav, LandingFooter } from "@/components/landing-nav";
import { LandingHero } from "@/components/landing-hero";
import { LandingMethod } from "@/components/landing-method";
import { LandingMatrix } from "@/components/landing-matrix";
import { LandingSuite } from "@/components/landing-suite";

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />
      <LandingHero />
      <LandingMethod />
      <LandingMatrix />
      <LandingSuite />
      <LandingFooter />
    </main>
  );
}
"use client";

import Link from "next/link";
import { ShieldCheck, UserCog, Users } from "lucide-react";

export default function PrivateLandingPage() {
  return (
    <div className="bcso-shell bcso-grid min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-xl text-center">
        
        {/* Decorative Top Accent Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[350px] w-[500px] -translate-x-1/2 rounded-full bg-[#F97316]/[0.06] blur-[90px]" />

        {/* Brand Shield Logo plate */}
        <div className="mb-6 flex justify-center">
          <span className="bcso-logo-plate flex h-16 w-14 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-8 w-8 text-[#1C2128]" strokeWidth={2.2} />
          </span>
        </div>

        {/* Institutional Header */}
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl uppercase">
          Oversight Portal
        </h1>
        <p className="mono mt-3 text-[10px] uppercase tracking-[0.22em] text-white/40 leading-relaxed">
          Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO)
          <br />
          Private Internal Work Environment — Unauthorized Access Restricted
        </p>

        {/* Secured Entry Split Cards Layout */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 text-left">
          
          {/* Card Option A: Administrative Staff Hub */}
          <Link 
            href="/admin/access" 
            className="bcso-panel p-6 border-[var(--brand-teal)]/20 hover:border-[var(--brand-teal)]/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-teal)]/10 text-[var(--brand-teal-soft)] mb-4">
                <UserCog className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg tracking-wide text-white uppercase group-hover:text-[var(--brand-teal-soft)] transition-colors">
                Staff Hub
              </h3>
              <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                Reviewers, Finalizers, and System Directors entry gateway.
              </p>
            </div>
            <div className="mono text-[9px] uppercase tracking-wider text-[var(--brand-teal-soft)] mt-6 flex items-center gap-1">
              Sign In Access &rarr;
            </div>
          </Link>

          {/* Card Option B: Subcontractor Portal */}
          <Link 
            href="/portal" 
            className="bcso-panel p-6 border-[var(--brand-gold)]/20 hover:border-[var(--brand-gold)]/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg tracking-wide text-white uppercase group-hover:text-[var(--brand-gold)] transition-colors">
                Contractor Entry
              </h3>
              <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                On-island trade network technicians and inspectors gate.
              </p>
            </div>
            <div className="mono text-[9px] uppercase tracking-wider text-[var(--brand-gold)] mt-6 flex items-center gap-1">
              Portal Sign In &rarr;
            </div>
          </Link>

        </div>

        {/* Mandatory Statutory Footer Branding */}
        <p className="mono mt-12 text-[8.5px] uppercase tracking-[0.2em] text-white/20">
          Anchored to the Health and Safety at Work Act 2002 Framework
        </p>

      </div>
    </div>
  );
}
