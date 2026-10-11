import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, properties, contractors, reportDeliveries, companySettings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyStaffRequest, roleAllows } from "@/lib/staff-auth";
import { sendReportEmail } from "@/lib/mailer";
import { COMPANY_LEGAL } from "@/lib/legal";
import { tradeById } from "@/lib/operations";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const staff = await verifyStaffRequest(req);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAllows(staff.role as "reviewer" | "finalizer" | "admin", "send")) {
    return NextResponse.json({ error: "You do not have permission to send reports." }, { status: 403 });
  }

  const id = Number((await ctx.params).id);
  const [row] = await db
    .select({ inspection: inspections, property: properties, contractor: contractors })
    .from(inspections)
    .innerJoin(properties, eq(inspections.propertyId, properties.id))
    .innerJoin(contractors, eq(inspections.contractorId, contractors.id))
    .where(eq(inspections.id, id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.inspection.reviewStage !== "finalized" && row.inspection.reviewStage !== "sent") {
    return NextResponse.json({ error: "Only finalized reports can be sent." }, { status: 409 });
  }

  const body = (await req.json()) as { recipientName?: string; recipientEmail?: string; message?: string };
  const recipientName = body.recipientName?.trim() || row.property.clientName;
  const recipientEmail = body.recipientEmail?.trim() || row.property.clientEmail;
  if (!recipientEmail) return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });

  const [company] = await db.select().from(companySettings).limit(1);
  const companyEmail = company?.email || undefined;

  const reportUrl = `${req.nextUrl.origin}/admin/reports/${id}`;
  const subject = `${row.inspection.reportNo} — Compliance Shield Report · ${row.property.name}`;
  const message = body.message?.trim() ||
    `Dear ${recipientName},\n\nPlease find the Compliance Shield Report for ${row.property.name} (${row.property.island}).\n\nReport reference: ${row.inspection.reportNo}\nInspection scope: ${tradeById(row.inspection.trade).name} (${row.inspection.code})\nCompliance score: ${row.inspection.complianceScore ?? "—"}\n\nSecure report link: ${reportUrl}\n\nRegards,\n${COMPANY_LEGAL}`;

  const html = `<p>Dear ${recipientName},</p><p>Please find the Compliance Shield Report for <strong>${row.property.name}</strong> (${row.property.island}).</p><ul><li><strong>Report reference:</strong> ${row.inspection.reportNo}</li><li><strong>Inspection scope:</strong> ${tradeById(row.inspection.trade).name} (${row.inspection.code})</li><li><strong>Compliance score:</strong> ${row.inspection.complianceScore ?? "—"}</li></ul><p><a href="${reportUrl}">Open secure report</a></p><p>Regards,<br/>${COMPANY_LEGAL}</p>`;

  const delivery = await sendReportEmail({ to: recipientEmail, bcc: companyEmail, subject, text: message, html });

  const [log] = await db
    .insert(reportDeliveries)
    .values({
      inspectionId: id,
      sentByStaffId: staff.id,
      recipientName,
      recipientEmail,
      subject,
      message,
      deliveryMethod: delivery.mode,
      deliveryStatus: delivery.mode === "smtp" ? "sent" : "simulated",
      providerMessageId: delivery.messageId,
      sentAt: new Date(),
    })
    .returning();

  await db
    .update(inspections)
    .set({
      reviewStage: "sent",
      sentByStaffId: staff.id,
      clientNotifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(inspections.id, id), eq(inspections.reportNo, row.inspection.reportNo ?? "")));

  return NextResponse.json({ ok: true, delivery: log, mode: delivery.mode, reportUrl });
}
