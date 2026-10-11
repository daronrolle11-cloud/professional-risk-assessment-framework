import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trainingSessions, staffUsers } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(trainingSessions)
    .orderBy(desc(trainingSessions.scheduledAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.courseId || !body.scheduledAt || !body.location) {
    return NextResponse.json({ error: "Course, schedule and location are required." }, { status: 400 });
  }

  const [created] = await db
    .insert(trainingSessions)
    .values({
      courseId: body.courseId,
      courseName: body.courseName,
      instructorId: body.instructorId || null,
      instructorName: body.instructorName || "TBD",
      location: body.location,
      scheduledAt: new Date(body.scheduledAt),
      maxEnrollment: body.maxEnrollment || 20,
      status: "scheduled",
    })
    .returning();

  return NextResponse.json(created);
}
