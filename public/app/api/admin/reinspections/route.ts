import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  reInspections, reInspectionItems, inspections, checklistItems,
  contractors, properties, companySettings,
} from "@/db/schema";
import { asc, count, desc, eq } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

function certRef(seq: number) {
  return `BCSO-CERT-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

/** GET — list all re-inspections with original property & contractor. */
export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ ri: reInspections, property: properties, contractor: contractors })
    .from(reInspections)
    .innerJoin(inspections, eq(reInspections.originalInspectionId, inspections.id))
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .innerJoin(contractors, eq(reInspections.contractorId, contractors.id))
    .orderBy(desc(reInspections.createdAt));

  return NextResponse.json(rows.map(({ ri, property, contractor }) => ({ ...ri, property, contractor })));
}

/** POST — create a re-inspection from the failed items of an approved inspection. */
export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "finalizer"].includes(staff.role)) {
    return NextResponse.json({ error: "Admin or finalizer required." }, { status: 403 });
  }

  const body = (await req.json()) as {
    originalInspectionId: number;
    contractorId: number;
    remediationBy: "bcso" | "outside";
    scheduledFor?: string;
    managingDirector?: string;
  };

  if (!body.originalInspectionId || !body.contractorId) {
    return NextResponse.json({ error: "originalInspectionId and contractorId are required." }, { status: 400 });
  }

  const [original] = await db.select().from(inspections).where(eq(inspections.id, body.originalInspectionId));
  if (!original || original.status !== "approved") {
    return NextResponse.json({ error: "Original inspection must be approved before re-inspection." }, { status: 409 });
  }

  // Pull the failed items only
  const failedItems = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.inspectionId, body.originalInspectionId))
    .orderBy(asc(checklistItems.sortOrder));
  const fails = failedItems.filter((i) => i.status === "fail");
  if (fails.length === 0) {
    return NextResponse.json({ error: "No failed items found on the original inspection — nothing to re-inspect." }, { status: 400 });
  }

  // Certificate reference number
  const [{ value: seq }] = await db.select({ value: count() }).from(reInspections);
  const ref = certRef(seq + 1);

  // Fetch managing director from company settings if not supplied
  const [company] = await db.select().from(companySettings).limit(1);
  const managingDirector = body.managingDirector || company?.managingDirector || "";

  const feeCharged = body.remediationBy === "bcso" ? 0 : 250;

  const [ri] = await db
    .insert(reInspections)
    .values({
      certRef: ref,
      originalInspectionId: body.originalInspectionId,
      contractorId: body.contractorId,
      remediationBy: body.remediationBy || "outside",
      feeCharged,
      scheduledFor: body.scheduledFor || "",
      managingDirector,
    })
    .returning();

  // Seed re-inspection items from the original fails
  await db.insert(reInspectionItems).values(
    fails.map((f) => ({
      reInspectionId: ri.id,
      originalItemId: f.id,
      label: f.label,
      requirement: f.requirement,
      severity: f.severity,
      status: "pending",
      note: "",
    }))
  );

  return NextResponse.json({ reInspection: ri });
}
