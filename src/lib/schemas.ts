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

/** A translator function, typically `await getTranslations("validation")`.
 * Schemas are built per-request so every validation message is rendered in
 * the current locale rather than baked into a module-level English string.
 * None of these messages take interpolation params, so a plain
 * `(key: string) => string` is enough and keeps this decoupled from
 * next-intl's own (more specific) translator type. */
export type ValidationTranslator = (key: string) => string;

/** A zod error map, built from the same translator, that localizes the
 * generic issues zod raises when a field has no explicit custom message
 * (e.g. a bare `.url()` or `.min()` failure). Passed as a parse option
 * rather than via `z.setErrorMap` so it never leaks across concurrent
 * requests in different locales. */
export function buildZodErrorMap(t: ValidationTranslator): z.ZodErrorMap {
  return (issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.received === "undefined") return { message: t("required") };
        return { message: t("invalid") };
      case z.ZodIssueCode.too_small:
        return { message: issue.type === "string" ? t("tooShort") : t("tooSmall") };
      case z.ZodIssueCode.too_big:
        return { message: issue.type === "string" ? t("tooLong") : t("tooLarge") };
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") return { message: t("invalidEmail") };
        if (issue.validation === "url") return { message: t("invalidUrl") };
        return { message: t("invalid") };
      default:
        return { message: ctx.defaultError };
    }
  };
}

export function buildRegisterSchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(2, t("nameTooShort")).max(120),
    email: z.string().trim().email(t("invalidEmail")).max(255),
    password: z.string().min(8, t("passwordTooShort")).max(200),
    role: z.enum(["BUYER", "SUPPLIER"]),
  });
}

export function buildLoginSchema(t: ValidationTranslator) {
  return z.object({
    email: z.string().trim().email(t("invalidEmail")),
    password: z.string().min(1, t("required")),
  });
}

export function buildCompanySchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(2, t("nameTooShort")).max(160),
    country: z.string().trim().length(2, t("invalidCountryCode")).toUpperCase(),
    postalCode: z.string().trim().min(1).max(20),
    city: z.string().trim().min(1).max(120),
    website: z.union([z.string().trim().url(t("invalidUrl")), z.literal("")]).optional(),
    description: z.string().trim().max(2000).optional(),
    companyType: z.enum(["BUYER", "SUPPLIER", "BOTH"]),
  });
}

export function buildMachineCoreSchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(1).max(160),
    manufacturer: z.string().trim().max(120).optional(),
    model: z.string().trim().max(120).optional(),
    manufacturingProcessId: z.string().min(1),
    description: z.string().trim().max(2000).optional(),
    materialIds: z.array(z.string()).min(1, t("selectAtLeastOneMaterial")),
    minimumBatchSize: optionalPositiveInt(),
    maximumBatchSize: optionalPositiveInt(),
  });
}

export const AvailabilityEntrySchema = z.object({
  isoYear: z.number().int(),
  isoWeek: z.number().int().min(1).max(53),
  status: z.enum(["AVAILABLE", "LIMITED", "FULL"]),
  estimatedHours: z.number().int().min(0).max(500).nullable().optional(),
});

export function buildRfqCoreSchema(t: ValidationTranslator) {
  return z.object({
    title: z.string().trim().min(2, t("tooShort")).max(200),
    manufacturingProcessId: z.string().min(1),
    materialId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    requiredDeliveryDate: z.coerce.date(),
    description: z.string().trim().max(4000).optional(),
  });
}

export const ALLOWED_FILE_EXTENSIONS = ["step", "stp", "dxf", "pdf"] as const;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
