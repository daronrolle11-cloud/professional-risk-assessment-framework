import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publicStaff, verifyStaffRequest } from "@/lib/staff-auth";

/** GET — return the signed-in staff member's public profile. */
export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ staff: publicStaff(staff) });
}

/** PATCH — update own profile (name, phone, title). */
export async function PATCH(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { name?: string; phone?: string; title?: string };

  const [updated] = await db
    .update(staffUsers)
    .set({
      name: body.name?.trim() || staff.name,
      phone: body.phone ?? staff.phone,
      title: body.title ?? staff.title,
    })
    .where(eq(staffUsers.id, staff.id))
    .returning();

  return NextResponse.json({ staff: publicStaff(updated) });
}
