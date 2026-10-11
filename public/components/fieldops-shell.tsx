"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { REPORT_BRAND } from "@/lib/operations";
import { BrandLogo } from "./risk-badge";
import { getLocalSession as getStaffSession } from "@/lib/session-store";

export function FieldOpsShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const pathname = usePathname();
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  
  useEffect(() => {
    setIsStaff(!!getStaffSession());
    
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.logoDataUrl) setLogoSrc(data.settings.logoDataUrl);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="bcso-shell min-h-screen">
      <header className="bcso-topbar sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0">
              <BrandLogo className="h-11 w-auto md:h-12" plate src={logoSrc} />
            </Link>
            <span className="hidden h-9 w-px bg-white/10 md:block" />
            <nav className="hidden items-center gap-5 md:flex">
              {isStaff && (
                <>
                  <Link href="/admin" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname === "/admin" ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Hub</Link>
                  <Link href="/admin/staff" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/staff") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Staff</Link>
                  <Link href="/admin/contractors" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/contractors") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Contractors</Link>
                  <Link href="/admin/workers" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/workers") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Workers</Link>
                  <Link href="/admin/incidents" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/incidents") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Incidents</Link>
                  <Link href="/admin/training" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/training") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Training</Link>
                  <Link href="/admin/reinspections" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/reinspections") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Certificates</Link>
                  <Link href="/admin/invoices" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname === "/admin/invoices" ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Invoices</Link>
                  <Link href="/admin/hurricane" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/hurricane") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Hurricane</Link>
                  <Link href="/admin/reports" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname === "/admin/reports" ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Reports</Link>
                </>
              )}
              <Link href="/portal" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/portal") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Contractor Portal</Link>
              <Link href="/admin/faq" className={`mono text-[10px] uppercase tracking-[0.16em] transition-colors ${pathname?.startsWith("/admin/faq") ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>Field FAQ</Link>
            </nav>
          </div>
          {right ?? (
            <span className="mono hidden max-w-[320px] truncate text-right text-[9px] uppercase tracking-[0.16em] text-white/35 lg:block">
              {REPORT_BRAND}
            </span>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
