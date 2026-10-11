import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { verifyStaffRequest, publicStaff, generateStaffCode } from "@/lib/staff-auth";

/** GET — list all staff (admin only). */
export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const rows = await db.select().from(staffUsers).orderBy(asc(staffUsers.name));
  return NextResponse.json(rows.map(publicStaff));
}

/** POST — create a new staff member (admin only). Returns their access code. */
export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "admin") return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = (await req.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
    role?: string;
  };

  if (!body.name?.trim() || !body.role) {
    return NextResponse.json({ error: "Name and role are required." }, { status: 400 });
  }
  if (!["reviewer", "finalizer", "admin"].includes(body.role)) {
    return NextResponse.json({ error: "Role must be reviewer, finalizer or admin." }, { status: 400 });
  }

  // Generate unique access code
  let accessCode = generateStaffCode();
  for (let i = 0; i < 10; i++) {
    const [clash] = await db.select().from(staffUsers).where(eq(staffUsers.accessCode, accessCode));
    if (!clash) break;
    accessCode = generateStaffCode();
  }

  const [created] = await db
    .insert(staffUsers)
    .values({
      name: body.name.trim(),
      email: body.email?.trim().toLowerCase() ?? "",
      phone: body.phone ?? "",
      title: body.title ?? "",
      role: body.role,
      accessCode,
      createdByStaffId: staff.id,
    })
    .returning();

  return NextResponse.json({ staff: publicStaff(created) });
}
