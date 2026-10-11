import {
  computeComplianceScore, verdictFor, tradeById, REPORT_BRAND,
} from "@/lib/operations";
import { formatDate } from "@/lib/risk";
import {
  LIABILITY_CLAUSES, CLIENT_ACKNOWLEDGEMENT, PAGE_FOOTER_MACRO, COMPANY_LEGAL,
} from "@/lib/legal";
import type { ChecklistItemRow, ContractorRow, InspectionRow, PropertyRow } from "@/db/schema";
import { BrandLogo } from "./risk-badge";
import { ABOUT_BCSO } from "@/lib/data";

const SEV_PAPER: Record<string, string> = {
  critical: "bg-[#FFDDDD] text-[#B91C1C] border border-[#F2A9A9]",
  major: "bg-[#FFE7D3] text-[#B34A06] border border-[#F6C49B]",
  minor: "bg-[#F1EFE8] text-[#55575c] border border-[#d9d6cd]",
};

const RESULT_PAPER: Record<string, string> = {
  pass: "bg-[#DCF5E7] text-[#0E6B3C] border border-[#A9E4C6]",
  fail: "bg-[#FFDDDD] text-[#B91C1C] border border-[#F2A9A9]",
  na: "bg-[#F1EFE8] text-[#55575c] border border-[#d9d6cd]",
};

const REMEDIATION_WINDOW: Record<string, string> = {
  critical: "Immediate — within 72 hours; restrict use of the affected system until corrected",
  major: "Within 14 days",
  minor: "Next routine maintenance cycle",
};

function chip(cls: string, text: string) {
  return (
    <span className={`mono inline-flex rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] ${cls}`}>{text}</span>
  );
}

import type { CompanySettingsRow } from "@/db/schema";

export function ShieldReport({ inspection, property, contractor, items, company }: {
  inspection: InspectionRow;
  property: PropertyRow;
  contractor: ContractorRow;
  items: ChecklistItemRow[];
  company?: CompanySettingsRow;
}) {
  const result = computeComplianceScore(items);
  const verdict = verdictFor(result);
  const trade = tradeById(inspection.trade);
  const failed = items.filter((i) => i.status === "fail");
  const allPhotos = items.flatMap((i) => i.photos.map((p) => ({ ...p, item: i.label })));
  const statutoryBasis = Array.from(new Set(items.map((i) => i.requirement)));
  const issued = inspection.approvedAt ? new Date(inspection.approvedAt) : new Date();

  return (
    <div className="paper print-page relative overflow-hidden rounded-lg shadow-2xl shadow-black/60">
      {/* Title band */}
      <div className="bg-[#1C2128] text-white">
        <div className="flex h-1.5">
          <div className="w-1/3 bg-[#00a9ce]" />
          <div className="w-1/3 bg-[#1C2128]" />
          <div className="w-1/3 bg-[#EAB308]" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-16 w-auto max-w-[200px]" src={company?.logoDataUrl} />
            <div>
              <h1 className="font-display text-[22px] leading-none tracking-wide md:text-[26px]">COMPLIANCE SHIELD REPORT</h1>
              <p className="mono mt-1.5 text-[9px] uppercase tracking-[0.22em] text-[#7dd3e8]">{company?.companyName || REPORT_BRAND}</p>
              <p className="mono mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/40">
                {company?.address || "Field trade inspection"} {company?.phone ? `· ${company.phone}` : ""} {company?.email ? `· ${company.email}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-[12px] font-bold tracking-[0.14em] text-[#EAB308]">{inspection.reportNo}</div>
            <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.16em] text-white/45">Issued {formatDate(issued.toISOString().slice(0, 10))}</div>
            <div className="mono mt-0.5 rounded border border-[#22C55E]/60 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.16em] text-[#4ADE80]">Verified &amp; approved</div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-5 md:px-8">
        {/* Control + property + operation */}
        <table className="doc-table">
          <tbody>
            <tr>
              <th className="w-[14%]">Property</th>
              <td className="w-[36%] font-semibold">{property.name}</td>
              <th className="w-[14%]">Client</th>
              <td className="w-[36%] font-medium">{property.clientName}{property.clientEmail ? <span className="block text-[10.5px] font-normal text-black/55">{property.clientEmail}</span> : null}</td>
            </tr>
            <tr>
              <th>Address / Island</th>
              <td>{property.address || "—"}<span className="block text-[10.5px] text-black/55">{property.island}, The Bahamas</span></td>
              <th>Inspection scope</th>
              <td className="font-medium">{trade.name} — statutory safety checklist ({items.length} line items)</td>
            </tr>
            <tr>
              <th>Profile</th>
              <td>{property.propertyType}{property.squareFeet ? ` · ${property.squareFeet.toLocaleString()} sq ft` : ""}{property.yearBuilt ? ` · constructed ${property.yearBuilt}` : ""}</td>
              <th>Field contractor</th>
              <td className="font-medium">{contractor.name}<span className="block text-[10.5px] font-normal text-black/55">{trade.name} — {contractor.island}</span></td>
            </tr>
            <tr>
              <th>Inspection code</th>
              <td><span className="mono">{inspection.code}</span></td>
              <th>Timeline</th>
              <td>
                <span className="mono text-[10.5px]">
                  Started {inspection.startedAt ? formatDate(inspection.startedAt.toString()) : "—"} · Submitted {inspection.submittedAt ? formatDate(inspection.submittedAt.toString()) : "—"} · Approved {formatDate(issued.toISOString().slice(0, 10))}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Oversight Framework Definition */}
        <div className="nobreak mt-5 rounded border border-[var(--brand-teal)]/25 bg-[#f0f9ff] p-4">
          <div className="mono mb-1.5 text-[8.5px] font-bold uppercase tracking-[0.2em] text-[var(--brand-teal)]">The BCSO Oversight Framework</div>
          <p className="text-[11px] leading-relaxed text-black/85 italic font-medium">&ldquo;{ABOUT_BCSO}&rdquo;</p>
        </div>

        {/* Verdict band */}
        <div className="nobreak mt-5 grid gap-0 overflow-hidden rounded border border-black/25 md:grid-cols-[170px_1fr]">
          <div className="flex flex-col items-center justify-center bg-[#1C2128] px-4 py-5 text-center text-white">
            <div className="mono text-[8.5px] uppercase tracking-[0.2em] text-white/50">Compliance score</div>
            <div className="font-display mt-1 text-6xl leading-none" style={{ color: verdict.hex }}>{result.score}</div>
            <div className="mono mt-1.5 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: verdict.hex }}>{verdict.label}</div>
          </div>
          <div className="bg-[#f4f2ea] px-5 py-4">
            <div className="mono text-[8.5px] font-bold uppercase tracking-[0.18em] text-black/55">Verification summary</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-black/75">{verdict.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {chip("bg-[#DCF5E7] text-[#0E6B3C] border border-[#A9E4C6]", `${result.passCount} passed`)}
              {chip("bg-[#FFDDDD] text-[#B91C1C] border border-[#F2A9A9]", `${result.failCount} failed`)}
              {chip("bg-[#F1EFE8] text-[#55575c] border border-[#d9d6cd]", `${result.naCount} not applicable`)}
              {chip("bg-[#E0F2FE] text-[#075985] border border-[#BAE6FD]", `${allPhotos.length} geo-tagged evidence records`)}
              {result.criticalFails > 0 && chip("bg-[#B91C1C] text-white border border-[#B91C1C]", `${result.criticalFails} critical — immediate action`)}
            </div>
          </div>
        </div>

        {/* Schedule of inspection */}
        <div className="mono mb-1.5 mt-6 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">
          Schedule of inspection — results &amp; statutory cross-reference
        </div>
        <table className="doc-table !text-[11px]">
          <thead>
            <tr>
              <th className="w-7">#</th>
              <th className="w-[34%]">Inspection requirement</th>
              <th className="w-[30%]">Statutory basis (The Bahamas)</th>
              <th className="w-[9%] text-center">Severity</th>
              <th className="w-[8%] text-center">Result</th>
              <th>Contractor observation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id}>
                <td className="mono text-center font-bold">{i + 1}</td>
                <td className="leading-snug">{item.label}</td>
                <td className="leading-snug text-black/65">{item.requirement}</td>
                <td className="text-center">{chip(SEV_PAPER[item.severity] ?? SEV_PAPER.major, item.severity)}</td>
                <td className="text-center">{chip(RESULT_PAPER[item.status] ?? RESULT_PAPER.na, item.status === "fail" ? "REPAIR NEEDED" : item.status === "na" ? "N/A" : item.status.toUpperCase())}</td>
                <td className="leading-snug text-black/75">
                  {item.status === "fail" && item.note ? <strong>State Repair: </strong> : null}
                  {item.note || (item.status === "fail" ? "—" : "")}
                  {item.photos.length > 0 && (
                    <span className="mono block text-[9px] uppercase tracking-[0.1em] text-black/45">
                      {item.photos.length} photo{item.photos.length === 1 ? "" : "s"} (see evidence registry)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Remediation schedule */}
        {failed.length > 0 && (
          <div className="nobreak mt-6">
            <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">
              Required remediation — prioritized by statutory severity
            </div>
            <table className="doc-table !text-[11px]">
              <thead>
                <tr>
                  <th className="w-7">#</th>
                  <th className="w-[38%]">Deficiency</th>
                  <th className="w-[9%] text-center">Class</th>
                  <th>Required action window</th>
                </tr>
              </thead>
              <tbody>
                {failed.map((item, i) => (
                  <tr key={item.id}>
                    <td className="mono text-center font-bold">R{i + 1}</td>
                    <td className="leading-snug"><span className="font-medium">{item.label}</span>{item.note ? <span className="block text-black/65">{item.note}</span> : null}</td>
                    <td className="text-center">{chip(SEV_PAPER[item.severity] ?? SEV_PAPER.major, item.severity)}</td>
                    <td className="leading-snug text-black/75">{REMEDIATION_WINDOW[item.severity] ?? REMEDIATION_WINDOW.major}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Evidence registry */}
        {allPhotos.length > 0 && (
          <div className="mt-6">
            <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">
              Time-stamped &amp; geo-tagged evidence registry — {allPhotos.length} records
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {allPhotos.map((p, i) => (
                <figure key={p.id} className="nobreak overflow-hidden rounded border border-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt={p.caption} className="aspect-[3/2] w-full object-cover" />
                  <figcaption className="border-t border-black/15 bg-[#f4f2ea] px-2.5 py-2">
                    <div className="text-[9.5px] font-medium leading-snug">EV-{String(i + 1).padStart(2, "0")} · {p.caption}</div>
                    <div className="mono mt-1 text-[8px] uppercase tracking-[0.08em] text-black/55">
                      Captured {new Date(p.takenAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="mono mt-0.5 text-[8px] uppercase tracking-[0.08em] text-black/55">
                      {p.lat != null && p.lng != null ? `GPS ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.accuracy ? ` (±${Math.round(p.accuracy)} m)` : ""}` : "GPS unavailable at capture"}
                    </div>
                    <div className="mono mt-0.5 text-[7.5px] uppercase tracking-[0.08em] text-black/40">Server received {new Date(p.uploadedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Statutory basis */}
        <div className="nobreak mt-6">
          <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Applicable statutory basis</div>
          <table className="doc-table">
            <tbody>
              <tr>
                <td>
                  <ul className="columns-1 gap-6 md:columns-2">
                    {statutoryBasis.map((r, i) => (
                      <li key={i} className="mb-1 break-inside-avoid text-[10.5px] leading-snug text-black/75">• {r}</li>
                    ))}
                    <li className="mb-1 break-inside-avoid text-[10.5px] italic leading-snug text-black/55">
                      • Bahamian law takes precedence; foreign standards (BS 7671 / NEC / UK HSE) applied only as recognized good practice.
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sign-off */}
        <div className="nobreak mt-6">
          <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Field attestation &amp; administrative approval</div>
          <table className="doc-table">
            <thead>
              <tr><th className="w-[26%]">Role</th><th className="w-[26%]">Name</th><th className="w-[28%]">Signature</th><th className="w-[20%]">Date</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">Field inspector (trade contractor)</td>
                <td>{contractor.name}</td>
                <td><div className="sig-line" /></td>
                <td>{inspection.submittedAt ? formatDate(inspection.submittedAt.toString()) : ""}</td>
              </tr>
              <tr>
                <td className="font-semibold">Compliance manager — {company?.companyName || REPORT_BRAND}</td>
                <td className="flex items-center justify-center">
                    {inspection.signatureData ? (
                        <img src={inspection.signatureData} alt="Digital Signature" className="h-10 w-auto grayscale" />
                    ) : (
                        <div className="sig-line !h-[34px] w-full" />
                    )}
                </td>
                <td><div className="sig-line" /></td>
                <td>{inspection.signedAt ? formatDate(new Date(inspection.signedAt).toISOString()) : formatDate(issued.toISOString().slice(0, 10))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — MANDATORY LEGAL TERMS AND DISCLAIMERS             */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <div className="nobreak mt-8">
          <div className="rounded-lg border-2 border-black/35 bg-[#f4f2ea]">
            {/* Section header */}
            <div className="border-b-2 border-black/30 bg-[#1C2128] px-5 py-3 text-white">
              <div className="font-display text-[15px] tracking-wide">
                SECTION 1: MANDATORY LEGAL TERMS AND DISCLAIMERS
              </div>
              <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.2em] text-white/60">
                Limitation of Liability &amp; Report Disclaimer — {COMPANY_LEGAL}
              </div>
            </div>

            <div className="px-5 py-4">
              <ol className="space-y-4">
                {LIABILITY_CLAUSES.map((clause) => (
                  <li key={clause.number}>
                    <div className="flex items-baseline gap-2">
                      <span className="mono shrink-0 text-[11px] font-bold text-black/80">{clause.number}.</span>
                      <span className="text-[11.5px] font-bold text-black/85">{clause.title}:</span>
                    </div>
                    <p className="mt-1 pl-5 text-[10.5px] leading-relaxed text-black/75">{clause.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Client acknowledgement & signature */}
        <div className="nobreak mt-5">
          <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">
            Client acknowledgement of legal terms
          </div>
          <table className="doc-table">
            <tbody>
              <tr>
                <td colSpan={4} className="text-[10.5px] leading-relaxed italic text-black/75">
                  &ldquo;{CLIENT_ACKNOWLEDGEMENT}&rdquo;
                </td>
              </tr>
            </tbody>
          </table>
          <table className="doc-table mt-0">
            <thead>
              <tr>
                <th className="w-[25%]">Name (print)</th>
                <th className="w-[30%]">Signature</th>
                <th className="w-[20%]">Position / Title</th>
                <th className="w-[25%]">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div className="sig-line" /></td>
                <td><div className="sig-line" /></td>
                <td><div className="sig-line" /></td>
                <td><div className="sig-line" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Per-page footer macro */}
        <div className="mono mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/15 pt-3 text-[8.5px] uppercase tracking-[0.14em] text-black/50">
          <span>{PAGE_FOOTER_MACRO}</span>
        </div>
        <div className="mono mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-2 text-[8px] uppercase tracking-[0.18em] text-black/40">
          <span>{company?.companyName || REPORT_BRAND} · {company?.address || "Nassau, New Providence, The Bahamas"}</span>
          <span>Report {inspection.reportNo} · Delivered with client invoice · BCSO FieldOps</span>
        </div>
      </div>
    </div>
  );
}
