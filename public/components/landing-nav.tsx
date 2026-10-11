"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "./risk-badge";
import { getLocalSession as getStaffSession } from "@/lib/session-store";
import { getSession as getContractorSession } from "@/lib/portal-client";

const LINKS = [
  { href: "#methodology", label: "Methodology" },
  { href: "#matrix", label: "Risk Matrix" },
  { href: "#documents", label: "Documents" },
  { href: "/portal", label: "Contractor Portal" },
  { href: "/admin", label: "Admin Hub", staffOnly: true },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [userType, setUserType] = useState<"staff" | "contractor" | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    
    // Check for active sessions
    if (getStaffSession()) setUserType("staff");
    else if (getContractorSession()) setUserType("contractor");

    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bcso-topbar border-b backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href="/" className="shrink-0">
          <BrandLogo className="h-11 w-auto" plate />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.filter(l => !l.staffOnly || userType === "staff" || !userType).map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="mono text-[11px] uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[var(--brand-teal-soft)]"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Link href={userType === "contractor" ? "/portal" : "/assessments"} className="btn btn-primary !px-4 !py-2.5">
          {userType === "contractor" ? "Open Portal" : "Open Dashboard"} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--brand-teal)]/15 bg-[var(--brand-navy-deep)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <BrandLogo className="h-14 w-auto" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
            Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO) — the Health &amp; Safety Reporting
            Dashboard for Bahamian workplaces. Professional risk assessments anchored in the Health and
            Safety at Work Act 2002 (Ch. 321C), with the Department of Labour as the inspecting authority.
          </p>
        </div>
        <div>
          <div className="mono-label mb-4">Dashboard</div>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li><Link className="transition-colors hover:text-[var(--brand-teal-soft)]" href="/assessments/new">New risk assessment</Link></li>
            <li><Link className="transition-colors hover:text-[var(--brand-teal-soft)]" href="/assessments">Document register</Link></li>
            <li><Link className="transition-colors hover:text-[var(--brand-teal-soft)]" href="/admin">Admin hub</Link></li>
            <li><Link className="transition-colors hover:text-[var(--brand-teal-soft)]" href="/portal">Contractor portal</Link></li>
            <li><a className="transition-colors hover:text-[var(--brand-teal-soft)]" href="#matrix">5×5 risk matrix</a></li>
            <li><a className="transition-colors hover:text-[var(--brand-teal-soft)]" href="#documents">Document suite</a></li>
          </ul>
        </div>
        <div>
          <div className="mono-label mb-4">Statutory Framework</div>
          <ul className="space-y-2.5 text-sm text-white/60">
            <li>Health and Safety at Work Act 2002 (Ch. 321C)</li>
            <li>Employment Act 2001 (Ch. 321A)</li>
            <li>Dept. of Labour — Labour Inspection Section</li>
            <li>Dept. of Environmental Health Services</li>
            <li>Bahamas Fire Service</li>
            <li className="text-white/35">OSHA / UK HSE — good practice only</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-8">
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            © {new Date().getFullYear()} Bahamas Compliance &amp; Safety Oversight Ltd. (BCSO)
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            Not a substitute for Dept. of Labour inspection
          </span>
        </div>
      </div>
    </footer>
  );
}
