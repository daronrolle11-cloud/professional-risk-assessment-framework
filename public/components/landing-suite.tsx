"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileCheck2, ClipboardList, ClipboardCheck, HardHat, MessagesSquare, Search, Wrench, Siren,
  FileSearch, LifeBuoy, ShieldCheck, Flame, Users, LockKeyhole, Leaf, Gauge, ArrowRight,
} from "lucide-react";
import { DOCUMENT_SUITE } from "@/lib/data";

const ICONS = [
  FileCheck2, ClipboardList, ClipboardCheck, HardHat, MessagesSquare, Search, Wrench, Siren,
  FileSearch, LifeBuoy, ShieldCheck, Flame, Users, LockKeyhole, Leaf, Gauge,
];

export function LandingSuite() {
  return (
    <section id="documents" className="relative border-t border-white/5">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="hazard-stripes h-3 w-10 rounded-[2px]" />
              <span className="mono-label">04 / The Suite</span>
            </div>
            <h2 className="font-display text-4xl leading-[1.02] md:text-6xl">
              ONE DASHBOARD. <span className="text-[var(--brand-gold)]">EVERY SAFETY</span>
              <span className="outline-text block">DOCUMENT.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/50">
            The Risk Assessment is live. The full BCSO document suite — JHA, inspection reports, corrective-action
            registers, audit tools, and Safety Committee minutes — follows on the roadmap, all anchored to the
            Health and Safety at Work Act 2002.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOCUMENT_SUITE.map((doc, i) => {
            const Icon = ICONS[i % ICONS.length];
            const Card = (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
                className={`group relative h-full rounded-xl border p-5 transition-all duration-300 ${
                  doc.live
                    ? "glow-amber border-[var(--brand-teal)]/50 bg-[var(--brand-teal)]/[0.07]"
                    : "border-white/10 bg-[#0d1013] hover:border-white/25"
                }`}
              >
                <div className="flex items-start justify-between">
                  <Icon className={`h-5 w-5 ${doc.live ? "text-[var(--brand-gold)]" : "text-white/45"}`} />
                  <span className={`mono rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.18em] ${
                    doc.live ? "border-[var(--brand-teal)]/50 text-[var(--brand-teal-soft)]" : "border-white/15 text-white/35"
                  }`}>
                    {doc.live ? "Live" : "Roadmap"}
                  </span>
                </div>
                <h3 className={`mt-4 text-sm font-semibold tracking-tight ${doc.live ? "" : "text-white/80"}`}>{doc.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/40">{doc.note}</p>
                {doc.live && (
                  <span className="mono mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--brand-teal-soft)]">
                    Open generator <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </motion.div>
            );
            return doc.live ? (
              <Link key={doc.name} href="/assessments/new" className="block">{Card}</Link>
            ) : (
              <div key={doc.name}>{Card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
