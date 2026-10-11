import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, properties, inspections } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

function generateInvoiceNo(seq: number) {
  return `BCSO-INV-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ invoice: invoices, property: properties, inspection: inspections })
    .from(invoices)
    .innerJoin(properties, eq(invoices.propertyId, properties.id))
    .leftJoin(inspections, eq(invoices.inspectionId, inspections.id))
    .orderBy(desc(invoices.createdAt));

  return NextResponse.json(rows.map(({ invoice, property, inspection }) => ({ ...invoice, property, inspection })));
}

export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    propertyId: number;
    inspectionId?: number;
    amount: number;
    dueDate?: string;
  };

  if (!body.propertyId || !body.amount) {
    return NextResponse.json({ error: "Property and amount are required." }, { status: 400 });
  }

  const [{ value: seq }] = await db.select({ value: count() }).from(invoices);
  
  const [created] = await db
    .insert(invoices)
    .values({
      invoiceNo: generateInvoiceNo(seq + 1),
      propertyId: body.propertyId,
      inspectionId: body.inspectionId || null,
      amount: body.amount,
      status: "draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 14 * 86400000),
    })
    .returning();

  return NextResponse.json({ invoice: created });
}
