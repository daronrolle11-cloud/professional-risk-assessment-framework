import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, checklistItems, type PhotoEvidence } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyContractor } from "@/lib/portal-auth";

type Ctx = { params: Promise<{ id: string }> };

const CONTRACTOR_EDITABLE = ["assigned", "in_progress", "returned"];
const MAX_PHOTOS_PER_ITEM = 4;
const MAX_DATAURL_BYTES = 750_000; // client compresses to ~1280px JPEG

/** POST { itemId, dataUrl, caption, takenAt, lat, lng, accuracy } — append time-stamped, geo-tagged evidence. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const contractor = await verifyContractor(req);
  if (!contractor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inspectionId = Number((await ctx.params).id);
  const [inspection] = await db.select().from(inspections).where(eq(inspections.id, inspectionId));
  if (!inspection || inspection.contractorId !== contractor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!CONTRACTOR_EDITABLE.includes(inspection.status)) {
    return NextResponse.json({ error: "This inspection is locked for review." }, { status: 409 });
  }

  const body = (await req.json()) as {
    itemId: number;
    dataUrl: string;
    caption?: string;
    takenAt?: string;
    lat?: number | null;
    lng?: number | null;
    accuracy?: number | null;
  };

  if (!body.itemId || !body.dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "A valid image is required." }, { status: 400 });
  }
  if (body.dataUrl.length > MAX_DATAURL_BYTES) {
    return NextResponse.json({ error: "Image exceeds the upload limit after compression." }, { status: 413 });
  }

  const [item] = await db
    .select()
    .from(checklistItems)
    .where(and(eq(checklistItems.id, body.itemId), eq(checklistItems.inspectionId, inspectionId)));
  if (!item) return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  if (item.photos.length >= MAX_PHOTOS_PER_ITEM) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS_PER_ITEM} photos per item.` }, { status: 400 });
  }

  const photo: PhotoEvidence = {
    id: crypto.randomUUID(),
    dataUrl: body.dataUrl,
    caption: (body.caption ?? "").slice(0, 240),
    takenAt: body.takenAt ?? new Date().toISOString(),
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
    accuracy: typeof body.accuracy === "number" ? Math.round(body.accuracy) : null,
    uploadedAt: new Date().toISOString(),
  };

  await db
    .update(checklistItems)
    .set({ photos: [...item.photos, photo] })
    .where(eq(checklistItems.id, item.id));
  await db.update(inspections).set({ updatedAt: new Date() }).where(eq(inspections.id, inspectionId));

  return NextResponse.json({ ok: true, photo });
}
