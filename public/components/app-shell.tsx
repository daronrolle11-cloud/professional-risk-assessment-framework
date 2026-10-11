"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, LayoutGrid, Globe } from "lucide-react";
import { BrandLogo } from "./risk-badge";
import { getLocalSession as getStaffSession } from "@/lib/session-store";
import { getSession as getContractorSession } from "@/lib/portal-client";

export function AppShell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const pathname = usePathname();
  const [userType, setUserType] = useState<"staff" | "contractor" | null>(null);

  useEffect(() => {
    if (getStaffSession()) setUserType("staff");
    else if (getContractorSession()) setUserType("contractor");
  }, []);

  return (
    <div className="bcso-shell min-h-screen">
      <header className="bcso-topbar sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="shrink-0">
              <BrandLogo className="h-11 w-auto md:h-12" plate />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {userType === "staff" && (
                <>
                  <Link href="/assessments" className={`mono text-[10.5px] uppercase tracking-[0.18em] transition-colors ${pathname === "/assessments" ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>
                    Register
                  </Link>
                  <Link href="/assessments/new" className={`mono text-[10.5px] uppercase tracking-[0.18em] transition-colors ${pathname === "/assessments/new" ? "text-[var(--brand-gold)]" : "text-white/55 hover:text-[var(--brand-teal-soft)]"}`}>
                    New Assessment
                  </Link>
                </>
              )}
              {userType === "contractor" && (
                <Link href="/portal" className={`mono text-[10.5px] uppercase tracking-[0.18em] text-white/55 hover:text-[var(--brand-teal-soft)]`}>
                  Portal Dashboard
                </Link>
              )}
              <Link href="/" className="mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[var(--brand-teal-soft)]">
                <Globe className="h-3 w-3" /> Site
              </Link>
            </nav>
          </div>
          {action ?? (
            <Link href="/assessments/new" className="btn btn-primary !px-4 !py-2.5">
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New Assessment</span>
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">{children}</main>
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 md:px-8">
          <span className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
            <LayoutGrid className="h-3 w-3" /> Bahamas Compliance & Safety Oversight Ltd. (BCSO)
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-white/30">Bahamas HSW Act 2002 · 5×5 matrix · Hierarchy of controls</span>
        </div>
      </footer>
    </div>
  );
}
