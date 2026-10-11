import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  reInspections, reInspectionItems, inspections, properties, contractors, companySettings,
  type PhotoEvidence,
} from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { verifyStaffRequest, publicStaff } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [ri] = await db.select().from(reInspections).where(eq(reInspections.id, id));
  if (!ri) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [origRow] = await db
    .select({ inspection: inspections, property: properties, contractor: contractors })
    .from(inspections)
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .innerJoin(contractors, eq(inspections.contractorId, contractors.id))
    .where(eq(inspections.id, ri.originalInspectionId));

  const items = await db
    .select()
    .from(reInspectionItems)
    .where(eq(reInspectionItems.reInspectionId, id))
    .orderBy(asc(reInspectionItems.id));

  const [company] = await db.select().from(companySettings).limit(1);

  const allPassed = items.length > 0 && items.every((i) => i.status === "pass");

  return NextResponse.json({
    reInspection: ri,
    originalProperty: origRow?.property,
    originalContractor: origRow?.contractor,
    originalInspection: origRow?.inspection,
    items,
    allPassed,
    company,
    staff: publicStaff(staff),
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [ri] = await db.select().from(reInspections).where(eq(reInspections.id, id));
  if (!ri) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    action?: "issueCertificate" | "updateNotes";
    managingDirector?: string;
    adminNotes?: string;
    // Item-level updates
    items?: { id: number; status: "pass" | "fail"; note: string; photos?: PhotoEvidence[] }[];
  };

  // Update item statuses
  if (body.items?.length) {
    for (const item of body.items) {
      await db
        .update(reInspectionItems)
        .set({ status: item.status, note: item.note, ...(item.photos !== undefined ? { photos: item.photos } : {}) })
        .where(and(eq(reInspectionItems.id, item.id), eq(reInspectionItems.reInspectionId, id)));
    }
  }

  if (body.action === "issueCertificate") {
    if (!["admin", "finalizer"].includes(staff.role)) {
      return NextResponse.json({ error: "Admin or finalizer required to issue certificate." }, { status: 403 });
    }
    // Confirm all items passed
    const items = await db.select().from(reInspectionItems).where(eq(reInspectionItems.reInspectionId, id));
    const outstanding = items.filter((i) => i.status !== "pass");
    if (outstanding.length > 0) {
      return NextResponse.json({ error: `${outstanding.length} item(s) not yet marked PASS. All must pass before the certificate can be issued.` }, { status: 400 });
    }
    const [updated] = await db
      .update(reInspections)
      .set({
        status: "passed",
        certIssuedAt: new Date(),
        issuedByStaffId: staff.id,
        managingDirector: body.managingDirector || ri.managingDirector,
        adminNotes: body.adminNotes || ri.adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(reInspections.id, id))
      .returning();
    return NextResponse.json({ reInspection: updated });
  }

  if (body.action === "updateNotes") {
    const [updated] = await db
      .update(reInspections)
      .set({
        managingDirector: body.managingDirector ?? ri.managingDirector,
        adminNotes: body.adminNotes ?? ri.adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(reInspections.id, id))
      .returning();
    return NextResponse.json({ reInspection: updated });
  }

  // Status updates
  if (ri.status === "assigned") {
    await db.update(reInspections).set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() }).where(eq(reInspections.id, id));
  } else {
    await db.update(reInspections).set({ updatedAt: new Date() }).where(eq(reInspections.id, id));
  }

  return NextResponse.json({ ok: true });
}
