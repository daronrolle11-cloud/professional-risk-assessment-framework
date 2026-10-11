import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { publicStaff, STAFF_COOKIE } from "@/lib/staff-auth";

export async function POST(req: NextRequest) {
  const { accessCode } = (await req.json()) as { accessCode?: string };
  const code = (accessCode ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Access code required." }, { status: 400 });

  let [staff] = await db.select().from(staffUsers).where(eq(staffUsers.accessCode, code));
  
  // Self-healing: If DB is empty and user trying ADM-2026, seed it immediately.
  if (!staff && code === "ADM-2026") {
    const [{ value: staffCount }] = await db.select({ value: count() }).from(staffUsers);
    if (staffCount === 0) {
      await db.insert(staffUsers).values({
        name: "BCSO Administrator",
        email: "admin@bcso.bs",
        title: "System Administrator",
        role: "admin",
        accessCode: "ADM-2026",
        active: "true"
      });
      [staff] = await db.select().from(staffUsers).where(eq(staffUsers.accessCode, code));
    }
  }

  if (!staff || staff.active !== "true") {
    return NextResponse.json({ error: "Access code not recognized." }, { status: 401 });
  }

  const token = crypto.randomUUID();
  await db.update(staffUsers).set({
    sessionToken: token,
    lastLoginAt: new Date(),
    loginCount: (staff.loginCount ?? 0) + 1,
  }).where(eq(staffUsers.id, staff.id));

  console.log(`[AUTH] Login successful for ${staff.name} (${staff.role}). Setting cookie.`);

  // Return both the public staff object AND the raw token
  // The token is needed for localStorage-based auth (iframe environments)
  const res = NextResponse.json({
    staff: { ...publicStaff({ ...staff, sessionToken: token }), sessionToken: token },
    _token: token,
  });

  // Also set cookie for standard browser environments
  res.cookies.set(STAFF_COOKIE, `${staff.id}:${token}`, {
    httpOnly: false, // must be false so JS can read it as fallback
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return res;
}
