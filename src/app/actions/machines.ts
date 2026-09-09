"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertOwnsCompanyResource, requireCompany } from "@/lib/auth";
import { MachineCoreSchema, AvailabilityEntrySchema } from "@/lib/schemas";
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
  if (company.companyType === "BUYER") {
    return { ok: false, message: "Only supplier companies can add machines." };
  }

  const raw = Object.fromEntries(formData);
  const materialIds = formData.getAll("materialIds").map(String);
  const parsed = MachineCoreSchema.safeParse({ ...raw, materialIds });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const process = await loadCompanyProcessOrThrow(parsed.data.manufacturingProcessId);
  const def = getProcessDefinition(process.code);
  const rawCapabilities = readFieldsFromFormData(def.capabilityFields, formData);
  const capabilitiesResult = def.capabilitiesSchema.safeParse(rawCapabilities);
  if (!capabilitiesResult.success) {
    return {
      ok: false,
      message: "Some technical capability fields are missing or invalid for the selected process.",
    };
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
  redirect(`/machines/${machine.id}`);
}

export async function updateMachineAction(
  machineId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireCompany();
  const existing = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!existing) return { ok: false, message: "Machine not found." };
  assertOwnsCompanyResource(user, existing.companyId);

  const raw = Object.fromEntries(formData);
  const materialIds = formData.getAll("materialIds").map(String);
  const parsed = MachineCoreSchema.safeParse({ ...raw, manufacturingProcessId: existing.manufacturingProcessId, materialIds });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const process = await loadCompanyProcessOrThrow(existing.manufacturingProcessId);
  const def = getProcessDefinition(process.code);
  const rawCapabilities = readFieldsFromFormData(def.capabilityFields, formData);
  const capabilitiesResult = def.capabilitiesSchema.safeParse(rawCapabilities);
  if (!capabilitiesResult.success) {
    return {
      ok: false,
      message: "Some technical capability fields are missing or invalid for the selected process.",
    };
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
  return { ok: true, message: "Machine updated." };
}

export async function deleteMachineAction(machineId: string): Promise<ActionState> {
  const { user } = await requireCompany();
  const existing = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!existing) return { ok: false, message: "Machine not found." };
  assertOwnsCompanyResource(user, existing.companyId);

  await prisma.machine.delete({ where: { id: machineId } });
  revalidatePath("/machines");
  redirect("/machines");
}

export async function setMachineWeekAvailabilityAction(input: {
  machineId: string;
  isoYear: number;
  isoWeek: number;
  status: "AVAILABLE" | "LIMITED" | "FULL";
  estimatedHours: number | null;
}): Promise<ActionState> {
  const { user } = await requireCompany();
  const machine = await prisma.machine.findUnique({ where: { id: input.machineId } });
  if (!machine) return { ok: false, message: "Machine not found." };
  assertOwnsCompanyResource(user, machine.companyId);

  const parsed = AvailabilityEntrySchema.safeParse({
    isoYear: input.isoYear,
    isoWeek: input.isoWeek,
    status: input.status,
    estimatedHours: input.estimatedHours,
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid availability value." };
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
