import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { status?: "sent" | "paid" | "void"; paidAt?: string };

  const [updated] = await db
    .update(invoices)
    .set({
      status: body.status ?? invoice.status,
      paidAt: body.paidAt ? new Date(body.paidAt) : (body.status === "paid" ? new Date() : invoice.paidAt),
    })
    .where(eq(invoices.id, id))
    .returning();

  return NextResponse.json({ invoice: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const id = Number((await ctx.params).id);
  await db.delete(invoices).where(eq(invoices.id, id));
  return NextResponse.json({ ok: true });
}
