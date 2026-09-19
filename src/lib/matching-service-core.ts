import type { Prisma, PrismaClient } from "@prisma/client";
import { matchRfqAgainstMachines } from "@/domain/matching/engine";
import type { MachineForMatching, MachineMatchResult, RfqForMatching } from "@/domain/matching/types";

/**
 * DB-backed matching, without the `server-only` import guard so it can
 * also run from the Prisma seed script (a plain Node/tsx process, not a
 * Next.js request). `matching-service.ts` re-exports this for use inside
 * the app and adds that guard back.
 */
export async function runMatchingForRfqCore(
  prisma: PrismaClient,
  rfqId: string,
): Promise<MachineMatchResult[]> {
  const rfq = await prisma.rfq.findUniqueOrThrow({
    where: { id: rfqId },
    include: { manufacturingProcess: true },
  });

  const machines = await prisma.machine.findMany({
    where: { manufacturingProcessId: rfq.manufacturingProcessId },
    include: { company: true, materials: true, availability: true },
  });

  const rfqForMatching: RfqForMatching = {
    id: rfq.id,
    companyId: rfq.companyId,
    manufacturingProcessId: rfq.manufacturingProcessId,
    processCode: rfq.manufacturingProcess.code,
    materialId: rfq.materialId,
    quantity: rfq.quantity,
    requiredDeliveryDate: rfq.requiredDeliveryDate,
    requirements: rfq.requirements,
  };

  const machinesForMatching: MachineForMatching[] = machines.map((m) => ({
    id: m.id,
    name: m.name,
    companyId: m.companyId,
    companyName: m.company.name,
    manufacturingProcessId: m.manufacturingProcessId,
    processCode: rfq.manufacturingProcess.code,
    capabilities: m.capabilities,
    minimumBatchSize: m.minimumBatchSize,
    maximumBatchSize: m.maximumBatchSize,
    materialIds: m.materials.map((mm) => mm.materialId),
    availability: m.availability.map((a) => ({
      isoYear: a.isoYear,
      isoWeek: a.isoWeek,
      status: a.status,
      estimatedHours: a.estimatedHours,
    })),
  }));

  const results = matchRfqAgainstMachines(rfqForMatching, machinesForMatching);

  await prisma.$transaction(
    results.map((r) =>
      prisma.matchResult.upsert({
        where: { rfqId_machineId: { rfqId: rfq.id, machineId: r.machineId } },
        create: {
          rfqId: rfq.id,
          machineId: r.machineId,
          compatible: r.compatible,
          score: r.score,
          reasons: r.reasons as unknown as Prisma.InputJsonValue,
        },
        update: {
          compatible: r.compatible,
          score: r.score,
          reasons: r.reasons as unknown as Prisma.InputJsonValue,
        },
      }),
    ),
  );

  return results;
}
