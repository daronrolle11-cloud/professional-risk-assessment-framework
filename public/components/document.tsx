import { CONTROL_TIERS, LIKELIHOOD_SCALE, SEVERITY_SCALE, RISK_LEVELS, formatDate, scoreOf } from "@/lib/risk";
import { JURISDICTION_LABELS } from "@/lib/data";
import { LevelBadge, LevelChipInline, BrandLogo } from "@/components/risk-badge";
import {
  LIABILITY_CLAUSES, CLIENT_ACKNOWLEDGEMENT, PAGE_FOOTER_MACRO, RISK_ASSESSMENT_DISCLAIMER, COMPANY_LEGAL,
} from "@/lib/legal";
import type { AssessmentRow, HazardRow, CompanySettingsRow } from "@/db/schema";
import type { Jurisdiction } from "@/lib/types";

const SUBTITLES: Record<Jurisdiction, string> = {
  bahamas:
    "Prepared in accordance with the Health and Safety at Work Act 2002 (Ch. 321C), The Bahamas — HSE five-step method and hierarchy of controls applied as good practice",
  "bahamas-intl":
    "Prepared under the Health and Safety at Work Act 2002 (Ch. 321C), The Bahamas — OSHA / UK HSE guidance applied where national standards are silent",
  osha: "Prepared in accordance with OSHA hazard-identification guidance (29 CFR 1910 series) and the hierarchy of controls",
  hse: "Prepared in accordance with the HSE five-step method (HSWA 1974 — Management of H&S at Work Regs 1999)",
  both: "Prepared in accordance with the HSE five-step method and OSHA hazard-identification guidance",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <th className="w-[13%]">{label}</th>
      <td className="w-[20.33%] font-medium">{value || <span className="text-black/35">—</span>}</td>
    </>
  );
}

export function AssessmentDocument({ assessment, hazards, company }: { assessment: AssessmentRow; hazards: HazardRow[]; company?: CompanySettingsRow }) {
  const a = assessment;
  const generated = new Date();

  return (
    <div className="paper print-page relative overflow-hidden rounded-lg shadow-2xl shadow-black/60">
      {a.status === "draft" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="font-display -rotate-45 text-[140px] tracking-[0.2em] text-black/[0.05] select-none">DRAFT</span>
        </div>
      )}

      {/* Title band */}
      <div className="flex items-stretch justify-between bg-[#0B0F13] text-white">
        <div className="flex items-center gap-6 px-6 py-5 md:px-8">
          <BrandLogo className="h-14 w-auto max-w-[200px]" src={company?.logoDataUrl} />
          <div className="h-10 w-px bg-white/10" />
          <div>
            <h1 className="font-display text-[22px] leading-none tracking-wide md:text-[26px]">
              PROFESSIONAL HEALTH &amp; SAFETY RISK ASSESSMENT
            </h1>
            <p className="mono mt-1.5 text-[9px] uppercase tracking-[0.24em] text-white/40">
              {company?.companyName || COMPANY_LEGAL}
            </p>
            <p className="mono mt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/35">
              {company?.address || "Nassau, New Providence, The Bahamas"} {company?.phone ? `· ${company.phone}` : ""} {company?.email ? `· ${company.email}` : ""}
            </p>
            <p className="mono mt-1.5 text-[9px] uppercase tracking-[0.24em] text-white/40">
              {SUBTITLES[(a.jurisdiction as Jurisdiction) || "bahamas-intl"] ?? SUBTITLES["bahamas-intl"]}
            </p>
          </div>
        </div>
        <div className="hazard-stripes w-14 shrink-0 md:w-24 opacity-60" />
      </div>

      <div className="px-6 pb-6 pt-5 md:px-8">
        {/* Document header block */}
        <table className="doc-table">
          <tbody>
            <tr>
              <Field label="Organization" value={a.organization} />
              <Field label="Assessment No." value={<span className="mono">{a.assessmentNo}</span>} />
              <Field label="Status" value={<span className="mono uppercase">{a.status}</span>} />
            </tr>
            <tr>
              <Field label="Department" value={a.department} />
              <Field label="Assessment Date" value={formatDate(a.assessmentDate)} />
              <Field label="Review Date" value={formatDate(a.reviewDate)} />
            </tr>
            <tr>
              <Field label="Location" value={a.location} />
              <Field label="Assessor" value={a.assessor} />
              <Field label="Employees Exposed" value={String(a.employeesExposed)} />
            </tr>
            <tr>
              <th>Activity / Task</th>
              <td className="font-medium">{a.activity}</td>
              <th>Responsible Manager</th>
              <td className="font-medium">{a.responsibleManager}</td>
              <th>Framework</th>
              <td className="font-medium">{JURISDICTION_LABELS[(a.jurisdiction as Jurisdiction) || "bahamas-intl"] ?? "The Bahamas — Statutory"}</td>
            </tr>
          </tbody>
        </table>

        {/* Rating methodology key */}
        <div className="nobreak mt-5 grid gap-4 md:grid-cols-[1fr_1fr_1.1fr]">
          <div>
            <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Likelihood</div>
            <table className="doc-table !text-[10.5px]">
              <tbody>
                {LIKELIHOOD_SCALE.map((p) => (
                  <tr key={p.value}>
                    <td className="mono w-8 text-center font-bold">{p.value}</td>
                    <td><span className="font-semibold">{p.label}</span> — {p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Severity</div>
            <table className="doc-table !text-[10.5px]">
              <tbody>
                {SEVERITY_SCALE.map((p) => (
                  <tr key={p.value}>
                    <td className="mono w-8 text-center font-bold">{p.value}</td>
                    <td><span className="font-semibold">{p.label}</span> — {p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Risk score = likelihood × severity</div>
            <table className="doc-table !text-[10.5px]">
              <thead>
                <tr><th className="w-14">Score</th><th className="w-20">Level</th><th>Typical action</th></tr>
              </thead>
              <tbody>
                {(["low", "moderate", "high", "extreme"] as const).map((k) => {
                  const lv = RISK_LEVELS[k];
                  return (
                    <tr key={k}>
                      <td className="mono text-center font-bold">{lv.min}–{lv.max}</td>
                      <td><LevelChipInline levelKey={k} paper /></td>
                      <td>{lv.action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1.5 text-[9.5px] italic leading-snug text-black/50">
              Matrix shown is the organization’s adopted risk-rating methodology. OSHA guidance emphasizes evaluating
              severity and likelihood but does not prescribe this particular matrix.
            </p>
          </div>
        </div>

        {/* Assessment table */}
        <div className="mono mb-1.5 mt-6 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">
          Hazard identification, risk evaluation &amp; controls
        </div>
        <table className="doc-table">
          <thead>
            <tr>
              <th className="w-7">#</th>
              <th className="w-[16%]">Hazard</th>
              <th className="w-[17%]">Who might be harmed / how</th>
              <th className="w-[14%]">Existing controls</th>
              <th className="w-8 text-center">L</th>
              <th className="w-8 text-center">S</th>
              <th className="w-[8%] text-center">Risk</th>
              <th className="w-[23%]">Additional controls — hierarchy of controls</th>
              <th className="w-[9%]">Responsible / due</th>
              <th className="w-[8%] text-center">Residual</th>
            </tr>
          </thead>
          <tbody>
            {hazards.map((h, i) => {
              const initial = scoreOf(h.likelihood, h.severity);
              const residual = scoreOf(h.residualLikelihood, h.residualSeverity);
              return (
                <tr key={h.id}>
                  <td className="mono text-center font-bold">{i + 1}</td>
                  <td>
                    <div className="font-semibold leading-snug">{h.description}</div>
                    <div className="mono mt-1 text-[8.5px] uppercase tracking-[0.14em] text-black/45">{h.category}</div>
                  </td>
                  <td className="leading-snug">{h.personsAtRisk}</td>
                  <td className="leading-snug text-black/75">{h.existingControls}</td>
                  <td className="text-center">
                    <div className="mono text-base font-bold">{h.likelihood}</div>
                    <div className="text-[8.5px] uppercase tracking-wide text-black/45">{LIKELIHOOD_SCALE[h.likelihood - 1].label}</div>
                  </td>
                  <td className="text-center">
                    <div className="mono text-base font-bold">{h.severity}</div>
                    <div className="text-[8.5px] uppercase tracking-wide text-black/45">{SEVERITY_SCALE[h.severity - 1].label}</div>
                  </td>
                  <td className="text-center">
                    <div className="mono text-lg font-bold">{initial}</div>
                    <div className="mt-1"><LevelBadge score={initial} paper size="sm" /></div>
                  </td>
                  <td>
                    <ul className="space-y-1.5">
                      {CONTROL_TIERS.map((tier) => {
                        const items = h.controls[tier.key].filter((x) => x.trim());
                        if (items.length === 0) return null;
                        return (
                          <li key={tier.key} className="leading-snug">
                            <span className="mono mr-1.5 inline-block rounded border border-black/20 bg-[#f1efe8] px-1 py-px text-[8px] font-bold uppercase tracking-wider text-black/70">
                              {tier.tag}
                            </span>
                            {items.map((x, xi) => (
                              <span key={xi} className="block pl-9 text-[11px] text-black/80">· {x.replace(/^[\s·•-]+/, "")}</span>
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="leading-snug">
                    <div className="font-medium">{h.responsiblePerson || <span className="text-black/35">—</span>}</div>
                    <div className="mono mt-1 text-[9.5px] text-black/50">{h.dueDate ? `Due ${formatDate(h.dueDate)}` : "Ongoing"}</div>
                  </td>
                  <td className="text-center">
                    <div className="mono text-[10px] text-black/50">{h.residualLikelihood} × {h.residualSeverity}</div>
                    <div className="mono text-lg font-bold">{residual}</div>
                    <div className="mt-1"><LevelBadge score={residual} paper size="sm" /></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Regulations */}
        <div className="nobreak mt-6">
          <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Applicable regulations / standards</div>
          <table className="doc-table">
            <tbody>
              <tr>
                <td>
                  <ul className="columns-1 gap-6 md:columns-2">
                    {a.regulations.split("\n").filter((r) => r.trim()).map((r, i) => (
                      <li key={i} className="mb-1 break-inside-avoid text-[11px] leading-snug text-black/80">• {r}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sign-off */}
        <div className="nobreak mt-6">
          <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Approval &amp; sign-off</div>
          <table className="doc-table">
            <thead>
              <tr><th className="w-[25%]">Role</th><th className="w-[25%]">Name</th><th className="w-[30%]">Signature</th><th className="w-[20%]">Date</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">Assessor (competent person)</td>
                <td>{a.assessor || <span className="text-black/35">—</span>}</td>
                <td className="flex items-center justify-center">
                    {a.signatureData ? (
                        <img src={a.signatureData} alt="Assessor Signature" className="h-10 w-auto grayscale" />
                    ) : (
                        <div className="sig-line w-full" />
                    )}
                </td>
                <td>{a.signedAt ? formatDate(new Date(a.signedAt).toISOString()) : formatDate(a.assessmentDate)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Responsible manager</td>
                <td>{a.responsibleManager || <span className="text-black/35">—</span>}</td>
                <td><div className="sig-line" /></td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Review record */}
        <div className="nobreak mt-5">
          <div className="mono mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-black/60">Review record</div>
          <table className="doc-table">
            <thead>
              <tr><th className="w-[18%]">Review date</th><th className="w-[22%]">Reviewed by</th><th>Changes / reason for review</th><th className="w-[18%]">Next review due</th></tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((i) => (
                <tr key={i}>
                  <td>{i === 0 ? formatDate(a.reviewDate) : ""}</td>
                  <td /><td /><td />
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1.5 text-[9.5px] italic text-black/50">
            Review after any significant change, after an incident, and no later than the review date above.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — MANDATORY LEGAL TERMS AND DISCLAIMERS             */}
        {/* Prominent full-sized block, not a small footer.                */}
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
              {/* Four numbered clauses */}
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

        {/* Professional assessment disclaimer */}
        <div className="nobreak mt-5 rounded border border-black/25 bg-[#f4f2ea] p-3.5">
          <div className="mono mb-1 text-[8.5px] font-bold uppercase tracking-[0.2em] text-black/55">Professional assessment disclaimer</div>
          <p className="text-[10px] leading-relaxed text-black/70">{RISK_ASSESSMENT_DISCLAIMER}</p>
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
          <span>
            {company?.companyName || COMPANY_LEGAL}
            {company?.address ? ` · ${company.address}` : ""}
            {company?.phone ? ` · ${company.phone}` : ""}
            {company?.email ? ` · ${company.email}` : ""}
          </span>
          <span>Doc {a.assessmentNo} · Generated {generated.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
      </div>
    </div>
  );
}
