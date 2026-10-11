"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Pencil, Printer } from "lucide-react";
import { BrandLogo } from "./risk-badge";
import type { AssessmentRow } from "@/db/schema";

export function DocToolbar({ assessment }: { assessment: AssessmentRow }) {
  const router = useRouter();
  return (
    <header className="bcso-topbar sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/assessments" className="shrink-0">
            <BrandLogo className="h-10 w-auto" plate />
          </Link>
          <span className="hidden h-5 w-px bg-white/15 sm:block" />
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.16em] text-white/45">{assessment.assessmentNo}</div>
            <div className="max-w-[200px] truncate text-sm font-medium md:max-w-[340px]">{assessment.activity}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/assessments")} className="btn btn-ghost !px-3.5 !py-2">
            <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden md:inline">Register</span>
          </button>
          <Link href={`/assessments/new?edit=${assessment.id}`} className="btn btn-ghost !px-3.5 !py-2">
            <Pencil className="h-3.5 w-3.5" /> <span className="hidden md:inline">Edit</span>
          </Link>
          <button onClick={() => window.print()} className="btn btn-primary !px-4 !py-2">
            <Printer className="h-3.5 w-3.5" /> Print
            <span className="hidden items-center gap-1.5 md:flex">
              <span className="text-black/40">/</span> <Download className="h-3.5 w-3.5" /> PDF
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
