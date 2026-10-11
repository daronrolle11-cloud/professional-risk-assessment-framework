import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incidents, properties, invoices, type PhotoEvidence } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { verifyStaffRequest, roleAllows } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [site] = await db.select().from(properties).where(eq(properties.id, incident.siteId));

  return NextResponse.json({ incident, site });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  
  const updates: any = {};
  if (body.rootCause !== undefined) updates.rootCause = body.rootCause;
  if (body.status !== undefined) updates.status = body.status;
  if (body.photos !== undefined) updates.photos = body.photos;
  
  // ── Signature Logic ──────────────────────────────────────────────────────
  if (body.signatureData) {
    updates.signatureData = body.signatureData;
    updates.signedAt = new Date();
    updates.signedByStaffId = staff.id;
    updates.status = "closed";

    // ── Automated Invoicing Logic ──────────────────────────────────────────
    // On closing an incident investigation, auto-generate a fee for the oversight
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.inspectionId, -id)); // Use negative ID as marker for incident invoices or use a new type field
      
    if (!existingInvoice) {
        const [{ value: seq }] = await db.select({ value: count() }).from(invoices);
        const invoiceNo = `BCSO-INV-${new Date().getFullYear()}-${String(seq + 1).padStart(4, "0")}`;
        
        await db.insert(invoices).values({
            invoiceNo,
            propertyId: incident.siteId,
            inspectionId: null, // we could add incident_id to schema but for now we link via description
            amount: 150, // Standard Incident Investigation Fee
            status: "draft",
            dueDate: new Date(Date.now() + 7 * 86400000), // 7 day term
        });
    }
  }

  const [updated] = await db
    .update(incidents)
    .set(updates)
    .where(eq(incidents.id, id))
    .returning();

  return NextResponse.json({ incident: updated });
}
