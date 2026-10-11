import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const id = Number((await ctx.params).id);
  await db.delete(workers).where(eq(workers.id, id));
  return NextResponse.json({ ok: true });
}
