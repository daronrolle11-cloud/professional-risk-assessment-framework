export interface PortalSession {
  contractor: {
    id: number;
    name: string;
    trade: string;
    island: string;
    phone: string;
    email: string;
    accessCode: string;
  };
  token: string;
}

const KEY = "bcso-fieldops-session";

export function getSession(): PortalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PortalSession) : null;
  } catch {
    return null;
  }
}

export function setSession(s: PortalSession | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
}

export function authHeaders(s: PortalSession): Record<string, string> {
  return {
    "x-contractor-id": String(s.contractor.id),
    "x-contractor-token": s.token,
    "Content-Type": "application/json",
  };
}
