import { describe, expect, it } from "vitest";
import { buildCompanySchema, buildMachineCoreSchema, buildRegisterSchema, buildRfqCoreSchema } from "./schemas";

const t = (key: string) => key;
const MachineCoreSchema = buildMachineCoreSchema(t);
const RegisterSchema = buildRegisterSchema(t);
const CompanySchema = buildCompanySchema(t);
const RfqCoreSchema = buildRfqCoreSchema(t);

describe("MachineCoreSchema — optional numeric fields", () => {
  const base = {
    name: "Test Mill",
    manufacturingProcessId: "proc-1",
    materialIds: ["mat-1"],
  };

  it("treats a blank batch size input (as submitted by an empty HTML number field) as absent, not zero", () => {
    const result = MachineCoreSchema.safeParse({ ...base, minimumBatchSize: "", maximumBatchSize: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minimumBatchSize).toBeUndefined();
      expect(result.data.maximumBatchSize).toBeUndefined();
    }
  });

  it("still rejects an explicit zero or negative batch size", () => {
    expect(MachineCoreSchema.safeParse({ ...base, minimumBatchSize: "0" }).success).toBe(false);
    expect(MachineCoreSchema.safeParse({ ...base, minimumBatchSize: "-5" }).success).toBe(false);
  });

  it("coerces a valid numeric string batch size", () => {
    const result = MachineCoreSchema.safeParse({ ...base, minimumBatchSize: "10", maximumBatchSize: "500" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minimumBatchSize).toBe(10);
      expect(result.data.maximumBatchSize).toBe(500);
    }
  });

  it("requires at least one material", () => {
    expect(MachineCoreSchema.safeParse({ ...base, materialIds: [] }).success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  it("rejects a short password", () => {
    expect(
      RegisterSchema.safeParse({ name: "A B", email: "a@b.com", password: "short", role: "BUYER" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      RegisterSchema.safeParse({ name: "A B", email: "not-an-email", password: "longenough1", role: "BUYER" })
        .success,
    ).toBe(false);
  });

  it("accepts a valid registration", () => {
    expect(
      RegisterSchema.safeParse({ name: "A B", email: "a@b.com", password: "longenough1", role: "SUPPLIER" }).success,
    ).toBe(true);
  });
});

describe("CompanySchema", () => {
  it("requires a 2-letter country code", () => {
    expect(
      CompanySchema.safeParse({
        name: "Acme",
        country: "SLO",
        postalCode: "1000",
        city: "Ljubljana",
        companyType: "SUPPLIER",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid company", () => {
    expect(
      CompanySchema.safeParse({
        name: "Acme",
        country: "si",
        postalCode: "1000",
        city: "Ljubljana",
        companyType: "SUPPLIER",
      }).success,
    ).toBe(true);
  });
});

describe("RfqCoreSchema", () => {
  it("rejects a zero or negative quantity", () => {
    expect(
      RfqCoreSchema.safeParse({
        title: "Bracket",
        manufacturingProcessId: "proc-1",
        materialId: "mat-1",
        quantity: "0",
        requiredDeliveryDate: "2026-12-01",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid RFQ", () => {
    expect(
      RfqCoreSchema.safeParse({
        title: "Bracket",
        manufacturingProcessId: "proc-1",
        materialId: "mat-1",
        quantity: "50",
        requiredDeliveryDate: "2026-12-01",
      }).success,
    ).toBe(true);
  });
});
