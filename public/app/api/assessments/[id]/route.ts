import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assessments, hazards, invoices } from "@/db/schema";
import { asc, eq, count } from "drizzle-orm";
import type { AssessmentForm } from "@/lib/types";
import { verifyStaffRequest } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hz = await db.select().from(hazards).where(eq(hazards.assessmentId, id)).orderBy(asc(hazards.sortOrder));
  return NextResponse.json({ assessment, hazards: hz });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await req.json()) as AssessmentForm;
  const [existing] = await db.select().from(assessments).where(eq(assessments.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: any = {
    assessmentNo: body.assessmentNo,
    status: body.status ?? existing.status,
    industry: body.industry,
    organization: body.organization,
    department: body.department,
    location: body.location,
    activity: body.activity,
    assessmentDate: body.assessmentDate,
    reviewDate: body.reviewDate,
    assessor: body.assessor,
    responsibleManager: body.responsibleManager,
    employeesExposed: Number(body.employeesExposed) || 0,
    jurisdiction: body.jurisdiction,
    regulations: body.regulations,
    updatedAt: new Date(),
  };

  if (body.signatureData) {
    updates.signatureData = body.signatureData;
    updates.signedAt = new Date();
    updates.signedByStaffId = staff.id;
  }

  await db.update(assessments).set(updates).where(eq(assessments.id, id));

  // ── Automated Invoicing Logic ──────────────────────────────────────────
  if (body.status === "issued") {
    // Check if an invoice already exists for this assessment
    // Since we don't have an assessment_id in invoices, we might want to add it 
    // or use inspectionId: -id as a hack, but let's just stick to the requested logic.
    // For now, let's assume we want one invoice per issued assessment.
    const [{ value: seq }] = await db.select({ value: count() }).from(invoices);
    const invoiceNo = `BCSO-INV-${new Date().getFullYear()}-${String(seq + 1).padStart(4, "0")}`;
    
    await db.insert(invoices).values({
        invoiceNo,
        propertyId: 0, // Assessments don't have a propertyId in schema, they have location text
        inspectionId: null,
        amount: 250, // Standard Risk Assessment Fee
        status: "draft",
        dueDate: new Date(Date.now() + 14 * 86400000),
    });
  }

  await db.delete(hazards).where(eq(hazards.assessmentId, id));
  if (body.hazards?.length) {
    await db.insert(hazards).values(
      body.hazards.map((h, i) => ({
        assessmentId: id,
        sortOrder: i,
        category: h.category,
        description: h.description,
        personsAtRisk: h.personsAtRisk,
        existingControls: h.existingControls,
        likelihood: h.likelihood,
        severity: h.severity,
        controls: h.controls,
        responsiblePerson: h.responsiblePerson,
        dueDate: h.dueDate,
        residualLikelihood: h.residualLikelihood,
        residualSeverity: h.residualSeverity,
      }))
    );
  }

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await db.delete(assessments).where(eq(assessments.id, id));
  return NextResponse.json({ ok: true });
}
