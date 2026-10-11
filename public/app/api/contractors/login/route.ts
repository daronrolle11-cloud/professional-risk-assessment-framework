import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contractors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publicContractor } from "@/lib/portal-auth";

export async function POST(req: NextRequest) {
  const { accessCode } = (await req.json()) as { accessCode?: string };
  const code = (accessCode ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Access code required." }, { status: 400 });

  const [contractor] = await db.select().from(contractors).where(eq(contractors.accessCode, code));
  if (!contractor || contractor.active !== "true") {
    return NextResponse.json({ error: "Access code not recognized. Check with your coordinator." }, { status: 401 });
  }

  const sessionToken = crypto.randomUUID();
  await db.update(contractors).set({ sessionToken }).where(eq(contractors.id, contractor.id));

  return NextResponse.json({ contractor: publicContractor(contractor), token: sessionToken });
}
