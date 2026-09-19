import { describe, expect, it } from "vitest";
import { validateUploadedFile } from "./validation";

function makeFile(name: string, sizeBytes: number, type = "application/octet-stream"): File {
  const content = sizeBytes > 0 ? new Uint8Array(sizeBytes) : new Uint8Array(0);
  return new File([content], name, { type });
}

describe("validateUploadedFile", () => {
  it("accepts an allowed extension", () => {
    for (const name of ["part.step", "part.stp", "drawing.dxf", "spec.pdf", "PART.STEP"]) {
      const result = validateUploadedFile(makeFile(name, 1024));
      expect(result.ok).toBe(true);
    }
  });

  it("rejects a disallowed extension", () => {
    const result = validateUploadedFile(makeFile("model.zip", 1024));
    expect(result.ok).toBe(false);
  });

  it("rejects a file with no extension", () => {
    const result = validateUploadedFile(makeFile("noextension", 1024));
    expect(result.ok).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = validateUploadedFile(makeFile("part.step", 0));
    expect(result.ok).toBe(false);
  });

  it("rejects a file exceeding the maximum size", () => {
    const result = validateUploadedFile(makeFile("huge.pdf", 26 * 1024 * 1024));
    expect(result.ok).toBe(false);
  });

  it("accepts a file right at the size limit", () => {
    const result = validateUploadedFile(makeFile("ok.pdf", 25 * 1024 * 1024));
    expect(result.ok).toBe(true);
  });
});
