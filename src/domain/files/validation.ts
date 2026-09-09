import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/lib/schemas";

export type FileValidationResult =
  | { ok: true; extension: (typeof ALLOWED_FILE_EXTENSIONS)[number] }
  | { ok: false; errorCode: "fileTypeNotAllowed"; errorParams: { extension: string; allowed: string } }
  | { ok: false; errorCode: "fileEmpty"; errorParams: { name: string } }
  | { ok: false; errorCode: "fileTooLarge"; errorParams: { name: string; maxMb: number } };

/** Validates an uploaded technical file by extension and size. Browsers
 * report unreliable/absent MIME types for CAD formats (STEP/DXF), so
 * extension + size is the practical, deterministic check here — content
 * type is still recorded for display purposes but is not trusted.
 *
 * Errors are returned as a translation code + params, not rendered text,
 * so the caller can localize them for the current UI language. */
export function validateUploadedFile(file: File): FileValidationResult {
  const nameParts = file.name.split(".");
  const extension = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : "";

  if (!ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number])) {
    return {
      ok: false,
      errorCode: "fileTypeNotAllowed",
      errorParams: { extension: extension || "unknown", allowed: ALLOWED_FILE_EXTENSIONS.join(", ").toUpperCase() },
    };
  }
  if (file.size === 0) {
    return { ok: false, errorCode: "fileEmpty", errorParams: { name: file.name } };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      errorCode: "fileTooLarge",
      errorParams: { name: file.name, maxMb: Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024)) },
    };
  }
  return { ok: true, extension: extension as (typeof ALLOWED_FILE_EXTENSIONS)[number] };
}
