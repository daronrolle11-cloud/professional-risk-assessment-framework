import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyStaffRequest } from "@/lib/staff-auth";

/** GET — return the global company settings. Publicly accessible for dashboard shell rendering. */
export async function GET() {
  const [settings] = await db.select().from(companySettings).limit(1);
  return NextResponse.json({ settings: settings || null });
}

/** PATCH — update company settings (admin only). */
export async function PATCH(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff || staff.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  const body = await req.json();

  const [existing] = await db.select().from(companySettings).limit(1);

  if (!existing) {
    const [created] = await db
      .insert(companySettings)
      .values({
        companyName: body.companyName || "Bahamas Compliance & Safety Oversight Ltd. (BCSO)",
        address: body.address || "",
        phone: body.phone || "",
        email: body.email || "",
        website: body.website || "",
        managingDirector: body.managingDirector || "",
        logoDataUrl: body.logoDataUrl || null,
      })
      .returning();
    return NextResponse.json({ settings: created });
  }

  const [updated] = await db
    .update(companySettings)
    .set({
      companyName: body.companyName ?? existing.companyName,
      address: body.address ?? existing.address,
      phone: body.phone ?? existing.phone,
      email: body.email ?? existing.email,
      website: body.website ?? existing.website,
      managingDirector: body.managingDirector ?? existing.managingDirector,
      logoDataUrl: body.logoDataUrl !== undefined ? body.logoDataUrl : existing.logoDataUrl,
      updatedAt: new Date(),
    })
    .where(eq(companySettings.id, existing.id))
    .returning();

  return NextResponse.json({ settings: updated });
}
