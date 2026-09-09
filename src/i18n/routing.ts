import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sl", "en", "de", "it"],
  defaultLocale: "sl",
});

export type AppLocale = (typeof routing.locales)[number];
