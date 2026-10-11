import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, checklistItems } from "@/db/schema";
import { count } from "drizzle-orm";
import { generateInspectionCode, templateForTrade } from "@/lib/operations";
import { verifyStaffRequest } from "@/lib/staff-auth";

/** Create an assignment: generates the inspection code and pre-loads the trade checklist. */
export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    propertyId?: number;
    contractorId?: number;
    trade?: string;
    scheduledFor?: string;
  };
  if (!body.propertyId || !body.contractorId || !body.trade) {
    return NextResponse.json({ error: "Property, contractor and trade are required." }, { status: 400 });
  }

  const [{ value: seq }] = await db.select({ value: count() }).from(inspections);

  const [created] = await db
    .insert(inspections)
    .values({
      code: generateInspectionCode(seq + 1),
      propertyId: body.propertyId,
      contractorId: body.contractorId,
      trade: body.trade,
      scheduledFor: body.scheduledFor ?? "",
      status: "assigned",
    })
    .returning();

  const template = templateForTrade(body.trade);
  await db.insert(checklistItems).values(
    template.map((item, i) => ({
      inspectionId: created.id,
      sortOrder: i,
      label: item.label,
      requirement: item.requirement,
      severity: item.severity,
    }))
  );

  return NextResponse.json(created);
}
