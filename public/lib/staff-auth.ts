import { cookies } from "next/headers";
import { db } from "@/db";
import { staffUsers, type StaffRole, type StaffUserRow } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const STAFF_COOKIE = "bcso_staff_session";

export interface StaffSession {
  staff: StaffUserRow;
  cookieValue: string;
}

function parseCookie(raw?: string | null): { id: number; token: string } | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  const [idRaw, token] = decoded.split(":");
  const id = Number(idRaw);
  if (!Number.isInteger(id) || !token) return null;
  return { id, token };
}

export function roleAllows(role: StaffRole, action: "review" | "finalize" | "send" | "manage_staff" | "manage_contractors"): boolean {
  if (role === "admin") return true;
  if (action === "review") return role === "reviewer" || role === "finalizer";
  if (action === "finalize") return role === "finalizer";
  if (action === "send") return role === "finalizer";
  return false;
}

export async function verifyStaffRequest(req: Request): Promise<StaffUserRow | null> {
  // Method 1: custom headers (localStorage-based auth for iframe environments)
  const headerId = req.headers.get("x-bcso-staff-id");
  const headerToken = req.headers.get("x-bcso-staff-token");
  if (headerId && headerToken) {
    const id = Number(headerId);
    if (Number.isInteger(id) && id > 0) {
      const [staff] = await db
        .select()
        .from(staffUsers)
        .where(and(eq(staffUsers.id, id), eq(staffUsers.sessionToken, headerToken)));
      if (staff && staff.active === "true") return staff;
    }
  }

  // Method 2: cookie (standard browser environments)
  const cookieHeader = req.headers.get("cookie") ?? "";
  const raw = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${STAFF_COOKIE}=`))
    ?.slice(STAFF_COOKIE.length + 1);
  const parsed = parseCookie(raw);
  if (!parsed) return null;
  const [staff] = await db
    .select()
    .from(staffUsers)
    .where(and(eq(staffUsers.id, parsed.id), eq(staffUsers.sessionToken, parsed.token)));
  return staff ?? null;
}

export async function getServerStaffSession(): Promise<StaffSession | null> {
  const store = await cookies();
  const parsed = parseCookie(store.get(STAFF_COOKIE)?.value);
  if (!parsed) return null;
  const [staff] = await db
    .select()
    .from(staffUsers)
    .where(and(eq(staffUsers.id, parsed.id), eq(staffUsers.sessionToken, parsed.token)));
  if (!staff) return null;
  return { staff, cookieValue: `${staff.id}:${staff.sessionToken}` };
}

export function publicStaff(staff: StaffUserRow) {
  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    title: staff.title,
    role: staff.role as StaffRole,
    accessCode: staff.accessCode,
    lastLoginAt: staff.lastLoginAt?.toISOString() ?? null,
    loginCount: staff.loginCount,
    active: staff.active === "true",
    createdAt: staff.createdAt?.toISOString() ?? null,
  };
}

/** Generate a staff access code like BCSO-4827 */
export function generateStaffCode(): string {
  return `BCSO-${Math.floor(1000 + Math.random() * 9000)}`;
}
