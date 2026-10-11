import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, properties, checklistItems, reInspections, reInspectionItems } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { verifyContractor } from "@/lib/portal-auth";
import { computeComplianceScore, reportNumberFor } from "@/lib/operations";
import type { ItemStatus } from "@/db/schema";

type Ctx = { params: Promise<{ id: string }> };

const CONTRACTOR_EDITABLE = ["assigned", "in_progress", "returned"];

export async function GET(req: NextRequest, ctx: Ctx) {
  const contractor = await verifyContractor(req);
  if (!contractor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  
  // Try standard first
  const [standardRow] = await db
    .select({ inspection: inspections, property: properties })
    .from(inspections)
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .where(and(eq(inspections.id, id), eq(inspections.contractorId, contractor.id)));
    
  if (standardRow) {
    const items = await db.select().from(checklistItems).where(eq(checklistItems.inspectionId, id)).orderBy(asc(checklistItems.sortOrder));
    return NextResponse.json({ inspection: standardRow.inspection, property: standardRow.property, items, type: 'standard' });
  }

  // Try re-inspection
  const [reRow] = await db
    .select({ ri: reInspections, property: properties })
    .from(reInspections)
    .innerJoin(inspections, eq(reInspections.originalInspectionId, inspections.id))
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .where(and(eq(reInspections.id, id), eq(reInspections.contractorId, contractor.id)));

  if (reRow) {
    const items = await db.select().from(reInspectionItems).where(eq(reInspectionItems.reInspectionId, id)).orderBy(asc(reInspectionItems.id));
    return NextResponse.json({
      inspection: {
        id: reRow.ri.id,
        code: reRow.ri.certRef,
        status: reRow.ri.status,
        scheduledFor: reRow.ri.scheduledFor,
        startedAt: reRow.ri.startedAt,
        submittedAt: reRow.ri.submittedAt,
        trade: 'Re-Inspection'
      },
      property: reRow.property,
      items,
      type: 'reinspection'
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

interface ItemPatch {
  id: number;
  status: ItemStatus;
  note: string;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const contractor = await verifyContractor(req);
  if (!contractor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  
  // Try standard first
  const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
  
  if (inspection && inspection.contractorId === contractor.id) {
    const body = (await req.json()) as { action: "start" | "save" | "submit"; items?: ItemPatch[] };

    if (!CONTRACTOR_EDITABLE.includes(inspection.status)) {
      return NextResponse.json({ error: "This inspection is locked for review." }, { status: 409 });
    }

    if (body.items?.length) {
      for (const p of body.items) {
        await db
          .update(checklistItems)
          .set({ status: p.status, note: p.note })
          .where(and(eq(checklistItems.id, p.id), eq(checklistItems.inspectionId, id)));
      }
    }

    if (body.action === "start") {
      await db
        .update(inspections)
        .set({ status: "in_progress", startedAt: inspection.startedAt ?? new Date(), updatedAt: new Date() })
        .where(eq(inspections.id, id));
      return NextResponse.json({ ok: true, status: "in_progress" });
    }

    if (body.action === "submit") {
      const items = await db.select().from(checklistItems).where(eq(checklistItems.inspectionId, id));
      if (items.some((i) => i.status === "pending")) return NextResponse.json({ error: "All items must be answered." }, { status: 400 });
      if (items.some((i) => i.status === "fail" && i.photos.length === 0)) return NextResponse.json({ error: "Photos required for fails." }, { status: 400 });
      
      const result = computeComplianceScore(items);
      await db.update(inspections).set({ status: "pending_review", submittedAt: new Date(), complianceScore: result.score, reportNo: reportNumberFor(id), updatedAt: new Date() }).where(eq(inspections.id, id));
      return NextResponse.json({ ok: true, status: "pending_review", score: result.score });
    }

    await db.update(inspections).set({ updatedAt: new Date() }).where(eq(inspections.id, id));
    return NextResponse.json({ ok: true, status: inspection.status });
  }

  // Try re-inspection
  const [ri] = await db.select().from(reInspections).where(eq(reInspections.id, id));
  if (ri && ri.contractorId === contractor.id) {
    const body = (await req.json()) as { action: "start" | "save" | "submit"; items?: ItemPatch[] };
    
    if (ri.status === "passed") return NextResponse.json({ error: "Already passed." }, { status: 409 });

    if (body.items?.length) {
      for (const p of body.items) {
        await db
          .update(reInspectionItems)
          .set({ status: p.status, note: p.note })
          .where(and(eq(reInspectionItems.id, p.id), eq(reInspectionItems.reInspectionId, id)));
      }
    }

    if (body.action === "start") {
      await db.update(reInspections).set({ status: "in_progress", startedAt: new Date() }).where(eq(reInspections.id, id));
      return NextResponse.json({ ok: true, status: "in_progress" });
    }

    if (body.action === "submit") {
      const items = await db.select().from(reInspectionItems).where(eq(reInspectionItems.reInspectionId, id));
      if (items.some((i) => i.status === "pending")) return NextResponse.json({ error: "All items must be answered." }, { status: 400 });
      
      // Enforce: If it passes, it MUST have a photo proving the repair
      if (items.some((i) => i.status === "pass" && i.photos.length === 0)) {
        return NextResponse.json({ error: "Photo evidence of the completed repair is required for all passed items." }, { status: 400 });
      }

      await db.update(reInspections).set({ status: "in_progress", submittedAt: new Date() }).where(eq(reInspections.id, id));
      return NextResponse.json({ ok: true, status: "in_progress" });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
