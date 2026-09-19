import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/redirect";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) await redirect("/dashboard");

  const t = await getTranslations("home");

  return (
    <div className="space-y-16">
      <section className="grid gap-10 py-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="section-title">{t("kicker")}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{t("heading")}</h1>
          <p className="mt-4 text-lg text-slate-600">
            {t.rich("subheading", { em: (chunks) => <em>{chunks}</em> })}
          </p>
          <div className="mt-8 flex gap-3">
            <Link href={{ pathname: "/register", query: { role: "BUYER" } }} className="btn-primary">
              {t("ctaBuyer")}
            </Link>
            <Link href={{ pathname: "/register", query: { role: "SUPPLIER" } }} className="btn-secondary">
              {t("ctaSupplier")}
            </Link>
          </div>
        </div>
        <div className="card">
          <p className="section-title">{t("exampleTitle")}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">DMG Mori DMU 50 — Demo Precision d.o.o.</p>
            <span className="text-2xl font-bold text-slate-900">92%</span>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
            <li>✓ {t("exampleReason1")}</li>
            <li>✓ {t("exampleReason2")}</li>
            <li>✓ {t("exampleReason3")}</li>
            <li>✓ {t("exampleReason4")}</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 border-t border-slate-200 pt-10 md:grid-cols-2">
        <div>
          <h2 className="page-title">{t("featureCapabilityTitle")}</h2>
          <p className="mt-2 text-slate-600">{t("featureCapabilityBody")}</p>
        </div>
        <div>
          <h2 className="page-title">{t("featureAvailabilityTitle")}</h2>
          <p className="mt-2 text-slate-600">{t("featureAvailabilityBody")}</p>
        </div>
      </section>
    </div>
  );
}
