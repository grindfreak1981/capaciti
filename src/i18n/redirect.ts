import { getLocale } from "next-intl/server";
import { redirect as intlRedirect } from "./navigation";

type RedirectHref = Parameters<typeof intlRedirect>[0]["href"];

/**
 * `redirect` from `next-intl/navigation` requires the current locale to be
 * passed explicitly in a Server Component/Server Action (there is no
 * implicit request context to read it from there, unlike client hooks).
 * This wrapper reads it via `getLocale()` so call sites can redirect to a
 * plain app-relative path the same way `next/navigation`'s redirect works.
 */
export async function redirect(href: RedirectHref): Promise<never> {
  const locale = await getLocale();
  return intlRedirect({ href, locale });
}
