import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, properties, contractors, checklistItems, reportDeliveries, staffUsers, invoices } from "@/db/schema";
import { and, asc, eq, count } from "drizzle-orm";
import { computeComplianceScore, reportNumberFor } from "@/lib/operations";
import { publicStaff, roleAllows, verifyStaffRequest } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [row] = await db
    .select({ inspection: inspections, property: properties, contractor: contractors })
    .from(inspections)
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .innerJoin(contractors, eq(inspections.contractorId, contractors.id))
    .where(eq(inspections.id, id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [items, deliveries, allStaff] = await Promise.all([
    db.select().from(checklistItems).where(eq(checklistItems.inspectionId, id)).orderBy(asc(checklistItems.sortOrder)),
    db.select().from(reportDeliveries).where(eq(reportDeliveries.inspectionId, id)).orderBy(asc(reportDeliveries.createdAt)),
    db.select().from(staffUsers),
  ]);
  const result = computeComplianceScore(items);

  const byId = new Map(allStaff.map((s) => [s.id, s]));

  return NextResponse.json({
    staff: publicStaff(staff),
    inspection: row.inspection,
    property: row.property,
    contractor: row.contractor,
    items,
    result,
    audit: {
      reviewedBy: row.inspection.reviewedByStaffId ? publicStaff(byId.get(row.inspection.reviewedByStaffId)!) : null,
      finalizedBy: row.inspection.finalizedByStaffId ? publicStaff(byId.get(row.inspection.finalizedByStaffId)!) : null,
      sentBy: row.inspection.sentByStaffId ? publicStaff(byId.get(row.inspection.sentByStaffId)!) : null,
      deliveries,
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
  if (!inspection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { action: "review" | "return" | "finalize" | "markSent"; adminNote?: string; signatureData?: string };

  if (body.action === "review") {
    if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "review")) {
      return NextResponse.json({ error: "You do not have permission to review reports." }, { status: 403 });
    }
    if (inspection.status !== "pending_review") {
      return NextResponse.json({ error: "Only submissions pending review can be reviewed." }, { status: 409 });
    }
    const items = await db.select().from(checklistItems).where(eq(checklistItems.inspectionId, id));
    const result = computeComplianceScore(items);
    const [updated] = await db
      .update(inspections)
      .set({
        reviewStage: "reviewed",
        complianceScore: result.score,
        reportNo: inspection.reportNo ?? reportNumberFor(id),
        reviewedAt: new Date(),
        reviewedByStaffId: staff.id,
        adminNote: body.adminNote ?? inspection.adminNote,
        updatedAt: new Date(),
      })
      .where(eq(inspections.id, id))
      .returning();
    return NextResponse.json({ ok: true, inspection: updated, score: result.score });
  }

  if (body.action === "return") {
    if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "review")) {
      return NextResponse.json({ error: "You do not have permission to return reports." }, { status: 403 });
    }
    if (inspection.status !== "pending_review") {
      return NextResponse.json({ error: "Only submissions pending review can be returned." }, { status: 409 });
    }
    const [updated] = await db
      .update(inspections)
      .set({
        status: "returned",
        reviewStage: "pending",
        adminNote: body.adminNote ?? "",
        reviewedAt: new Date(),
        reviewedByStaffId: staff.id,
        updatedAt: new Date(),
      })
      .where(eq(inspections.id, id))
      .returning();
    return NextResponse.json({ ok: true, inspection: updated });
  }

  if (body.action === "finalize") {
    if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "finalize")) {
      return NextResponse.json({ error: "You do not have permission to finalize reports." }, { status: 403 });
    }
    if (inspection.reviewStage !== "reviewed" && inspection.reviewStage !== "finalized" && inspection.reviewStage !== "sent") {
      return NextResponse.json({ error: "Only reviewed reports can be finalized." }, { status: 409 });
    }

    const updates: any = {
        status: "approved",
        reviewStage: "finalized",
        approvedAt: new Date(),
        finalizedAt: new Date(),
        finalizedByStaffId: staff.id,
        adminNote: body.adminNote ?? inspection.adminNote,
        updatedAt: new Date(),
    };

    if (body.signatureData) {
        updates.signatureData = body.signatureData;
        updates.signedAt = new Date();
        updates.signedByStaffId = staff.id;
    }

    const [updated] = await db
      .update(inspections)
      .set(updates)
      .where(eq(inspections.id, id))
      .returning();

    // ── Automated Invoicing Logic ──────────────────────────────────────────
    const [existingInvoice] = await db.select().from(invoices).where(eq(invoices.inspectionId, id));
    if (!existingInvoice) {
        const [{ value: seq }] = await db.select({ value: count() }).from(invoices);
        const invoiceNo = `BCSO-INV-${new Date().getFullYear()}-${String(seq + 1).padStart(4, "0")}`;
        await db.insert(invoices).values({
            invoiceNo,
            propertyId: inspection.propertyId,
            inspectionId: id,
            amount: 350, // Standard Inspection Fee
            status: "draft",
            dueDate: new Date(Date.now() + 14 * 86400000),
        });
    }

    return NextResponse.json({ ok: true, inspection: updated });
  }

  if (body.action === "markSent") {
    if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "send")) {
      return NextResponse.json({ error: "You do not have permission to mark reports sent." }, { status: 403 });
    }
    await db
      .update(inspections)
      .set({ reviewStage: "sent", sentByStaffId: staff.id, clientNotifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(inspections.id, id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
