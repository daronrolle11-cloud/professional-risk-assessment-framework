import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contractors, properties, inspections, checklistItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { computeComplianceScore } from "@/lib/operations";
import { publicStaff, verifyStaffRequest } from "@/lib/staff-auth";

/** Everything the Administrative Hub needs in one payload. */
export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [allContractors, allProperties, rows, allItems] = await Promise.all([
    db.select().from(contractors).orderBy(contractors.name),
    db.select().from(properties).orderBy(properties.name),
    db
      .select({ inspection: inspections, property: properties, contractor: contractors })
      .from(inspections)
      .innerJoin(properties, eq(inspections.propertyId, properties.id))
      .innerJoin(contractors, eq(inspections.contractorId, contractors.id))
      .orderBy(desc(inspections.updatedAt)),
    db.select().from(checklistItems),
  ]);

  const itemsByInspection = new Map<number, typeof allItems>();
  for (const it of allItems) {
    const list = itemsByInspection.get(it.inspectionId) ?? [];
    list.push(it);
    itemsByInspection.set(it.inspectionId, list);
  }

  const payload = rows.map(({ inspection, property, contractor }) => {
    const its = itemsByInspection.get(inspection.id) ?? [];
    const result = computeComplianceScore(its);
    const photoCount = its.reduce((n, i) => n + i.photos.length, 0);
    return {
      ...inspection,
      property,
      contractor: { id: contractor.id, name: contractor.name, trade: contractor.trade, island: contractor.island },
      stats: { ...result, total: its.length, photoCount },
    };
  });

  return NextResponse.json({
    staff: publicStaff(staff),
    contractors: allContractors,
    properties: allProperties,
    inspections: payload,
  });
}
