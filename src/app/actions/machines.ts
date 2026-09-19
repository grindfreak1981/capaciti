"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/redirect";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertOwnsCompanyResource, requireCompany } from "@/lib/auth";
import { buildMachineCoreSchema, buildZodErrorMap, AvailabilityEntrySchema } from "@/lib/schemas";
import { readFieldsFromFormData } from "@/lib/process-form";
import { getProcessDefinition } from "@/domain/processes/registry";
import type { ActionState } from "@/lib/action-state";

async function loadCompanyProcessOrThrow(manufacturingProcessId: string) {
  const process = await prisma.manufacturingProcess.findUnique({
    where: { id: manufacturingProcessId },
  });
  if (!process) throw new Error("Unknown manufacturing process");
  return process;
}

export async function createMachineAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const t = await getTranslations("machines");
  if (company.companyType === "BUYER") {
    return { ok: false, message: t("onlySupplierCanAdd") };
  }

  const tValidation = await getTranslations("validation");
  const raw = Object.fromEntries(formData);
  const materialIds = formData.getAll("materialIds").map(String);
  const parsed = buildMachineCoreSchema(tValidation).safeParse(
    { ...raw, materialIds },
    { errorMap: buildZodErrorMap(tValidation) },
  );
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const process = await loadCompanyProcessOrThrow(parsed.data.manufacturingProcessId);
  const def = getProcessDefinition(process.code);
  const rawCapabilities = readFieldsFromFormData(def.capabilityFields, formData);
  const capabilitiesResult = def.capabilitiesSchema.safeParse(rawCapabilities);
  if (!capabilitiesResult.success) {
    return { ok: false, message: t("invalidCapabilities") };
  }

  const machine = await prisma.machine.create({
    data: {
      companyId: company.id,
      name: parsed.data.name,
      manufacturer: parsed.data.manufacturer || null,
      model: parsed.data.model || null,
      manufacturingProcessId: process.id,
      description: parsed.data.description || null,
      capabilities: capabilitiesResult.data as Prisma.InputJsonValue,
      minimumBatchSize: parsed.data.minimumBatchSize ?? null,
      maximumBatchSize: parsed.data.maximumBatchSize ?? null,
      materials: { create: parsed.data.materialIds.map((materialId) => ({ materialId })) },
    },
  });

  revalidatePath("/machines");
  return redirect(`/machines/${machine.id}`);
}

export async function updateMachineAction(
  machineId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireCompany();
  const t = await getTranslations("machines");
  const existing = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!existing) return { ok: false, message: t("notFound") };
  assertOwnsCompanyResource(user, existing.companyId);

  const tValidation = await getTranslations("validation");
  const raw = Object.fromEntries(formData);
  const materialIds = formData.getAll("materialIds").map(String);
  const parsed = buildMachineCoreSchema(tValidation).safeParse(
    { ...raw, manufacturingProcessId: existing.manufacturingProcessId, materialIds },
    { errorMap: buildZodErrorMap(tValidation) },
  );
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const process = await loadCompanyProcessOrThrow(existing.manufacturingProcessId);
  const def = getProcessDefinition(process.code);
  const rawCapabilities = readFieldsFromFormData(def.capabilityFields, formData);
  const capabilitiesResult = def.capabilitiesSchema.safeParse(rawCapabilities);
  if (!capabilitiesResult.success) {
    return { ok: false, message: t("invalidCapabilities") };
  }

  await prisma.$transaction([
    prisma.machineMaterial.deleteMany({ where: { machineId } }),
    prisma.machine.update({
      where: { id: machineId },
      data: {
        name: parsed.data.name,
        manufacturer: parsed.data.manufacturer || null,
        model: parsed.data.model || null,
        description: parsed.data.description || null,
        capabilities: capabilitiesResult.data as Prisma.InputJsonValue,
        minimumBatchSize: parsed.data.minimumBatchSize ?? null,
        maximumBatchSize: parsed.data.maximumBatchSize ?? null,
        materials: { create: parsed.data.materialIds.map((materialId) => ({ materialId })) },
      },
    }),
  ]);

  revalidatePath(`/machines/${machineId}`);
  return { ok: true, message: t("updated") };
}

export async function deleteMachineAction(machineId: string): Promise<ActionState> {
  const { user } = await requireCompany();
  const t = await getTranslations("machines");
  const existing = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!existing) return { ok: false, message: t("notFound") };
  assertOwnsCompanyResource(user, existing.companyId);

  await prisma.machine.delete({ where: { id: machineId } });
  revalidatePath("/machines");
  return redirect("/machines");
}

export async function setMachineWeekAvailabilityAction(input: {
  machineId: string;
  isoYear: number;
  isoWeek: number;
  status: "AVAILABLE" | "LIMITED" | "FULL";
  estimatedHours: number | null;
}): Promise<ActionState> {
  const { user } = await requireCompany();
  const t = await getTranslations("machines");
  const machine = await prisma.machine.findUnique({ where: { id: input.machineId } });
  if (!machine) return { ok: false, message: t("notFound") };
  assertOwnsCompanyResource(user, machine.companyId);

  const parsed = AvailabilityEntrySchema.safeParse({
    isoYear: input.isoYear,
    isoWeek: input.isoWeek,
    status: input.status,
    estimatedHours: input.estimatedHours,
  });
  if (!parsed.success) {
    return { ok: false, message: t("invalidAvailabilityValue") };
  }

  await prisma.machineAvailability.upsert({
    where: {
      machineId_isoYear_isoWeek: {
        machineId: input.machineId,
        isoYear: parsed.data.isoYear,
        isoWeek: parsed.data.isoWeek,
      },
    },
    create: {
      machineId: input.machineId,
      isoYear: parsed.data.isoYear,
      isoWeek: parsed.data.isoWeek,
      status: parsed.data.status,
      estimatedHours: parsed.data.estimatedHours ?? null,
    },
    update: {
      status: parsed.data.status,
      estimatedHours: parsed.data.estimatedHours ?? null,
    },
  });

  revalidatePath(`/machines/${input.machineId}`);
  return { ok: true };
}
