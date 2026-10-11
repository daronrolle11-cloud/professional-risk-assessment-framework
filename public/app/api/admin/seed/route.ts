import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  contractors, properties, inspections, checklistItems, staffUsers, reportDeliveries, trainingSessions, type PhotoEvidence,
} from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { computeComplianceScore, generateInspectionCode, reportNumberFor, templateForTrade } from "@/lib/operations";


function svgPhoto(caption: string, hue: number, accent: string): string {
  const bars = [0, 1, 2, 3]
    .map((i) => `<rect x="58" y="${118 + i * 58}" width="${430 - i * 60}" height="34" rx="5" fill="rgba(255,255,255,0.13)"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440">` +
    `<rect width="640" height="440" fill="#0B0F13"/>` +
    `<rect width="640" height="440" fill="url(#g)"/>` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},35%,28%)" stop-opacity="0.7"/><stop offset="1" stop-color="hsl(${hue + 40},30%,10%)" stop-opacity="0.9"/></linearGradient></defs>` +
    `<circle cx="545" cy="70" r="44" fill="${accent}" opacity="0.85"/>` +
    bars +
    `<rect x="58" y="58" width="200" height="10" rx="5" fill="rgba(255,255,255,0.4)"/>` +
    `<text x="58" y="405" font-family="monospace" font-size="19" fill="rgba(255,255,255,0.92)">${caption}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function evidence(caption: string, hue: number, accent: string, lat: number, lng: number, takenHoursAgo: number): PhotoEvidence {
  const taken = new Date(Date.now() - takenHoursAgo * 3600_000);
  return {
    id: crypto.randomUUID(),
    dataUrl: svgPhoto(caption, hue, accent),
    caption,
    takenAt: taken.toISOString(),
    lat,
    lng,
    accuracy: 8,
    uploadedAt: new Date(taken.getTime() + 25 * 60_000).toISOString(),
  };
}

export async function POST() {
  const [{ value: existing }] = await db.select({ value: count() }).from(contractors);
  if (existing > 0) return NextResponse.json({ seeded: false, message: "FieldOps data already exists." });

  /* ---- Staff accounts with temp passcodes ---- */

  const [reviewer] = await db.insert(staffUsers).values({
    name: "Nadia Rolle",
    email: "nadia.rolle@bcso.bs",
    title: "Safety Inspector",
    phone: "(242) 555-0191",
    role: "reviewer",
    accessCode: "REV-2026",
  }).returning();
  const [finalizer] = await db.insert(staffUsers).values({
    name: "Ethan Cartwright",
    email: "ethan.cartwright@bcso.bs",
    title: "Senior Compliance Officer",
    phone: "(242) 555-0182",
    role: "finalizer",
    accessCode: "FIN-2026",
  }).returning();
  await db.insert(staffUsers).values({
    name: "BCSO Administrator",
    email: "admin@bcso.bs",
    title: "System Administrator",
    phone: "(242) 555-0100",
    role: "admin",
    accessCode: "ADM-2026",
  });

  /* ---- Contractors ---- */
  const [rolle] = await db.insert(contractors).values({
    name: "Michael Rolle",
    trade: "electrical",
    island: "New Providence (Nassau)",
    phone: "(242) 555-0134",
    email: "m.rolle@fieldops.bs",
    accessCode: "ELC-1024",
  }).returning();
  const [sawyer] = await db.insert(contractors).values({
    name: "Tamika Sawyer",
    trade: "plumbing",
    island: "Grand Bahama (Freeport)",
    phone: "(242) 555-0187",
    email: "t.sawyer@fieldops.bs",
    accessCode: "PLB-2048",
  }).returning();
  const [bowe] = await db.insert(contractors).values({
    name: "Kristoff Bowe",
    trade: "hvac",
    island: "Abaco",
    phone: "(242) 555-0121",
    email: "k.bowe@fieldops.bs",
    accessCode: "HVC-4096",
  }).returning();

  /* ---- Properties ---- */
  const [villa] = await db.insert(properties).values({
    name: "Villa Coral Reef",
    address: "Lot 14, Gunwale Close, Lyford Cay",
    island: "New Providence (Nassau)",
    propertyType: "villa",
    clientName: "The Henfield Family Trust",
    clientEmail: "trustees@henfieldtrust.bs",
    squareFeet: 6200,
    yearBuilt: 1998,
  }).returning();
  const [cottage] = await db.insert(properties).values({
    name: "Marsh Harbour Marina Cottage 12",
    address: "Bay Street, Marsh Harbour",
    island: "Abaco",
    propertyType: "marina",
    clientName: "Abaco Moorings Ltd",
    clientEmail: "ops@abacomoorings.bs",
    squareFeet: 2400,
    yearBuilt: 1987,
  }).returning();
  const [duplex] = await db.insert(properties).values({
    name: "Seagate Duplex — Unit B",
    address: "Sea Horse Lane, Lucaya",
    island: "Grand Bahama (Freeport)",
    propertyType: "residential",
    clientName: "Seagate Holdings Ltd",
    clientEmail: "pm@seagatelucaya.bs",
    squareFeet: 1800,
    yearBuilt: 2004,
  }).returning();
  const [condo] = await db.insert(properties).values({
    name: "Azure Pointe 4B",
    address: "West Bay Street, Cable Beach",
    island: "New Providence (Nassau)",
    propertyType: "condo",
    clientName: "Azure Pointe HOA",
    clientEmail: "board@azurepointe.bs",
    squareFeet: 1600,
    yearBuilt: 2011,
  }).returning();

  async function makeInspection(opts: {
    seq: number;
    propertyId: number;
    contractorId: number;
    trade: string;
    status: string;
    reviewStage?: string;
    scheduledFor: string;
    answered?: {
      failIndexes: { index: number; note: string; photo: PhotoEvidence }[];
      naIndexes?: number[];
    };
    submittedHoursAgo?: number;
    reviewedHoursAgo?: number;
    finalizedHoursAgo?: number;
    clientSentHoursAgo?: number;
  }) {
    const code = generateInspectionCode(opts.seq);
    const template = templateForTrade(opts.trade);
    const now = Date.now();
    const submittedAt = opts.submittedHoursAgo ? new Date(now - opts.submittedHoursAgo * 3600_000) : null;
    const reviewedAt = opts.reviewedHoursAgo ? new Date(now - opts.reviewedHoursAgo * 3600_000) : null;
    const finalizedAt = opts.finalizedHoursAgo ? new Date(now - opts.finalizedHoursAgo * 3600_000) : null;
    const clientNotifiedAt = opts.clientSentHoursAgo ? new Date(now - opts.clientSentHoursAgo * 3600_000) : null;

    const items = template.map((t, i) => {
      const fail = opts.answered?.failIndexes.find((f) => f.index === i);
      const na = opts.answered?.naIndexes?.includes(i);
      return { t, fail, na, i };
    });
    const pseudoRows = items.map(({ t, fail, na }) => ({
      label: t.label,
      requirement: t.requirement,
      severity: t.severity,
      status: !opts.answered ? "pending" : fail ? "fail" : na ? "na" : "pass",
      note: fail ? fail.note : "",
      photos: fail ? [fail.photo] : [],
    }));

    const score = opts.answered
      ? computeComplianceScore(
          pseudoRows.map((r, i) => ({
            id: i + 1,
            inspectionId: 0,
            sortOrder: i,
            label: r.label,
            requirement: r.requirement,
            severity: r.severity,
            status: r.status,
            note: r.note,
            photos: r.photos,
          }))
        ).score
      : null;

    const [insp] = await db.insert(inspections).values({
      code,
      propertyId: opts.propertyId,
      contractorId: opts.contractorId,
      trade: opts.trade,
      status: opts.status,
      reviewStage: opts.reviewStage ?? "pending",
      scheduledFor: opts.scheduledFor,
      complianceScore: score,
      reportNo: opts.reviewStage && opts.reviewStage !== "pending" ? reportNumberFor(0) : null,
      startedAt: submittedAt ? new Date(submittedAt.getTime() - 90 * 60_000) : null,
      submittedAt,
      reviewedAt,
      reviewedByStaffId: reviewedAt ? reviewer.id : null,
      approvedAt: finalizedAt,
      finalizedAt,
      finalizedByStaffId: finalizedAt ? finalizer.id : null,
      sentByStaffId: clientNotifiedAt ? finalizer.id : null,
      clientNotifiedAt,
      adminNote:
        opts.reviewStage === "reviewed"
          ? "Reviewed by BCSO reviewer. Awaiting final release approval."
          : opts.reviewStage === "finalized" || opts.reviewStage === "sent"
            ? "Finalized for client release."
            : "",
    }).returning();

    if (opts.reviewStage && opts.reviewStage !== "pending") {
      await db.update(inspections).set({ reportNo: reportNumberFor(insp.id) }).where(eq(inspections.id, insp.id));
    }

    await db.insert(checklistItems).values(
      pseudoRows.map((r, i) => ({
        inspectionId: insp.id,
        sortOrder: i,
        label: r.label,
        requirement: r.requirement,
        severity: r.severity,
        status: r.status,
        note: r.note,
        photos: r.photos,
      }))
    );

    if (clientNotifiedAt) {
      await db.insert(reportDeliveries).values({
        inspectionId: insp.id,
        sentByStaffId: finalizer.id,
        recipientName: duplex.clientName,
        recipientEmail: duplex.clientEmail,
        subject: `${reportNumberFor(insp.id)} — Compliance Shield Report · ${duplex.name}`,
        message: "Demo seeded delivery log.",
        deliveryMethod: "simulated",
        deliveryStatus: "simulated",
        sentAt: clientNotifiedAt,
      });
    }

    return insp;
  }

  await makeInspection({
    seq: 1,
    propertyId: villa.id,
    contractorId: rolle.id,
    trade: "electrical",
    status: "pending_review",
    reviewStage: "pending",
    scheduledFor: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    submittedHoursAgo: 3,
    answered: {
      failIndexes: [
        { index: 1, note: "Exposed conductor observed at pool-house junction box, insulation degraded by UV/salt air. Box open to weather.", photo: evidence("Open JB — pool house, SE wall", 15, "#ef4444", 25.0266, -77.5301, 5) },
        { index: 4, note: "Two daisy-chained extension leads powering dock pumps. Permanent circuit required.", photo: evidence("Daisy-chained leads at dock pump", 205, "#f97316", 25.0261, -77.5298, 4.8) },
        { index: 9, note: "Generator transfer switch missing lockout provision; back-feed risk on utility return.", photo: evidence("Transfer switch — no lockout point", 45, "#ffb000", 25.0263, -77.5304, 4.5) },
      ],
      naIndexes: [7],
    },
  });

  await makeInspection({
    seq: 2,
    propertyId: cottage.id,
    contractorId: bowe.id,
    trade: "hvac",
    status: "assigned",
    reviewStage: "pending",
    scheduledFor: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
  });

  await makeInspection({
    seq: 3,
    propertyId: duplex.id,
    contractorId: sawyer.id,
    trade: "plumbing",
    status: "approved",
    reviewStage: "sent",
    scheduledFor: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    submittedHoursAgo: 54,
    reviewedHoursAgo: 36,
    finalizedHoursAgo: 28,
    clientSentHoursAgo: 24,
    answered: {
      failIndexes: [
        { index: 2, note: "No vacuum breaker on irrigation feed tied to potable line. Backflow risk — rectify within 14 days.", photo: evidence("Irrigation feed — no backflow device", 190, "#f97316", 26.5295, -78.6959, 55) },
        { index: 6, note: "LPG flex connector at range shows surface cracking. Replacement advised; leak test otherwise negative.", photo: evidence("LPG flex connector — cracking", 25, "#ef4444", 26.5292, -78.6955, 54.8) },
      ],
    },
  });

  await makeInspection({
    seq: 4,
    propertyId: condo.id,
    contractorId: rolle.id,
    trade: "electrical",
    status: "in_progress",
    reviewStage: "pending",
    scheduledFor: new Date().toISOString().slice(0, 10),
  });

  /* ---- Training Sessions ---- */
  await db.insert(trainingSessions).values([
    {
      courseId: "orientation",
      courseName: "Basic Worker Safety Orientation",
      instructorName: "Nadia Rolle",
      location: "BCSO Nassau Office - Room A",
      scheduledAt: new Date(Date.now() + 3 * 86400000),
      maxEnrollment: 25,
      enrolledCount: 12,
      status: "scheduled",
    },
    {
      courseId: "fall-protection",
      courseName: "Fall Protection Certification",
      instructorName: "Ethan Cartwright",
      location: "Nassau Port Construction Site",
      scheduledAt: new Date(Date.now() + 7 * 86400000),
      maxEnrollment: 15,
      enrolledCount: 8,
      status: "scheduled",
    }
  ]);

  return NextResponse.json({
    seeded: true,
    staff: [
      { role: "reviewer", accessCode: "REV-2026" },
      { role: "finalizer", accessCode: "FIN-2026" },
      { role: "admin", accessCode: "ADM-2026" },
    ],
  });
}
