import { db } from "@/db";
import { contractors, type ContractorRow } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Verifies contractor session from request headers. Returns null when invalid. */
export async function verifyContractor(req: Request): Promise<ContractorRow | null> {
  const id = Number(req.headers.get("x-contractor-id"));
  const token = req.headers.get("x-contractor-token");
  if (!Number.isInteger(id) || !token) return null;
  const [row] = await db
    .select()
    .from(contractors)
    .where(and(eq(contractors.id, id), eq(contractors.sessionToken, token)));
  return row ?? null;
}

export function publicContractor(c: ContractorRow) {
  return {
    id: c.id,
    name: c.name,
    trade: c.trade,
    island: c.island,
    phone: c.phone,
    email: c.email,
    accessCode: c.accessCode,
  };
}
