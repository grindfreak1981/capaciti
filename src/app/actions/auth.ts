"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/domain/auth/password";
import { createSessionCookie, clearSessionCookie } from "@/domain/auth/session";
import { LoginSchema, RegisterSchema } from "@/lib/schemas";
import type { ActionState } from "@/lib/action-state";

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
  await createSessionCookie({ userId: user.id });
  redirect("/companies/new");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    return { ok: false, message: "Invalid email or password." };
  }

  await createSessionCookie({ userId: user.id });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  clearSessionCookie();
  redirect("/");
}
