import "server-only";
import { prisma } from "./prisma";
import { runMatchingForRfqCore } from "./matching-service-core";
import type { MachineMatchResult } from "@/domain/matching/types";

/** Loads an RFQ and every machine capable of the same manufacturing
 * process, runs the matching engine, and persists a MatchResult row per
 * evaluated machine (so suppliers can see "RFQs matching my capabilities"
 * without recomputing, and so results are auditable). Returns the ranked
 * results. */
export async function runMatchingForRfq(rfqId: string): Promise<MachineMatchResult[]> {
  return runMatchingForRfqCore(prisma, rfqId);
}
