import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createTestPrismaClient, resetDatabase } from "./db";
import { runMatchingForRfqCore } from "@/lib/matching-service-core";
import { assertOwnsCompanyResource, ForbiddenError } from "@/lib/authorization";
import { CNC_MILLING } from "@/domain/processes/codes";
import { toIsoWeekRef } from "@/domain/matching/weeks";

/**
 * End-to-end domain flow, exercised against a real (dedicated) Postgres
 * database rather than mocks: a supplier creates a machine and publishes
 * availability, a buyer submits an RFQ, and the matching engine is run
 * exactly the way the app runs it. Also covers the ownership boundaries
 * that the UI/server actions rely on `assertOwnsCompanyResource` for.
 */
describe("integration: supplier capacity -> buyer RFQ -> match", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("runs the full flow and produces a ranked, explainable match", async () => {
    const milling = await prisma.manufacturingProcess.create({
      data: { code: CNC_MILLING, name: "CNC Milling" },
    });
    const aluminium = await prisma.material.create({ data: { name: "Aluminium", code: "ALU" } });

    const supplierCompany = await prisma.company.create({
      data: {
        name: "Integration Test Machining",
        slug: "integration-test-machining",
        country: "SI",
        postalCode: "1000",
        city: "Ljubljana",
        companyType: "SUPPLIER",
      },
    });

    const machine = await prisma.machine.create({
      data: {
        companyId: supplierCompany.id,
        name: "Test 5-axis Mill",
        manufacturingProcessId: milling.id,
        capabilities: { axisCount: 5, travelXMm: 600, travelYMm: 500, travelZMm: 400 },
        materials: { create: [{ materialId: aluminium.id }] },
      },
    });

    const currentWeek = toIsoWeekRef(new Date());
    await prisma.machineAvailability.create({
      data: {
        machineId: machine.id,
        isoYear: currentWeek.isoYear,
        isoWeek: currentWeek.isoWeek,
        status: "AVAILABLE",
        estimatedHours: 20,
      },
    });

    const buyerCompany = await prisma.company.create({
      data: {
        name: "Integration Test Buyer",
        slug: "integration-test-buyer",
        country: "SI",
        postalCode: "2000",
        city: "Maribor",
        companyType: "BUYER",
      },
    });

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const rfq = await prisma.rfq.create({
      data: {
        companyId: buyerCompany.id,
        title: "Integration test bracket",
        manufacturingProcessId: milling.id,
        materialId: aluminium.id,
        quantity: 25,
        requiredDeliveryDate: deliveryDate,
        requirements: { requiredAxisCount: 5, partSizeXMm: 300, partSizeYMm: 200, partSizeZMm: 100 },
        status: "OPEN",
      },
    });

    const results = await runMatchingForRfqCore(prisma, rfq.id);

    expect(results).toHaveLength(1);
    expect(results[0].machineId).toBe(machine.id);
    expect(results[0].compatible).toBe(true);
    expect(results[0].score).toBe(100);
    expect(results[0].reasons.some((r) => r.key === "envelope" && r.passed)).toBe(true);

    const persisted = await prisma.matchResult.findUniqueOrThrow({
      where: { rfqId_machineId: { rfqId: rfq.id, machineId: machine.id } },
    });
    expect(persisted.compatible).toBe(true);
    expect(persisted.score).toBe(100);

    // Ownership boundaries: a different company must never be treated as
    // the owner of this machine or this RFQ.
    expect(() => assertOwnsCompanyResource({ role: "SUPPLIER", companyId: supplierCompany.id }, machine.companyId)).not.toThrow();
    expect(() => assertOwnsCompanyResource({ role: "BUYER", companyId: buyerCompany.id }, machine.companyId)).toThrow(
      ForbiddenError,
    );
    expect(() => assertOwnsCompanyResource({ role: "BUYER", companyId: buyerCompany.id }, rfq.companyId)).not.toThrow();
    expect(() =>
      assertOwnsCompanyResource({ role: "SUPPLIER", companyId: supplierCompany.id }, rfq.companyId),
    ).toThrow(ForbiddenError);
  });

  it("excludes a fully booked machine from matching even when capability fits", async () => {
    const milling = await prisma.manufacturingProcess.findFirstOrThrow({ where: { code: CNC_MILLING } });
    const aluminium = await prisma.material.findFirstOrThrow({ where: { code: "ALU" } });

    const supplierCompany = await prisma.company.create({
      data: {
        name: "Fully Booked Co",
        slug: "fully-booked-co",
        country: "SI",
        postalCode: "3000",
        city: "Celje",
        companyType: "SUPPLIER",
      },
    });

    const machine = await prisma.machine.create({
      data: {
        companyId: supplierCompany.id,
        name: "Fully Booked Mill",
        manufacturingProcessId: milling.id,
        capabilities: { axisCount: 5, travelXMm: 600, travelYMm: 500, travelZMm: 400 },
        materials: { create: [{ materialId: aluminium.id }] },
      },
    });

    const currentWeek = toIsoWeekRef(new Date());
    await prisma.machineAvailability.create({
      data: { machineId: machine.id, isoYear: currentWeek.isoYear, isoWeek: currentWeek.isoWeek, status: "FULL" },
    });

    const buyerCompany = await prisma.company.create({
      data: {
        name: "Fully Booked Buyer",
        slug: "fully-booked-buyer",
        country: "SI",
        postalCode: "4000",
        city: "Kranj",
        companyType: "BUYER",
      },
    });

    const rfq = await prisma.rfq.create({
      data: {
        companyId: buyerCompany.id,
        title: "Should not match",
        manufacturingProcessId: milling.id,
        materialId: aluminium.id,
        quantity: 10,
        requiredDeliveryDate: new Date(),
        requirements: {},
        status: "OPEN",
      },
    });

    const results = await runMatchingForRfqCore(prisma, rfq.id);
    const thisMachine = results.find((r) => r.machineId === machine.id);
    expect(thisMachine?.compatible).toBe(false);
    expect(thisMachine?.availabilitySummary).toBe("FULL");
  });
});
