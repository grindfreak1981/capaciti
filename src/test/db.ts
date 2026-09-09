import { PrismaClient } from "@prisma/client";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://capaciti:capaciti_dev_pw@localhost:5432/capaciti_test";

export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
}

/** Wipes every application table. Only ever point this at the dedicated
 * test database — it is intentionally destructive. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.matchResult.deleteMany(),
    prisma.rfqFile.deleteMany(),
    prisma.rfq.deleteMany(),
    prisma.machineAvailability.deleteMany(),
    prisma.machineMaterial.deleteMany(),
    prisma.machine.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
    prisma.material.deleteMany(),
    prisma.manufacturingProcess.deleteMany(),
  ]);
}
