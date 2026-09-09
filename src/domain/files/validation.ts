import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/lib/schemas";

export type FileValidationResult =
  | { ok: true; extension: (typeof ALLOWED_FILE_EXTENSIONS)[number] }
  | { ok: false; error: string };

/** Validates an uploaded technical file by extension and size. Browsers
 * report unreliable/absent MIME types for CAD formats (STEP/DXF), so
 * extension + size is the practical, deterministic check here — content
 * type is still recorded for display purposes but is not trusted. */
export function validateUploadedFile(file: File): FileValidationResult {
  const nameParts = file.name.split(".");
  const extension = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : "";

  if (!ALLOWED_FILE_EXTENSIONS.includes(extension as (typeof ALLOWED_FILE_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: `File type ".${extension || "unknown"}" is not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(", ").toUpperCase()}`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: `File "${file.name}" is empty` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File "${file.name}" exceeds the maximum size of ${Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB`,
    };
  }
  return { ok: true, extension: extension as (typeof ALLOWED_FILE_EXTENSIONS)[number] };
}
