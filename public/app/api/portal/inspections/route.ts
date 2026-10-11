import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, properties, checklistItems, reInspections, reInspectionItems } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { verifyContractor } from "@/lib/portal-auth";

/** Contractor's assignment list. */
export async function GET(req: NextRequest) {
  const contractor = await verifyContractor(req);
  if (!contractor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [standardInspections, reInsps] = await Promise.all([
    db
      .select({ inspection: inspections, property: properties })
      .from(inspections)
      .innerJoin(properties, eq(inspections.propertyId, properties.id))
      .where(eq(inspections.contractorId, contractor.id))
      .orderBy(desc(inspections.createdAt)),
    db
      .select({ ri: reInspections, property: properties })
      .from(reInspections)
      .innerJoin(inspections, eq(reInspections.originalInspectionId, inspections.id))
      .innerJoin(properties, eq(inspections.propertyId, properties.id))
      .where(eq(reInspections.contractorId, contractor.id))
      .orderBy(desc(reInspections.createdAt))
  ]);

  const [checklistItemsList, reItemRows] = await Promise.all([
    db.select().from(checklistItems),
    db.select().from(reInspectionItems),
  ]);

  const byInspection = new Map<number, typeof checklistItemsList>();
  for (const it of checklistItemsList) {
    const list = byInspection.get(it.inspectionId) ?? [];
    list.push(it);
    byInspection.set(it.inspectionId, list);
  }

  const byReInspection = new Map<number, typeof reItemRows>();
  for (const it of reItemRows) {
    const list = byReInspection.get(it.reInspectionId) ?? [];
    list.push(it);
    byReInspection.set(it.reInspectionId, list);
  }

  const standard = standardInspections.map(({ inspection, property }) => {
    const its = byInspection.get(inspection.id) ?? [];
    const done = its.filter((i) => i.status !== "pending").length;
    const fails = its.filter((i) => i.status === "fail").length;
    return { 
      ...inspection, 
      property, 
      itemCount: its.length, 
      doneCount: done, 
      failCount: fails,
      type: 'standard'
    };
  });

  const reInspectionsList = reInsps.map(({ ri, property }) => {
    const its = byReInspection.get(ri.id) ?? [];
    const done = its.filter((i) => i.status !== "pending").length;
    const fails = its.filter((i) => i.status === "fail").length;
    return {
      id: ri.id,
      code: ri.certRef,
      status: ri.status,
      scheduledFor: ri.scheduledFor,
      createdAt: ri.createdAt,
      property,
      itemCount: its.length,
      doneCount: done,
      failCount: fails,
      type: 'reinspection'
    };
  });

  return NextResponse.json([...standard, ...reInspectionsList].sort((a, b) => 
    new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  ));
}
