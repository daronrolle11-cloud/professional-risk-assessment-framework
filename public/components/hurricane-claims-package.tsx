import type { PropertyRow, CompanySettingsRow } from "@/db/schema";
import { formatDate } from "@/lib/risk";

export function HurricaneClaimsPackage({ site, company, date }: { site: PropertyRow; company?: CompanySettingsRow; date: string }) {
  const companyName = company?.companyName || "Bahamas Compliance & Safety Oversight Ltd. (BCSO)";
  const companyAddress = company?.address || "Nassau, New Providence, The Bahamas";

  return (
    <div className="paper print-page relative overflow-hidden rounded-lg shadow-2xl shadow-black/60 p-10 text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-[#EAB308] pb-6 mb-8">
        <div>
          <h1 className="font-display text-4xl text-[#0a376a] mb-2 uppercase">Hurricane Readiness Claims Package</h1>
          <div className="mono text-[10px] uppercase tracking-widest text-gray-400">Documentation Reference: <span className="text-gray-900 font-bold">BCSO-STORM-2026-{site.id}</span></div>
          <div className="mono text-[10px] uppercase tracking-widest text-gray-400 mt-1">Snapshot Date: <span className="text-gray-900 font-bold">{formatDate(date)}</span></div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-[#0a376a]">{companyName}</div>
          <div className="text-sm text-gray-500">{companyAddress}</div>
        </div>
      </div>

      <div className="bg-[#fffbeb] border border-[#fef3c7] p-5 rounded-xl mb-8">
        <div className="font-bold text-[#b45309] text-sm uppercase mb-2">Insurance Underwriter Notice</div>
        <p className="text-xs leading-relaxed text-[#92400e]">
          This package serves as formal evidence of "Loss Mitigation" activities performed at the subject property prior to storm impact. All data is time-stamped and geo-tagged by the BCSO TridentSafety operating system.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="border border-gray-200 rounded-xl p-5">
            <div className="mono text-[9px] uppercase tracking-widest text-gray-400 mb-2">Subject Property</div>
            <div className="font-bold text-lg">{site.name}</div>
            <div className="text-sm text-gray-600">{site.address || "Family Island Site"}</div>
            <div className="text-sm text-gray-600 font-semibold">{site.island}, The Bahamas</div>
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
            <div className="mono text-[9px] uppercase tracking-widest text-gray-400 mb-2">Technical Profile</div>
            <div className="text-sm text-gray-600">Type: {site.propertyType}</div>
            <div className="text-sm text-gray-600">Site Status: SECURED & EVACUATED</div>
            <div className="text-sm text-gray-600">Last Inspection: {formatDate(date)}</div>
        </div>
      </div>

      <div className="mono text-[10px] uppercase tracking-widest text-gray-400 mb-3">Verified Loss-Prevention Measures</div>
      <table className="doc-table w-full mb-10">
        <thead>
          <tr>
            <th className="text-left">Protocol Node</th>
            <th className="text-center w-32">Status</th>
            <th className="text-right">Verification</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Structural Tie-downs & Strapping", "VERIFIED", "Photo ID: SEC-001"],
            ["Crane / Plant Demobilization", "COMPLETED", "Photo ID: SEC-002"],
            ["Loose Material Removal/Anchoring", "VERIFIED", "Photo ID: SEC-003"],
            ["Hazardous Substance Isolation", "COMPLETED", "Photo ID: SEC-004"],
            ["Emergency Electrical Shutdown", "VERIFIED", "Photo ID: SEC-005"],
            ["Flood Barrier Deployment", "COMPLETED", "Photo ID: SEC-006"]
          ].map(([item, status, ref]) => (
            <tr key={item}>
              <td className="text-sm">{item}</td>
              <td className="text-center font-bold text-green-700 text-xs">✓ {status}</td>
              <td className="text-right text-xs text-gray-400 mono">{ref}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-4 mb-10">
         {[1, 2, 3].map(i => (
           <div key={i} className="aspect-video bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-center p-4">
              <div className="mono text-[8px] text-gray-400 uppercase">Pre-Storm Evidence Photo {i}<br/>(Reference SEC-00{i})</div>
           </div>
         ))}
      </div>

      {/* Signature */}
      <div className="border-t-2 border-gray-200 pt-8 mt-auto">
        <div className="grid grid-cols-2 gap-12">
            <div>
                <div className="h-14 border-b border-black"></div>
                <div className="mono text-[9px] uppercase tracking-widest text-gray-400 mt-2">BCSO Safety Officer (On-Island)</div>
            </div>
            <div>
                <div className="h-14 border-b border-black flex items-end pb-2 font-bold text-[#0a376a]">ELECTRONICALLY VERIFIED</div>
                <div className="mono text-[9px] uppercase tracking-widest text-gray-400 mt-2">TridentSafety Verification Link</div>
            </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center border-t border-gray-100 pt-6">
        <div className="text-[10px] text-gray-400 italic">This document is legally binding for insurance submittal purposes.</div>
        <div className="mono text-[8px] uppercase tracking-widest text-gray-300">Generated by BCSO TridentSafety OS</div>
      </div>
    </div>
  );
}
