"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/domain/auth/password";
import { createSessionCookie, clearSessionCookie } from "@/domain/auth/session";
import { buildLoginSchema, buildRegisterSchema, buildZodErrorMap } from "@/lib/schemas";
import type { ActionState } from "@/lib/action-state";

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("validation");
  const parsed = buildRegisterSchema(t).safeParse(Object.fromEntries(formData), { errorMap: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const tAuth = await getTranslations("auth");
    return { ok: false, message: tAuth("emailAlreadyExists") };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
  await createSessionCookie({ userId: user.id });
  return redirect("/companies/new");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("validation");
  const parsed = buildLoginSchema(t).safeParse(Object.fromEntries(formData), { errorMap: buildZodErrorMap(t) });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    const tAuth = await getTranslations("auth");
    return { ok: false, message: tAuth("invalidCredentials") };
  }

  await createSessionCookie({ userId: user.id });
  return redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  clearSessionCookie();
  await redirect("/");
}
