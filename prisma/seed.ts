import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/domain/auth/password";
import { toIsoWeekRef } from "../src/domain/matching/weeks";
import { runMatchingForRfqCore } from "../src/lib/matching-service-core";
import { CNC_MILLING, CNC_TURNING } from "../src/domain/processes/codes";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function main() {
  console.log("Seeding manufacturing processes...");
  const milling = await prisma.manufacturingProcess.upsert({
    where: { code: CNC_MILLING },
    update: {},
    create: { code: CNC_MILLING, name: "CNC Milling", description: "Subtractive machining on 3 to 5-axis mills." },
  });
  const turning = await prisma.manufacturingProcess.upsert({
    where: { code: CNC_TURNING },
    update: {},
    create: { code: CNC_TURNING, name: "CNC Turning", description: "Lathe turning, including live-tooled mill-turn." },
  });

  console.log("Seeding materials...");
  const materialNames: [string, string][] = [
    ["Aluminium", "ALUMINIUM"],
    ["Steel", "STEEL"],
    ["Stainless Steel", "STAINLESS_STEEL"],
    ["Titanium", "TITANIUM"],
    ["Brass", "BRASS"],
    ["Plastic (POM/Delrin)", "PLASTIC_POM"],
  ];
  const materials: Record<string, { id: string }> = {};
  for (const [name, code] of materialNames) {
    materials[code] = await prisma.material.upsert({
      where: { code },
      update: {},
      create: { name, code },
    });
  }

  console.log("Seeding demo supplier: Demo Precision d.o.o. ...");
  const supplierCompany = await prisma.company.upsert({
    where: { slug: "demo-precision" },
    update: {},
    create: {
      name: "Demo Precision d.o.o.",
      slug: "demo-precision",
      country: "SI",
      postalCode: "1000",
      city: "Ljubljana",
      website: "https://demo-precision.example",
      description: "Precision CNC milling and turning for aerospace and industrial customers.",
      companyType: "SUPPLIER",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo.supplier@capaciti.dev" },
    update: {},
    create: {
      email: "demo.supplier@capaciti.dev",
      name: "Ana Novak",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "SUPPLIER",
      companyId: supplierCompany.id,
    },
  });

  // Matching machine: 5-axis mill with generous travel.
  const dmu50 = await prisma.machine.upsert({
    where: { id: "seed-machine-dmu50" },
    update: {},
    create: {
      id: "seed-machine-dmu50",
      companyId: supplierCompany.id,
      name: "DMG Mori DMU 50",
      manufacturer: "DMG Mori",
      model: "DMU 50",
      manufacturingProcessId: milling.id,
      description: "5-axis machining center for complex aerospace-grade parts.",
      capabilities: { axisCount: 5, travelXMm: 650, travelYMm: 520, travelZMm: 475 },
      minimumBatchSize: 1,
      maximumBatchSize: 500,
      materials: {
        create: [
          { materialId: materials.ALUMINIUM.id },
          { materialId: materials.STEEL.id },
          { materialId: materials.STAINLESS_STEEL.id },
        ],
      },
    },
  });

  // Intentionally NON-matching machine: 3-axis, small travel, steel only.
  const haasMini = await prisma.machine.upsert({
    where: { id: "seed-machine-haas-mini" },
    update: {},
    create: {
      id: "seed-machine-haas-mini",
      companyId: supplierCompany.id,
      name: "Haas Mini Mill",
      manufacturer: "Haas",
      model: "Mini Mill",
      manufacturingProcessId: milling.id,
      description: "Compact 3-axis mill for small steel parts.",
      capabilities: { axisCount: 3, travelXMm: 300, travelYMm: 250, travelZMm: 300 },
      minimumBatchSize: 1,
      maximumBatchSize: 2000,
      materials: { create: [{ materialId: materials.STEEL.id }] },
    },
  });

  // A turning machine, seeded to demonstrate the second initial process.
  const quickTurn = await prisma.machine.upsert({
    where: { id: "seed-machine-quickturn" },
    update: {},
    create: {
      id: "seed-machine-quickturn",
      companyId: supplierCompany.id,
      name: "Mazak Quick Turn 250",
      manufacturer: "Mazak",
      model: "Quick Turn 250",
      manufacturingProcessId: turning.id,
      description: "High-precision CNC lathe with live tooling.",
      capabilities: { maxTurningDiameterMm: 65, maxTurningLengthMm: 300, barCapacityMm: 51, liveTooling: true },
      minimumBatchSize: 1,
      maximumBatchSize: 5000,
      materials: { create: [{ materialId: materials.STEEL.id }, { materialId: materials.STAINLESS_STEEL.id }] },
    },
  });

  console.log("Seeding weekly availability...");
  const now = new Date();
  const week0 = toIsoWeekRef(now);
  const week1 = toIsoWeekRef(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
  const week2 = toIsoWeekRef(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));

  async function setAvailability(
    machineId: string,
    ref: { isoYear: number; isoWeek: number },
    status: "AVAILABLE" | "LIMITED" | "FULL",
    estimatedHours: number | null,
  ) {
    await prisma.machineAvailability.upsert({
      where: { machineId_isoYear_isoWeek: { machineId, isoYear: ref.isoYear, isoWeek: ref.isoWeek } },
      update: { status, estimatedHours },
      create: { machineId, isoYear: ref.isoYear, isoWeek: ref.isoWeek, status, estimatedHours },
    });
  }

  await setAvailability(dmu50.id, week0, "AVAILABLE", 30);
  await setAvailability(dmu50.id, week1, "LIMITED", 10);
  await setAvailability(dmu50.id, week2, "FULL", null);

  await setAvailability(haasMini.id, week0, "FULL", null);
  await setAvailability(haasMini.id, week1, "FULL", null);

  await setAvailability(quickTurn.id, week0, "AVAILABLE", 40);

  console.log("Seeding demo buyer: Buyer Example d.o.o. ...");
  const buyerCompany = await prisma.company.upsert({
    where: { slug: "buyer-example" },
    update: {},
    create: {
      name: "Buyer Example d.o.o.",
      slug: "buyer-example",
      country: "SI",
      postalCode: "2000",
      city: "Maribor",
      description: "Industrial equipment OEM sourcing machined components.",
      companyType: "BUYER",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo.buyer@capaciti.dev" },
    update: {},
    create: {
      email: "demo.buyer@capaciti.dev",
      name: "Marko Kovač",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "BUYER",
      companyId: buyerCompany.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@capaciti.dev" },
    update: {},
    create: {
      email: "admin@capaciti.dev",
      name: "Platform Admin",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "ADMIN",
    },
  });

  console.log("Seeding demo RFQ that matches the DMU 50...");
  const deliveryDate = new Date(now);
  deliveryDate.setDate(deliveryDate.getDate() + 10); // within week0/week1 window

  const rfq = await prisma.rfq.upsert({
    where: { id: "seed-rfq-bracket" },
    update: {},
    create: {
      id: "seed-rfq-bracket",
      companyId: buyerCompany.id,
      title: "Aluminium mounting bracket, 50 pcs",
      manufacturingProcessId: milling.id,
      materialId: materials.ALUMINIUM.id,
      quantity: 50,
      requiredDeliveryDate: deliveryDate,
      description: "5-axis machined bracket for an industrial enclosure. Tight tolerance on mounting holes.",
      requirements: {
        requiredAxisCount: 5,
        partSizeXMm: 400,
        partSizeYMm: 300,
        partSizeZMm: 150,
        toleranceMm: 0.05,
      },
      status: "OPEN",
    },
  });

  await runMatchingForRfqCore(prisma, rfq.id);

  console.log("\nSeed complete.");
  console.log("Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log("  Supplier: demo.supplier@capaciti.dev (Demo Precision d.o.o.)");
  console.log("  Buyer:    demo.buyer@capaciti.dev (Buyer Example d.o.o.)");
  console.log("  Admin:    admin@capaciti.dev");
  console.log("Demo RFQ %s should match DMU 50 (compatible) and reject Haas Mini Mill (incompatible).", rfq.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
