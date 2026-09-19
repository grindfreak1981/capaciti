import "server-only";
import { prisma } from "./prisma";
import { processRegistry } from "@/domain/processes/registry";
import type { FieldSpec } from "@/domain/processes/types";

export interface ProcessFormMeta {
  id: string;
  code: string;
  name: string;
  capabilityFields: FieldSpec[];
  requirementFields: FieldSpec[];
}

/** Manufacturing processes as seeded in the DB, joined with their
 * capability/requirement field metadata from the domain registry. Only
 * processes that have a registered schema are usable in forms — this is
 * the seam where a future process (laser cutting, welding, ...) becomes
 * selectable the moment both a DB row and a registry entry exist. */
export async function listProcessFormMeta(): Promise<ProcessFormMeta[]> {
  const processes = await prisma.manufacturingProcess.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return processes
    .filter((p) => processRegistry[p.code])
    .map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      capabilityFields: processRegistry[p.code].capabilityFields,
      requirementFields: processRegistry[p.code].requirementFields,
    }));
}

export async function listMaterials() {
  return prisma.material.findMany({ orderBy: { name: "asc" } });
}
