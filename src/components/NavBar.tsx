import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function NavBar() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("nav")]);

  return (
    <header className="border-b border-slate-200 bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-bold tracking-tight">
          CAPACITI
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-white text-slate-300">
                {t("dashboard")}
              </Link>
              {user.company?.companyType !== "BUYER" && (
                <Link href="/machines" className="hover:text-white text-slate-300">
                  {t("machines")}
                </Link>
              )}
              {user.company?.companyType !== "SUPPLIER" && (
                <Link href="/rfqs" className="hover:text-white text-slate-300">
                  {t("rfqs")}
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-white text-slate-300">
                  {t("admin")}
                </Link>
              )}
              <span className="text-slate-400">{user.name}</span>
              <form action={logoutAction}>
                <button type="submit" className="text-slate-300 hover:text-white">
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white text-slate-300">
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded bg-white px-3 py-1.5 font-semibold text-slate-900 hover:bg-slate-100"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
