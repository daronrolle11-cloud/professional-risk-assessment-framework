import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { verifyStaffRequest, publicStaff, generateStaffCode } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const me = await verifyStaffRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = Number((await ctx.params).id);
  const isSelf = me.id === targetId;

  if (!isSelf && me.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const [target] = await db.select().from(staffUsers).where(eq(staffUsers.id, targetId));
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = (await req.json()) as {
    action?: "update" | "deactivate" | "reactivate" | "regenerate" | "changeRole";
    name?: string;
    phone?: string;
    title?: string;
    email?: string;
    role?: string;
  };

  if (body.action === "regenerate") {
    if (me.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });
    let newCode = generateStaffCode();
    for (let i = 0; i < 10; i++) {
      const [clash] = await db.select().from(staffUsers).where(and(eq(staffUsers.accessCode, newCode), ne(staffUsers.id, targetId)));
      if (!clash) break;
      newCode = generateStaffCode();
    }
    const [updated] = await db
      .update(staffUsers)
      .set({ accessCode: newCode, sessionToken: null })
      .where(eq(staffUsers.id, targetId))
      .returning();
    return NextResponse.json({ staff: publicStaff(updated) });
  }

  if (body.action === "deactivate") {
    if (me.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });
    if (isSelf) return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
    const [updated] = await db
      .update(staffUsers)
      .set({ active: "false", sessionToken: null })
      .where(eq(staffUsers.id, targetId))
      .returning();
    return NextResponse.json({ staff: publicStaff(updated) });
  }

  if (body.action === "reactivate") {
    if (me.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const [updated] = await db
      .update(staffUsers)
      .set({ active: "true" })
      .where(eq(staffUsers.id, targetId))
      .returning();
    return NextResponse.json({ staff: publicStaff(updated) });
  }

  if (body.action === "changeRole") {
    if (me.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });
    if (!body.role || !["reviewer", "finalizer", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    const [updated] = await db
      .update(staffUsers)
      .set({ role: body.role })
      .where(eq(staffUsers.id, targetId))
      .returning();
    return NextResponse.json({ staff: publicStaff(updated) });
  }

  // Default: profile update
  const [updated] = await db
    .update(staffUsers)
    .set({
      name: body.name?.trim() || target.name,
      phone: body.phone ?? target.phone,
      title: body.title ?? target.title,
      email: me.role === "admin" ? (body.email?.trim().toLowerCase() ?? target.email) : target.email,
    })
    .where(eq(staffUsers.id, targetId))
    .returning();
  return NextResponse.json({ staff: publicStaff(updated) });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const me = await verifyStaffRequest(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const targetId = Number((await ctx.params).id);
  if (me.id === targetId) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  await db.delete(staffUsers).where(eq(staffUsers.id, targetId));
  return NextResponse.json({ ok: true });
}
