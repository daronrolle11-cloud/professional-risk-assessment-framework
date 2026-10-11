import { notFound } from "next/navigation";
import { db } from "@/db";
import { inspections, properties, contractors, checklistItems, companySettings, invoices, reInspections, reInspectionItems, incidents } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { ShieldReport } from "@/components/shield-report";
import { ReportToolbar } from "@/components/report-toolbar";
import { ComplianceCertificate } from "@/components/compliance-certificate";
import { InvoiceDoc } from "@/components/invoice-doc";

export const dynamic = "force-dynamic";

import { IncidentInvestigationDoc } from "@/components/incident-investigation-doc";

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ type?: string }> }) {
  // Auth is handled client-side via localStorage
  const mockStaff = { id: 0, name: "BCSO Staff", email: "", phone: "", title: "", role: "admin" as const, accessCode: "", lastLoginAt: null, loginCount: 0, active: true, createdAt: null };

  const id = Number((await params).id);
  const type = (await searchParams).type || 'inspection';
  
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [company] = await db.select().from(companySettings).limit(1);

  if (type === 'incident') {
      const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
      if (!incident) notFound();
      const [site] = await db.select().from(properties).where(eq(properties.id, incident.siteId));
      
      // Stub for toolbar logic
      const mockInspection = {
          reportNo: incident.incidentNo,
          code: incident.incidentNo,
          trade: 'Incident Investigation',
          clientNotifiedAt: null,
          id: incident.id,
          reviewStage: 'finalized'
      };

      return (
        <div className="min-h-screen bg-[var(--brand-navy-deep)] pb-20">
          <div className="no-print">
            <ReportToolbar inspection={mockInspection as any} property={site as any} staff={mockStaff} company={company} />
          </div>
          <main className="mx-auto max-w-[1180px] px-3 py-6 md:px-6 md:py-10">
            <IncidentInvestigationDoc incident={incident} site={site as any} company={company} />
          </main>
        </div>
      );
  }

  const [row] = await db
    .select({ inspection: inspections, property: properties, contractor: contractors })
    .from(inspections)
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .innerJoin(contractors, eq(inspections.contractorId, contractors.id))
    .where(eq(inspections.id, id));
  if (!row) notFound();

  const [items, invoice] = await Promise.all([
    db.select().from(checklistItems).where(eq(checklistItems.inspectionId, id)).orderBy(asc(checklistItems.sortOrder)),
    db.select().from(invoices).where(eq(invoices.inspectionId, id)).limit(1).then(rows => rows[0]),
  ]);

  const isFullyCompliant = row.inspection.complianceScore === 100;
  
  // For the certificate mock-up if 100% compliant
  // In a real flow, the re-inspection would have happened, but for 100% initial pass
  // we can synthesize a "Certificate of Direct Compliance"
  const mockReInspection = {
    id: 0,
    certRef: `BCSO-CERT-DIRECT-${row.inspection.reportNo || row.inspection.code}`,
    originalInspectionId: id,
    contractorId: row.contractor.id,
    remediationBy: "none",
    feeCharged: 0,
    status: "passed",
    scheduledFor: "",
    startedAt: null,
    submittedAt: null,
    certIssuedAt: row.inspection.approvedAt || new Date(),
    issuedByStaffId: null,
    managingDirector: company?.managingDirector || "Managing Director",
    adminNotes: "Auto-issued for 100% initial audit compliance.",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="min-h-screen bg-[var(--brand-navy-deep)] pb-20">
      <div className="no-print">
        <ReportToolbar inspection={row.inspection} property={row.property} staff={mockStaff} company={company} />
      </div>
      <main className="mx-auto max-w-[1180px] px-3 py-6 md:px-6 md:py-10 space-y-12">
        {/* Page 1: The Report */}
        <section>
          <div className="mono-label mb-4 no-print">Document 1: Compliance Shield Report</div>
          <ShieldReport inspection={row.inspection} property={row.property} contractor={row.contractor} items={items} company={company} />
        </section>

        {/* Page 2: The Certificate (Only for 100% Compliance) */}
        {isFullyCompliant && (
          <section className="pt-12 border-t border-white/10">
            <div className="mono-label mb-4 no-print text-[var(--brand-gold)]">Document 2: Compliance Certificate</div>
            <ComplianceCertificate 
              reInspection={mockReInspection} 
              property={row.property} 
              contractor={row.contractor} 
              items={items.map(it => ({...it, reInspectionId: 0, originalItemId: it.id})) as any} 
              company={company} 
            />
          </section>
        )}

        {/* Page 3: The Invoice (If generated) */}
        {invoice && (
          <section className="pt-12 border-t border-white/10">
            <div className="mono-label mb-4 no-print text-[#3ce38e]">Document 3: Client Invoice</div>
            <div className="max-w-[850px] mx-auto">
              <InvoiceDoc invoice={invoice} property={row.property} company={company} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
