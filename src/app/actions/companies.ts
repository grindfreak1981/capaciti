"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildCompanySchema, buildZodErrorMap } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import type { ActionState } from "@/lib/action-state";

export async function createCompanyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.companyId) {
    const t = await getTranslations("company");
    return { ok: false, message: t("alreadyHaveCompany") };
  }

  const tValidation = await getTranslations("validation");
  const parsed = buildCompanySchema(tValidation).safeParse(Object.fromEntries(formData), {
    errorMap: buildZodErrorMap(tValidation),
  });
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

  return redirect("/dashboard");
}
