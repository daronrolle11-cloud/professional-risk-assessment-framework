import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { count } from "drizzle-orm";
import { generateStaffCode } from "@/lib/staff-auth";

/** 
 * POST /api/admin/bootstrap
 * 
 * One-time setup endpoint for production.
 * If the staff_users table is empty, it creates the first Master Admin
 * and returns the access code. Once a single user exists, this route locks.
 */
export async function POST() {
  const [{ value: existing }] = await db.select({ value: count() }).from(staffUsers);
  
  if (existing > 0) {
    return NextResponse.json(
      { error: "System already bootstrapped. Master admin exists. Use your dashboard to create further accounts." },
      { status: 403 }
    );
  }

  const accessCode = generateStaffCode();
  
  await db.insert(staffUsers).values({
    name: "BCSO Administrator",
    email: "admin@bcso.bs",
    title: "Master Admin",
    role: "admin",
    accessCode,
  });

  return NextResponse.json({
    message: "Initial admin created successfully. SAVE THIS ACCESS CODE IMMEDIATELY. This endpoint is now locked.",
    role: "admin",
    accessCode,
  });
}
