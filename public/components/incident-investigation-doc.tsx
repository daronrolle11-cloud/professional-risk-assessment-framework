import type { IncidentRow, PropertyRow, CompanySettingsRow, PhotoEvidence } from "@/db/schema";
import { formatDate } from "@/lib/risk";
import { BrandLogo } from "./risk-badge";
import { PAGE_FOOTER_MACRO, COMPANY_LEGAL } from "@/lib/legal";

const CLASS_META: Record<string, { label: string; color: string }> = {
  "Near-Miss": { label: "Near-Miss", color: "#6b7280" },
  "First Aid Only": { label: "First Aid", color: "#12a6c4" },
  "Medical Treatment": { label: "Medical", color: "#f59e0b" },
  "Lost Time Injury": { label: "LTI", color: "#f97316" },
  "Fatality": { label: "FATALITY", color: "#ef4444" },
};

export function IncidentInvestigationDoc({ incident, site, company }: {
  incident: IncidentRow;
  site: PropertyRow;
  company?: CompanySettingsRow;
}) {
  const meta = CLASS_META[incident.classification] ?? { label: incident.classification, color: "#1C2128" };
  const generated = new Date();

  return (
    <div className="paper print-page relative overflow-hidden rounded-lg shadow-2xl shadow-black/60 p-10 text-gray-800">
      {/* Title Section */}
      <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
             <BrandLogo className="h-12 w-auto" src={company?.logoDataUrl} />
             <div className="h-8 w-px bg-gray-300" />
             <div className="mono text-xs uppercase tracking-widest font-bold text-gray-500">Security & Loss Prevention Division</div>
          </div>
          <h1 className="font-display text-4xl text-gray-900 mb-2 uppercase">Incident Investigation Report</h1>
          <div className="flex gap-4">
            <div className="mono text-[10px] uppercase tracking-widest text-gray-400">File Reference: <span className="text-black font-bold">{incident.incidentNo}</span></div>
            <div className="mono text-[10px] uppercase tracking-widest text-gray-400">Date Logged: <span className="text-black font-bold">{formatDate(incident.date.toISOString())}</span></div>
          </div>
        </div>
        <div className="text-right">
           <div className={`px-4 py-2 rounded border-2 font-bold text-lg mb-2`} style={{ borderColor: meta.color, color: meta.color }}>
             {meta.label.toUpperCase()}
           </div>
           <div className="mono text-[9px] uppercase text-gray-400 font-bold">Investigation Status: {incident.status.toUpperCase()}</div>
        </div>
      </div>

      {/* Incident Summary Box */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="col-span-2 space-y-6">
            <section>
                <div className="mono text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold border-b border-gray-100">Subject Site & Location</div>
                <div className="text-sm">
                    <div className="font-bold text-lg">{site.name}</div>
                    <div className="text-gray-600">{site.address || site.island}</div>
                    <div className="mt-1 flex gap-4 text-xs">
                        <span><strong>Specific Location:</strong> {incident.location}</span>
                        <span><strong>Island:</strong> {site.island}</span>
                    </div>
                </div>
            </section>
            
            <section>
                <div className="mono text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold border-b border-gray-100">Incident Narrative</div>
                <p className="text-[13px] leading-relaxed text-gray-700 whitespace-pre-wrap">{incident.description}</p>
            </section>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 h-fit">
            <div className="mono text-[9px] uppercase tracking-widest text-gray-400 mb-4 font-bold">Logistics</div>
            <div className="space-y-4">
                <div>
                    <div className="mono text-[8px] uppercase text-gray-400">Time of Event</div>
                    <div className="text-xs font-bold">{incident.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                    <div className="mono text-[8px] uppercase text-gray-400">Reported By</div>
                    <div className="text-xs font-bold">{incident.reportedBy}</div>
                </div>
                <div>
                    <div className="mono text-[8px] uppercase text-gray-400">Site Category</div>
                    <div className="text-xs font-bold capitalize">{site.propertyType}</div>
                </div>
            </div>
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div className="mb-10">
        <div className="mono text-[10px] uppercase tracking-widest text-gray-400 mb-3 font-bold border-b border-gray-100">Root Cause Analysis & Determination</div>
        <div className="bg-[#f0f9ff] border-l-4 border-[#12a6c4] p-5 rounded-r-xl">
            <p className="text-[13px] leading-relaxed text-gray-800 italic">
                &ldquo;{incident.rootCause || "Investigation ongoing. Final determination pending site-wide safety stand-down."}&rdquo;
            </p>
        </div>
      </div>

      {/* Evidence Gallery */}
      <div className="mb-10">
        <div className="mono text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold border-b border-gray-100">Documentary Evidence / Investigation Photos</div>
        {incident.photos && incident.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {incident.photos.map((p, i) => (
              <figure key={p.id} className="overflow-hidden rounded border border-gray-200">
                <img src={p.dataUrl} alt={p.caption} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="bg-gray-50 p-2 text-[9px] border-t border-gray-200">
                    <div className="font-bold uppercase">Evidence FIG {i+1}</div>
                    <div className="truncate text-gray-500">{p.caption}</div>
                    {p.lat && <div className="mono text-[8px] text-blue-500">GPS Verified: {p.lat.toFixed(4)}, {p.lng?.toFixed(4)}</div>}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="py-12 border-2 border-dashed border-gray-100 rounded-xl text-center text-gray-300 italic text-sm">
            No photographic evidence attached to this case file.
          </div>
        )}
      </div>

      {/* Authorization Section */}
      <div className="mt-auto border-t-2 border-gray-900 pt-8">
        <div className="grid grid-cols-2 gap-12">
            <div>
                <div className="h-20 border-b border-gray-300 flex items-center justify-center italic text-gray-300 text-sm">
                    No Witness Signature Required for this classification
                </div>
                <div className="mono text-[9px] uppercase tracking-widest text-gray-400 mt-2">Witness / Site Representative</div>
            </div>
            <div>
                <div className="h-20 border-b-2 border-gray-900 flex items-center justify-center">
                    {incident.signatureData ? (
                        <img src={incident.signatureData} alt="Authorized Signature" className="h-16 w-auto grayscale" />
                    ) : (
                        <div className="italic text-gray-300 text-sm">Awaiting Digital Signature</div>
                    )}
                </div>
                <div className="mono text-[9px] uppercase tracking-widest text-gray-900 mt-2 font-bold">Investigating Compliance Officer</div>
                <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">{COMPANY_LEGAL}</div>
                {incident.signedAt && <div className="text-[9px] text-gray-400 mt-1">Duly Signed: {new Date(incident.signedAt).toLocaleString('en-GB')}</div>}
            </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center border-t border-gray-100 pt-6">
        <div className="text-[9px] text-gray-400">{PAGE_FOOTER_MACRO}</div>
        <div className="mono text-[8px] uppercase tracking-widest text-gray-300">File {incident.incidentNo} · Page 1 of 1</div>
      </div>
    </div>
  );
}
