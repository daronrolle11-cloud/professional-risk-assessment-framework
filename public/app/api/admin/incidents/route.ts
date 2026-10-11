import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { incidents, properties, staffUsers } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { verifyStaffRequest, publicStaff } from "@/lib/staff-auth";

type IncidentInput = {
  siteId?: number;
  classification?: string;
  date?: string;
  location?: string;
  description?: string;
  rootCause?: string;
  status?: string;
  reportedBy?: string;
};

function incidentNo(seq: number) {
  return `INC-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

/** GET — list incidents with linked site details. */
export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ incident: incidents, site: properties })
    .from(incidents)
    .innerJoin(properties, eq(incidents.siteId, properties.id))
    .orderBy(desc(incidents.date));

  const allStaff = await db.select().from(staffUsers);
  const staffMap = new Map(allStaff.map(s => [s.id, publicStaff(s)]));

  return NextResponse.json(rows.map(({ incident, site }) => ({ 
    ...incident, 
    site,
    signedBy: incident.signedByStaffId ? staffMap.get(incident.signedByStaffId) : null
  })));
}

/** POST — create a new incident record. */
export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as IncidentInput;
  if (!body.siteId || !body.classification || !body.date || !body.location?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: "siteId, classification, date, location and description are required." }, { status: 400 });
  }

  const existing = await db.select().from(incidents).orderBy(desc(incidents.id));
  const [created] = await db
    .insert(incidents)
    .values({
      incidentNo: incidentNo((existing[0]?.id ?? 0) + 1),
      siteId: body.siteId,
      classification: body.classification,
      date: new Date(body.date),
      location: body.location.trim(),
      description: body.description.trim(),
      rootCause: body.rootCause ?? "",
      status: body.status ?? "open",
      reportedBy: body.reportedBy?.trim() || staff.name,
    })
    .returning();

  return NextResponse.json({ incident: created });
}
