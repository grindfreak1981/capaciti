import { de, enUS, it, sl, type Locale } from "date-fns/locale";

const DATE_FNS_LOCALES: Record<string, Locale> = { sl, en: enUS, de, it };

export function dateFnsLocale(locale: string): Locale {
  return DATE_FNS_LOCALES[locale] ?? enUS;
}
