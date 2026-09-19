"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertOwnsCompanyResource, requireCompany } from "@/lib/auth";
import { buildRfqCoreSchema, buildZodErrorMap } from "@/lib/schemas";
import { readFieldsFromFormData } from "@/lib/process-form";
import { getProcessDefinition } from "@/domain/processes/registry";
import { validateUploadedFile } from "@/domain/files/validation";
import { fileStorage } from "@/domain/files/storage";
import { runMatchingForRfq } from "@/lib/matching-service";
import type { ActionState } from "@/lib/action-state";

export async function createRfqAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, company } = await requireCompany();
  const t = await getTranslations("rfqs");
  if (company.companyType === "SUPPLIER") {
    return { ok: false, message: t("onlyBuyerCanCreate") };
  }

  const tValidation = await getTranslations("validation");
  const raw = Object.fromEntries(formData);
  const parsed = buildRfqCoreSchema(tValidation).safeParse(raw, { errorMap: buildZodErrorMap(tValidation) });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const process = await prisma.manufacturingProcess.findUnique({
    where: { id: parsed.data.manufacturingProcessId },
  });
  if (!process) return { ok: false, message: t("unknownProcess") };

  const def = getProcessDefinition(process.code);
  const rawRequirements = readFieldsFromFormData(def.requirementFields, formData);
  const requirementsResult = def.requirementsSchema.safeParse(rawRequirements);
  if (!requirementsResult.success) {
    return { ok: false, message: t("invalidRequirements") };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    const validation = validateUploadedFile(file);
    if (!validation.ok) {
      return { ok: false, message: t(validation.errorCode, validation.errorParams) };
    }
  }

  const rfq = await prisma.rfq.create({
    data: {
      companyId: company.id,
      title: parsed.data.title,
      manufacturingProcessId: process.id,
      materialId: parsed.data.materialId,
      quantity: parsed.data.quantity,
      requiredDeliveryDate: parsed.data.requiredDeliveryDate,
      description: parsed.data.description || null,
      requirements: requirementsResult.data as Prisma.InputJsonValue,
      status: "DRAFT",
    },
  });

  for (const file of files) {
    const validation = validateUploadedFile(file);
    if (!validation.ok) continue; // already validated above; defensive only
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await fileStorage.save(buffer, validation.extension);
    await prisma.rfqFile.create({
      data: {
        rfqId: rfq.id,
        originalName: file.name.slice(0, 255),
        storageKey,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        uploadedByUserId: user.id,
      },
    });
  }

  revalidatePath("/rfqs");
  return redirect(`/rfqs/${rfq.id}`);
}

export async function submitRfqAction(rfqId: string): Promise<ActionState> {
  const { user } = await requireCompany();
  const t = await getTranslations("rfqs");
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) return { ok: false, message: t("notFound") };
  assertOwnsCompanyResource(user, rfq.companyId);

  if (rfq.status !== "DRAFT") {
    return { ok: false, message: t("onlyDraftCanSubmit") };
  }

  await prisma.rfq.update({ where: { id: rfqId }, data: { status: "OPEN" } });
  await runMatchingForRfq(rfqId);

  revalidatePath(`/rfqs/${rfqId}`);
  return { ok: true, message: t("submitted") };
}

export async function cancelRfqAction(rfqId: string): Promise<ActionState> {
  const { user } = await requireCompany();
  const t = await getTranslations("rfqs");
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) return { ok: false, message: t("notFound") };
  assertOwnsCompanyResource(user, rfq.companyId);

  await prisma.rfq.update({ where: { id: rfqId }, data: { status: "CANCELLED" } });
  revalidatePath(`/rfqs/${rfqId}`);
  return { ok: true };
}

export async function rerunMatchingAction(rfqId: string): Promise<ActionState> {
  const { user } = await requireCompany();
  const t = await getTranslations("rfqs");
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq) return { ok: false, message: t("notFound") };
  assertOwnsCompanyResource(user, rfq.companyId);
  if (rfq.status !== "OPEN") {
    return { ok: false, message: t("onlyOpenCanRerun") };
  }

  await runMatchingForRfq(rfqId);
  revalidatePath(`/rfqs/${rfqId}`);
  return { ok: true, message: t("matchesRefreshed") };
}
