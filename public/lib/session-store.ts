/**
 * Client-side session storage.
 * Stores the staff session in localStorage so it works in all browser
 * environments including embedded iframes where third-party cookies are blocked.
 */

const KEY = "bcso_staff_session_v2";

export interface LocalSession {
  staffId: number;
  token: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  title: string;
  accessCode: string;
}

export function saveSession(s: LocalSession) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function getLocalSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch { return null; }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function sessionHeaders(s: LocalSession): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-bcso-staff-id": String(s.staffId),
    "x-bcso-staff-token": s.token,
  };
}
