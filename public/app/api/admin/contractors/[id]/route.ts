import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contractors, inspections } from "@/db/schema";
import { and, count, eq, ne } from "drizzle-orm";
import { verifyStaffRequest, roleAllows } from "@/lib/staff-auth";
import { generateAccessCode } from "@/lib/operations";

type Ctx = { params: Promise<{ id: string }> };

/** GET — fetch one contractor with their inspection history counts. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number((await ctx.params).id);
  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
  if (!contractor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ value: totalJobs }] = await db
    .select({ value: count() })
    .from(inspections)
    .where(eq(inspections.contractorId, id));

  const [{ value: completedJobs }] = await db
    .select({ value: count() })
    .from(inspections)
    .where(and(eq(inspections.contractorId, id), eq(inspections.status, "approved")));

  return NextResponse.json({ contractor, totalJobs, completedJobs });
}

/** PATCH — update, deactivate/reactivate, or regenerate access code. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "finalize")) {
    return NextResponse.json({ error: "Admin or finalizer role required." }, { status: 403 });
  }

  const id = Number((await ctx.params).id);
  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
  if (!contractor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as {
    action: "update" | "deactivate" | "reactivate" | "regenerate";
    name?: string;
    phone?: string;
    email?: string;
  };

  if (body.action === "deactivate") {
    const [updated] = await db
      .update(contractors)
      .set({ active: "false", sessionToken: null })
      .where(eq(contractors.id, id))
      .returning();
    return NextResponse.json({ contractor: updated });
  }

  if (body.action === "reactivate") {
    const [updated] = await db
      .update(contractors)
      .set({ active: "true" })
      .where(eq(contractors.id, id))
      .returning();
    return NextResponse.json({ contractor: updated });
  }

  if (body.action === "regenerate") {
    let newCode = generateAccessCode(contractor.trade);
    for (let i = 0; i < 10; i++) {
      const [clash] = await db
        .select()
        .from(contractors)
        .where(and(eq(contractors.accessCode, newCode), ne(contractors.id, id)));
      if (!clash) break;
      newCode = generateAccessCode(contractor.trade);
    }
    const [updated] = await db
      .update(contractors)
      .set({ accessCode: newCode, sessionToken: null })
      .where(eq(contractors.id, id))
      .returning();
    return NextResponse.json({ contractor: updated });
  }

  if (body.action === "update") {
    const [updated] = await db
      .update(contractors)
      .set({
        name: body.name?.trim() || contractor.name,
        phone: body.phone ?? contractor.phone,
        email: body.email ?? contractor.email,
      })
      .where(eq(contractors.id, id))
      .returning();
    return NextResponse.json({ contractor: updated });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

/** DELETE — permanent removal (admin only). */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "admin") {
    return NextResponse.json({ error: "Admin role required to delete contractors." }, { status: 403 });
  }

  const id = Number((await ctx.params).id);
  await db.delete(contractors).where(eq(contractors.id, id));
  return NextResponse.json({ ok: true });
}
