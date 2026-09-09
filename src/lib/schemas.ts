import { z } from "zod";

/** HTML forms submit empty optional number inputs as "", which
 * z.coerce.number() turns into 0 — this treats blank as genuinely absent
 * before coercion runs. */
function optionalPositiveInt(message?: string) {
  return z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce.number().int().positive(message).optional(),
  );
}

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["BUYER", "SUPPLIER"]),
});

export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const CompanySchema = z.object({
  name: z.string().trim().min(2).max(160),
  country: z.string().trim().length(2, "Use a 2-letter ISO country code (e.g. SI)").toUpperCase(),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(120),
  website: z.union([z.string().trim().url(), z.literal("")]).optional(),
  description: z.string().trim().max(2000).optional(),
  companyType: z.enum(["BUYER", "SUPPLIER", "BOTH"]),
});

export const MachineCoreSchema = z.object({
  name: z.string().trim().min(1).max(160),
  manufacturer: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
  manufacturingProcessId: z.string().min(1),
  description: z.string().trim().max(2000).optional(),
  materialIds: z.array(z.string()).min(1, "Select at least one material"),
  minimumBatchSize: optionalPositiveInt(),
  maximumBatchSize: optionalPositiveInt(),
});

export const AvailabilityEntrySchema = z.object({
  isoYear: z.number().int(),
  isoWeek: z.number().int().min(1).max(53),
  status: z.enum(["AVAILABLE", "LIMITED", "FULL"]),
  estimatedHours: z.number().int().min(0).max(500).nullable().optional(),
});

export const RfqCoreSchema = z.object({
  title: z.string().trim().min(2).max(200),
  manufacturingProcessId: z.string().min(1),
  materialId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  requiredDeliveryDate: z.coerce.date(),
  description: z.string().trim().max(4000).optional(),
});

export const ALLOWED_FILE_EXTENSIONS = ["step", "stp", "dxf", "pdf"] as const;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
