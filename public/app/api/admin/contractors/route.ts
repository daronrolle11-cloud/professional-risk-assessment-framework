import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contractors, inspections } from "@/db/schema";
import { asc, count, eq } from "drizzle-orm";
import { generateAccessCode, TRADES, ISLANDS, tradeById } from "@/lib/operations";
import { verifyStaffRequest } from "@/lib/staff-auth";

/** GET — list all contractors with job counts. */
export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(contractors).orderBy(asc(contractors.name));
  const allInspections = await db
    .select({ contractorId: inspections.contractorId, status: inspections.status })
    .from(inspections);

  const jobMap = new Map<number, { total: number; active: number; completed: number }>();
  for (const ins of allInspections) {
    const entry = jobMap.get(ins.contractorId) ?? { total: 0, active: 0, completed: 0 };
    entry.total++;
    if (ins.status === "approved") entry.completed++;
    else if (["assigned", "in_progress"].includes(ins.status)) entry.active++;
    jobMap.set(ins.contractorId, entry);
  }

  return NextResponse.json(
    rows.map((c) => ({
      ...c,
      tradeName: tradeById(c.trade).name,
      jobs: jobMap.get(c.id) ?? { total: 0, active: 0, completed: 0 },
    }))
  );
}

export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    trade?: string;
    island?: string;
    phone?: string;
    email?: string;
  };
  if (!body.name?.trim() || !body.trade || !body.island) {
    return NextResponse.json({ error: "Name, trade and island are required." }, { status: 400 });
  }
  if (!TRADES.some((t) => t.id === body.trade)) {
    return NextResponse.json({ error: "Unknown trade." }, { status: 400 });
  }

  // Unique access code
  let accessCode = generateAccessCode(body.trade);
  for (let i = 0; i < 8; i++) {
    const [existing] = await db.select().from(contractors).where(eq(contractors.accessCode, accessCode));
    if (!existing) break;
    accessCode = generateAccessCode(body.trade);
  }

  const islandName = ISLANDS.find((i) => i.id === body.island)?.name ?? body.island;
  const [created] = await db
    .insert(contractors)
    .values({
      name: body.name.trim(),
      trade: body.trade,
      island: islandName,
      phone: body.phone ?? "",
      email: body.email ?? "",
      accessCode,
    })
    .returning();

  return NextResponse.json(created);
}
