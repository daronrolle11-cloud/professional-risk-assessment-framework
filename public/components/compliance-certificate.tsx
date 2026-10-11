import type { ReInspectionRow, ReInspectionItemRow, PropertyRow, ContractorRow, CompanySettingsRow } from "@/db/schema";
import { formatDate } from "@/lib/risk";

const SEAL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1C2128"/>
      <stop offset="1" stop-color="#F97316"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#g1)" stroke="#EAB308" stroke-width="3"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  <path d="M60 20 L64.7 34.5H80L68 43.3L72.7 57.8L60 49L47.3 57.8L52 43.3L40 34.5H55.3Z" fill="#EAB308"/>
  <path d="M60 85 L42 68C42 59 50.1 52 60 52C69.9 52 78 59 78 68Z" fill="rgba(255,255,255,0.15)"/>
  <circle cx="60" cy="68" r="10" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
  <path d="M55 68 L59 72 L66 64" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const VERIFIED_STAMP = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
  <rect x="2" y="2" width="156" height="76" rx="8" fill="none" stroke="#22C55E" stroke-width="3" stroke-dasharray="6 3"/>
  <text x="80" y="28" text-anchor="middle" font-family="Arial" font-weight="800" font-size="13" fill="#22C55E" letter-spacing="3">VERIFIED</text>
  <text x="80" y="48" text-anchor="middle" font-family="Arial" font-weight="800" font-size="13" fill="#22C55E" letter-spacing="3">PASS</text>
  <path d="M50 60 L78 60 M82 60 L110 60" stroke="#22C55E" stroke-width="1.5"/>
</svg>`;

const TRADE_LABELS: Record<string, string> = {
  electrical: "Electrical Grid Safety & Grounding Systems",
  plumbing: "Plumbing, Water Systems & LPG Safety Lines",
  hvac: "HVAC Moisture Regulation & Fungal Remediation",
  general: "Fire Protection, Suppression & Egress Routes",
};

export function ComplianceCertificate({
  reInspection, property, contractor, items, company,
}: {
  reInspection: ReInspectionRow;
  property: PropertyRow;
  contractor: ContractorRow;
  items: ReInspectionItemRow[];
  company?: CompanySettingsRow;
}) {
  const issued = reInspection.certIssuedAt ? new Date(reInspection.certIssuedAt) : new Date();
  const companyName = company?.companyName || "Bahamas Compliance & Safety Oversight Ltd. (BCSO)";
  const companyAddress = company?.address || "Nassau, New Providence, Commonwealth of the Bahamas";
  const managingDirector = reInspection.managingDirector || company?.managingDirector || "Managing Director";

  const effectiveDateFull = issued.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Group by category for the certificate display
  const passedItems = items.filter((i) => i.status === "pass");
  const criticalPassed = passedItems.filter((i) => i.severity === "critical");
  const majorPassed = passedItems.filter((i) => i.severity === "major");

  return (
    <div className="paper print-page relative overflow-hidden rounded-lg shadow-2xl shadow-black/60">
      {/* Top navy header band */}
      <div style={{ background: "linear-gradient(135deg, #0B0F13 0%, #1C2128 60%, #F97316 100%)", color: "#fff", position: "relative", overflow: "hidden", padding: "0" }}>
        <div style={{ borderBottom: "4px solid #EAB308", padding: "0" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", padding: "32px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                {company?.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoDataUrl} alt="Company Logo" style={{ height: "56px", objectFit: "contain", marginBottom: "12px" }} />
                ) : (
                  <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: "22px", letterSpacing: "3px", color: "#EAB308", marginBottom: "8px" }}>BCSO</div>
                )}
                <h1 style={{ fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: "26px", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 4px", lineHeight: 1.1 }}>
                  Certificate of Compliance
                </h1>
                <p style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", opacity: 0.7, margin: "0 0 2px" }}>
                  Health, Safety &amp; Building Integrity Standards
                </p>
                <p style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "1.5px", opacity: 0.55, margin: 0 }}>
                  {companyName}
                </p>
                <p style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "1.5px", opacity: 0.45, margin: "2px 0 0" }}>
                  {companyAddress}
                </p>
              </div>
              {/* Seal */}
              <div style={{ flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: SEAL_SVG }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 40px 36px", background: "#fdfcf9", color: "#181a1d" }}>
        {/* Cert reference + date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ background: "#f0f6ff", border: "2px solid #1C2128", borderRadius: "8px", padding: "12px 20px" }}>
            <div style={{ fontFamily: "monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", color: "#6b7280", marginBottom: "3px" }}>Certificate Reference Number</div>
            <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "18px", letterSpacing: "2px", color: "#1C2128" }}>{reInspection.certRef}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", color: "#6b7280", marginBottom: "3px" }}>Effective Date</div>
            <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "14px", color: "#181a1d" }}>{effectiveDateFull}</div>
            {reInspection.feeCharged === 0 ? (
              <div style={{ fontFamily: "monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#22C55E", marginTop: "3px" }}>✓ BCSO Network — Certificate Issued Free</div>
            ) : (
              <div style={{ fontFamily: "monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#b34a06", marginTop: "3px" }}>Re-Inspection Fee: $250 BSD</div>
            )}
          </div>
        </div>

        {/* Property ID */}
        <div style={{ border: "1.5px solid #d9d6cd", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", background: "#f9f8f5" }}>
          <div style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#1C2128", marginBottom: "12px", borderBottom: "1px solid #d9d6cd", paddingBottom: "8px" }}>
            Property Identification
          </div>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Property Name / Entity", property.name],
                ["Physical Plant Address", property.address || "—"],
                ["Island Location", property.island],
                ["Property Type", property.propertyType],
                ["Client / Owner", property.clientName],
                ...(property.squareFeet ? [["Floor Area", `${property.squareFeet.toLocaleString()} sq ft`]] : []),
                ...(property.yearBuilt ? [["Year Constructed", String(property.yearBuilt)]] : []),
              ].map(([k, v]) => (
                <tr key={k as string}>
                  <td style={{ fontWeight: 600, color: "#374151", paddingBottom: "5px", width: "38%", paddingRight: "12px" }}>{k}</td>
                  <td style={{ color: "#1a1a2e", paddingBottom: "5px" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certification body */}
        <div style={{ border: "2px solid #1C2128", borderRadius: "8px", padding: "20px 24px", marginBottom: "20px" }}>
          <div style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#1C2128", marginBottom: "12px" }}>
            Statutory Certification &amp; Audit Compliance
          </div>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", lineHeight: "1.7", color: "#374151", marginBottom: "16px" }}>
            This is to formally certify that the physical structures, utility frameworks, and environmental systems of the subject property have undergone comprehensive safety re-inspection and rigorous verification. Following the successful remediation of all previously documented safety violations, the property has achieved full compliance across all core testing tracks under the oversight guidelines of the{" "}
            <strong>Bahamian Health and Safety at Work Act (Ch. 321C)</strong>, the{" "}
            <strong>Department of Labour — Labour Inspection Section</strong>, and the{" "}
            <strong>Department of Environmental Health Services (DEHS)</strong>.
          </p>

          {/* Verified pass items */}
          <div style={{ display: "grid", gap: "8px" }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "10px 14px" }}>
                <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", background: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12 L10 17 L19 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "1.5px" }}>[ VERIFIED PASS ]</div>
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", fontWeight: 600, color: "#1a1a2e", marginTop: "1px" }}>{item.label}</div>
                  <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>{item.requirement}</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: item.severity === "critical" ? "#b91c1c" : item.severity === "major" ? "#b34a06" : "#55575c", flexShrink: 0 }}>{item.severity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Field contractor */}
        <div style={{ border: "1px solid #d9d6cd", borderRadius: "8px", padding: "14px 20px", marginBottom: "20px", background: "#f9f8f5" }}>
          <div style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#1C2128", marginBottom: "8px" }}>Field Verification Contractor</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#374151" }}>
            <strong>{contractor.name}</strong> — {contractor.trade} · {contractor.island}
            {contractor.phone ? ` · ${contractor.phone}` : ""}
          </div>
        </div>

        {/* Authorization / signature */}
        <div style={{ border: "2px solid #EAB308", borderRadius: "8px", background: "#fffbf0", padding: "20px 24px", marginBottom: "20px" }}>
          <div style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#b8860b", marginBottom: "12px" }}>Authorization &amp; Issuance</div>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", lineHeight: "1.7", color: "#374151", marginBottom: "20px" }}>
            By authority of the compliance board of <strong>{companyName}</strong>, this certificate is officially bound and granted to the property owner/operator of record.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "8px" }}>
            <div>
              <div style={{ borderBottom: "1.5px solid #181a1d", height: "48px", marginBottom: "4px" }} />
              <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#6b7280", letterSpacing: "1px" }}>AUTHORISED SIGNATURE</div>
            </div>
            <div>
              <div style={{ height: "48px", display: "flex", alignItems: "flex-end", paddingBottom: "4px", borderBottom: "1.5px solid #181a1d", marginBottom: "4px" }}>
                <div style={{ fontFamily: "Arial, sans-serif", fontSize: "14px", fontWeight: 700, color: "#1C2128" }}>{managingDirector}</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#6b7280", letterSpacing: "1px" }}>MANAGING DIRECTOR · {companyName.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ border: "1px solid #d9d6cd", borderRadius: "6px", padding: "12px 16px", marginBottom: "16px", background: "#f9f8f5" }}>
          <div style={{ fontFamily: "monospace", fontSize: "8.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: "4px" }}>Disclaimer</div>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", lineHeight: "1.5", color: "#6b7280", margin: 0 }}>
            This certificate confirms compliance at the point-in-time of the successful re-inspection listed above. Ongoing structural, environmental, and mechanical integrity remains the sole operational responsibility of the property owner/operator under the laws of the Commonwealth of The Bahamas. This certificate does not replace inspection by the Department of Labour&apos;s Labour Inspection Section, the Bahamas Fire Service, or any other statutory authority.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #d9d6cd", paddingTop: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ fontFamily: "monospace", fontSize: "8px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#9ca3af" }}>
            {companyName} · {companyAddress}
            {company?.phone ? ` · ${company.phone}` : ""}
            {company?.email ? ` · ${company.email}` : ""}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "8px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#9ca3af" }}>
            {reInspection.certRef} · Issued {issued.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}
