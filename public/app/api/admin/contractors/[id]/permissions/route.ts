import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contractors, type ContractorPermissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyStaffRequest, roleAllows } from "@/lib/staff-auth";

type Ctx = { params: Promise<{ id: string }> };

const DEFAULT_PERMISSIONS: ContractorPermissions = {
  canSubmitPhotos: true,
  canAddNotes: true,
  canViewHistory: true,
  allowedTrades: [],
  restrictedToIslands: [],
  maxActiveJobs: 0,
};

export async function PUT(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "manage_contractors")) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const id = Number((await ctx.params).id);
  const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
  if (!contractor) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = (await req.json()) as Partial<ContractorPermissions>;
  const merged: ContractorPermissions = {
    ...DEFAULT_PERMISSIONS,
    ...(contractor.permissions as ContractorPermissions),
    ...body,
  };

  const [updated] = await db
    .update(contractors)
    .set({ permissions: merged })
    .where(eq(contractors.id, id))
    .returning();

  return NextResponse.json({ contractor: updated });
}
