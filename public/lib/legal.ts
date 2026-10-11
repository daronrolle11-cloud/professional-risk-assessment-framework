/**
 * Master Limitation of Liability & Report Disclaimer
 * ─────────────────────────────────────────────────────
 * Structured as four numbered clauses for prominent placement
 * in Section 1 of every report, with a client-acknowledgement
 * signature line and a per-page macro-link footer.
 */

export const COMPANY_LEGAL = "Bahamas Compliance & Safety Oversight Ltd. (BCSO)";

export const LIABILITY_CLAUSES = [
  {
    number: 1,
    title: "Nature of Services",
    body: `This Property Health, Safety, and Compliance Oversight Report (the "Report") is a point-in-time visual and technical assessment of the subject property conducted on the date listed herein. It represents conditions visible and accessible at the exact time of inspection and does not constitute a lifetime warranty, guarantee, or insurance policy against future equipment failure, structural defects, or environmental shifts.`,
  },
  {
    number: 2,
    title: "Reliance on Third-Party Specialists",
    body: `${COMPANY_LEGAL} acts as a primary compliance oversight agency. Technical trade evaluations — including but not limited to Electrical, Plumbing, HVAC/Mold, LPG Gas, and Fire Protection Systems — are executed by independent, locally licensed, and insured subcontractors. Technical liability for findings, omissions, or latent defects within those specific disciplines rests solely with the respective licensed trade contractor of record.`,
  },
  {
    number: 3,
    title: "Client Responsibility & Mitigation",
    body: `The recipient of this Report acknowledges that hazards, mold/moisture issues, electrical faults, and fire system deficiencies identified herein pose active operational and legal risks under the Bahamian Health and Safety at Work Act. ${COMPANY_LEGAL} assumes no liability for property damage, structural degradation, financial loss, personal injury, or wrongful death resulting from the client's failure to immediately execute the corrective actions and mitigation roadmaps outlined in this Report.`,
  },
  {
    number: 4,
    title: "Jurisdiction",
    body: `This disclaimer and all services rendered by ${COMPANY_LEGAL} shall be governed by, and construed in accordance with, the laws of the Commonwealth of The Bahamas.`,
  },
];

export const CLIENT_ACKNOWLEDGEMENT =
  `I acknowledge that I have read, understood, and agree to the Limitation of Liability & Report Disclaimer attached to this document.`;

export const PAGE_FOOTER_MACRO =
  `This page is subject to the Master Limitation of Liability & Report Disclaimer outlined in Section 1 of this report.`;

/**
 * Short-form professional disclaimer for the Risk Assessment document
 * (which is a guidance document rather than a property inspection report).
 */
export const RISK_ASSESSMENT_DISCLAIMER =
  `This risk assessment is a structured safety-management document prepared from the information supplied, in accordance with the Health and Safety at Work Act 2002 (Ch. 321C) and other applicable laws of The Bahamas, using the HSE five-step method and the OSHA hierarchy of controls as recognized international good practice. It should be reviewed by a competent person familiar with the specific workplace, task, equipment, employees and the requirements of the Department of Labour before implementation. Bahamian legal requirements take precedence over any international (OSHA/HSE) guidance referenced. This document does not replace a statutory inspection by the Labour Inspection Section.`;
