/**
 * Authenticated fetch for admin dashboard pages.
 * Attaches x-bcso-staff-id / x-bcso-staff-token headers from localStorage
 * so auth works in every browser environment including iframes.
 */

import { getLocalSession, clearSession, type LocalSession } from "./session-store";

export function getSession(): LocalSession | null {
  return getLocalSession();
}

export function adminHeaders(s: LocalSession): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-bcso-staff-id": String(s.staffId),
    "x-bcso-staff-token": s.token,
  };
}

export async function adminFetch(
  url: string,
  options: RequestInit = {},
  s?: LocalSession | null
): Promise<Response> {
  const session = s ?? getLocalSession();
  if (!session) {
    // Return a synthetic 401 response
    return new Response(JSON.stringify({ error: "No session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    return await fetch(url, {
      ...options,
      headers: {
        ...adminHeaders(session),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch (e) {
    console.error(`[adminFetch] Network error for ${url}:`, e);
    // Return a synthetic 500 response
    return new Response(JSON.stringify({ error: "Network error. The server may be restarting." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** 
 * Safely parse JSON from a response. 
 * Prevents "Unexpected end of JSON input" errors.
 */
export async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    // Clone the response so we don't consume the body if something else needs it
    const clone = res.clone();
    const text = await clone.text();
    if (!text || text.trim() === "") return null;
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("[safeJson] Parse error:", e);
    return null;
  }
}

export function logout() {
  clearSession();
  window.location.href = "/admin/access";
}
