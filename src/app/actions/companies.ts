"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CompanySchema } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import type { ActionState } from "@/lib/action-state";

export async function createCompanyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.companyId) {
    return { ok: false, message: "You already belong to a company." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = CompanySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const baseSlug = slugify(parsed.data.name) || "company";
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.company.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const company = await prisma.company.create({
    data: {
      name: parsed.data.name,
      slug,
      country: parsed.data.country,
      postalCode: parsed.data.postalCode,
      city: parsed.data.city,
      website: parsed.data.website || null,
      description: parsed.data.description || null,
      companyType: parsed.data.companyType,
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { companyId: company.id } });

  redirect("/dashboard");
}
