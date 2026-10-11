import { notFound } from "next/navigation";
import { db } from "@/db";
import { assessments, hazards, companySettings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { AssessmentDocument } from "@/components/document";
import { DocToolbar } from "@/components/doc-toolbar";

export const dynamic = "force-dynamic";

export default async function AssessmentDocPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
  if (!assessment) notFound();

  const hz = await db.select().from(hazards).where(eq(hazards.assessmentId, id)).orderBy(asc(hazards.sortOrder));
  const [company] = await db.select().from(companySettings).limit(1);

  return (
    <div className="min-h-screen bg-[#08090b]">
      <div className="no-print">
        <DocToolbar assessment={assessment} />
      </div>
      <main className="mx-auto max-w-[1180px] px-3 py-6 md:px-6 md:py-10">
        <AssessmentDocument assessment={assessment} hazards={hz} company={company} />
      </main>
    </div>
  );
}
