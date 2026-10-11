import { NextResponse } from "next/server";
import { STAFF_COOKIE } from "@/lib/staff-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, "", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
