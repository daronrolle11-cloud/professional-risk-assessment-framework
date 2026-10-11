import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workers, certifications } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

export async function GET(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allWorkers = await db.select().from(workers).orderBy(asc(workers.name));
  const allCerts = await db.select().from(certifications);

  const certsByWorker = new Map<number, typeof allCerts>();
  for (const c of allCerts) {
    const list = certsByWorker.get(c.workerId) ?? [];
    list.push(c);
    certsByWorker.set(c.workerId, list);
  }

  const payload = allWorkers.map((w) => {
    const certs = certsByWorker.get(w.id) ?? [];
    
    // Determine overall status
    let status = "missing";
    if (certs.length > 0) {
       const now = new Date();
       const hasExpired = certs.some(c => c.status === "expired" || new Date(c.expiryDate) < now);
       const hasExpiring = certs.some(c => {
         const days = (new Date(c.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
         return days > 0 && days <= 30;
       });
       if (hasExpired) status = "expired";
       else if (hasExpiring) status = "expiring";
       else status = "compliant";
    }

    return { ...w, certCount: certs.length, status };
  });

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    trade?: string;
    employer?: string;
    dob?: string;
    nationality?: string;
    primaryLanguage?: string;
  };

  if (!body.name?.trim() || !body.trade || !body.employer?.trim()) {
    return NextResponse.json({ error: "Name, trade, and employer are required." }, { status: 400 });
  }

  const qrCode = `WRK-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

  const [created] = await db
    .insert(workers)
    .values({
      name: body.name.trim(),
      trade: body.trade,
      employer: body.employer.trim(),
      dob: body.dob || "",
      nationality: body.nationality || "Bahamian",
      primaryLanguage: body.primaryLanguage || "English",
      qrCode,
    })
    .returning();

  return NextResponse.json({ worker: created });
}
