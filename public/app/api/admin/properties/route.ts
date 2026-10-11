import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { ISLANDS, PROPERTY_TYPES } from "@/lib/operations";
import { verifyStaffRequest } from "@/lib/staff-auth";

export async function POST(req: NextRequest) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    address?: string;
    island?: string;
    propertyType?: string;
    clientName?: string;
    clientEmail?: string;
    squareFeet?: number;
    yearBuilt?: number;
  };
  if (!body.name?.trim() || !body.island || !body.clientName?.trim()) {
    return NextResponse.json({ error: "Property name, island and client name are required." }, { status: 400 });
  }

  const islandName = ISLANDS.find((i) => i.id === body.island)?.name ?? body.island;
  const typeName = PROPERTY_TYPES.some((p) => p.id === body.propertyType) ? body.propertyType : "residential";

  const [created] = await db
    .insert(properties)
    .values({
      name: body.name.trim(),
      address: body.address ?? "",
      island: islandName,
      propertyType: typeName ?? "residential",
      clientName: body.clientName.trim(),
      clientEmail: body.clientEmail ?? "",
      squareFeet: Number(body.squareFeet) || 0,
      yearBuilt: Number(body.yearBuilt) || 0,
    })
    .returning();

  return NextResponse.json(created);
}
