import { describe, expect, it } from "vitest";
import { ForbiddenError, assertOwnsCompanyResource } from "./authorization";

describe("assertOwnsCompanyResource", () => {
  it("allows a user acting on their own company's resource", () => {
    expect(() =>
      assertOwnsCompanyResource({ role: "SUPPLIER", companyId: "company-1" }, "company-1"),
    ).not.toThrow();
  });

  it("rejects a user acting on a different company's resource", () => {
    expect(() =>
      assertOwnsCompanyResource({ role: "SUPPLIER", companyId: "company-1" }, "company-2"),
    ).toThrow(ForbiddenError);
  });

  it("rejects a user with no company at all", () => {
    expect(() => assertOwnsCompanyResource({ role: "BUYER", companyId: null }, "company-1")).toThrow(
      ForbiddenError,
    );
  });

  it("always allows an admin, regardless of company", () => {
    expect(() =>
      assertOwnsCompanyResource({ role: "ADMIN", companyId: null }, "company-1"),
    ).not.toThrow();
    expect(() =>
      assertOwnsCompanyResource({ role: "ADMIN", companyId: "company-9" }, "company-1"),
    ).not.toThrow();
  });
});
