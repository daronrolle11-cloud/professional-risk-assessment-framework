import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "BCSO — Bahamas Compliance & Safety Oversight Ltd. | Safety Document & Compliance Platform",
  description:
    "Bahamas Compliance & Safety Oversight Ltd. (BCSO) — professional risk assessments and multi-island trade-compliance operations anchored in the Health and Safety at Work Act 2002. Identify hazards, rate risk, control via the hierarchy, and issue audit-ready documents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${mono.variable}`}>
      <body className="bg-[#08090b] text-[#efede8] antialiased">{children}</body>
    </html>
  );
}
