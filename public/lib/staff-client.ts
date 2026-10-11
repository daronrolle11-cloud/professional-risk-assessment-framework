export interface StaffClientUser {
  id: number;
  name: string;
  email: string;
  role: "reviewer" | "finalizer" | "admin";
}

export function canReview(role?: string | null) {
  return role === "reviewer" || role === "finalizer" || role === "admin";
}

export function canFinalize(role?: string | null) {
  return role === "finalizer" || role === "admin";
}

export function canSend(role?: string | null) {
  return role === "finalizer" || role === "admin";
}
