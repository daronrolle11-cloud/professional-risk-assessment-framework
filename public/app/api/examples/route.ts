import { NextResponse } from "next/server";
import { db } from "@/db";
import { assessments, hazards } from "@/db/schema";
import { HAZARD_LIBRARY, compileRegulations, templateToDraft } from "@/lib/data";
import { count } from "drizzle-orm";

/** Seeds two fully worked example assessments (idempotent-ish: skips if data exists). */
export async function POST() {
  const [{ value: existing }] = await db.select({ value: count() }).from(assessments);
  if (existing > 0) {
    return NextResponse.json({ seeded: false, message: "Assessments already exist." });
  }

  const year = new Date().getFullYear();

  async function insertExample(opts: {
    no: string;
    industry: string;
    activity: string;
    organization: string;
    department: string;
    location: string;
    assessor: string;
    manager: string;
    exposed: number;
    hazardKeys: string[];
    status: string;
  }) {
    const tpls = HAZARD_LIBRARY.filter((h) => opts.hazardKeys.includes(h.key)).map(templateToDraft);
    const regulations = compileRegulations("bahamas-intl", tpls);
    const [a] = await db
      .insert(assessments)
      .values({
        assessmentNo: opts.no,
        status: opts.status,
        industry: opts.industry,
        organization: opts.organization,
        department: opts.department,
        location: opts.location,
        activity: opts.activity,
        assessmentDate: new Date().toISOString().slice(0, 10),
        reviewDate: new Date(Date.now() + 182 * 86400000).toISOString().slice(0, 10),
        assessor: opts.assessor,
        responsibleManager: opts.manager,
        employeesExposed: opts.exposed,
        jurisdiction: "bahamas-intl",
        regulations,
      })
      .returning({ id: assessments.id });

    await db.insert(hazards).values(
      tpls.map((t, i) => ({
        assessmentId: a.id,
        sortOrder: i,
        category: t.category,
        description: t.description,
        personsAtRisk: t.personsAtRisk,
        existingControls: t.existingControls,
        likelihood: t.likelihood,
        severity: t.severity,
        controls: t.controls,
        responsiblePerson: t.responsiblePerson,
        dueDate: new Date(Date.now() + (14 + i * 14) * 86400000).toISOString().slice(0, 10),
        residualLikelihood: t.residualLikelihood,
        residualSeverity: t.residualSeverity,
      }))
    );
    return a.id;
  }

  await insertExample({
    no: `RA-${year}-0001`,
    industry: "office",
    activity: "General office work — Harbourview Corporate Centre, Floors 2–4",
    organization: "Harbourview Corporate Centre Ltd",
    department: "Facilities & Workplace",
    location: "Shirley Street, Nassau, New Providence, The Bahamas",
    assessor: "D. Whitfield — OSH Practitioner",
    manager: "S. Rahming — Facilities Manager",
    exposed: 86,
    status: "issued",
    hazardKeys: ["governance-committee", "ceiling-failure", "electrical", "slips-trips", "dse", "stress", "fire", "housekeeping-egress", "lighting"],
  });

  await insertExample({
    no: `RA-${year}-0002`,
    industry: "warehouse",
    activity: "Forklift, picking and despatch operations — Freeport Logistics Park",
    organization: "Lucayan Distribution Services Ltd",
    department: "Logistics & Distribution",
    location: "Queen's Highway Industrial Zone, Freeport, Grand Bahama, The Bahamas",
    assessor: "R. Cartwright — Safety Coordinator",
    manager: "J. Bethel — Warehouse Manager",
    exposed: 44,
    status: "review",
    hazardKeys: ["forklift", "falling-objects-racking", "manual-handling", "slips-trips", "fire", "lone-working"],
  });

  return NextResponse.json({ seeded: true });
}
