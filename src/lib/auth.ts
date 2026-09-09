import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { readSessionCookie } from "@/domain/auth/session";
import type { Company, User } from "@prisma/client";
import { ForbiddenError, assertOwnsCompanyResource } from "./authorization";

export { ForbiddenError, assertOwnsCompanyResource };

export type CurrentUser = User & { company: Company | null };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSessionCookie();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { company: true },
  });
}

/** Redirects to /login when there is no authenticated user. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to /companies/new when the user has no company yet. */
export async function requireCompany(): Promise<{ user: CurrentUser; company: Company }> {
  const user = await requireUser();
  if (!user.company) redirect("/companies/new");
  return { user, company: user.company };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}
