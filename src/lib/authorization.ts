/**
 * Pure authorization logic, deliberately free of any Next.js/DB import so
 * it can be unit tested in isolation and reused anywhere (server actions,
 * route handlers, scripts) without pulling in request-scoped concerns.
 */
export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface AuthorizableUser {
  role: "BUYER" | "SUPPLIER" | "ADMIN";
  companyId: string | null;
}

/** A user may only act on a resource that belongs to their own company,
 * unless they are an admin. Server actions and route handlers MUST call
 * this before mutating or reading any company-scoped resource (machines,
 * availability, RFQs, files) — the frontend is never trusted to enforce
 * this on its own. */
export function assertOwnsCompanyResource(user: AuthorizableUser, resourceCompanyId: string): void {
  if (user.role === "ADMIN") return;
  if (!user.companyId || user.companyId !== resourceCompanyId) {
    throw new ForbiddenError();
  }
}
