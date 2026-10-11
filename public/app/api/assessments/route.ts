import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { assessments, hazards } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { AssessmentForm } from "@/lib/types";
import { verifyStaffRequest } from "@/lib/staff-auth";

export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  const allHazards = await db.select().from(hazards);

  const byAssessment = new Map<number, typeof allHazards>();
  for (const h of allHazards) {
    const list = byAssessment.get(h.assessmentId) ?? [];
    list.push(h);
    byAssessment.set(h.assessmentId, list);
  }

  const payload = rows.map((a) => {
    const hz = byAssessment.get(a.id) ?? [];
    const maxScore = hz.reduce((m, h) => Math.max(m, h.likelihood * h.severity), 0);
    return {
      ...a,
      hazardCount: hz.length,
      maxScore,
      residualMax: hz.reduce((m, h) => Math.max(m, h.residualLikelihood * h.residualSeverity), 0),
    };
  });

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as AssessmentForm;
  if (!body.activity?.trim() || !body.organization?.trim()) {
    return NextResponse.json({ error: "Organization and activity are required." }, { status: 400 });
  }

  const [created] = await db
    .insert(assessments)
    .values({
      assessmentNo: body.assessmentNo,
      status: body.status ?? "draft",
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
    })
    .returning({ id: assessments.id });

  if (body.hazards?.length) {
    await db.insert(hazards).values(
      body.hazards.map((h, i) => ({
        assessmentId: created.id,
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

  return NextResponse.json({ id: created.id });
}
