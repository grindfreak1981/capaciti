import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();

  const [companies, users, machines, rfqs, matches, t] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.machine.count(),
    prisma.rfq.count(),
    prisma.matchResult.count({ where: { compatible: true } }),
    getTranslations("admin"),
  ]);

  const stats = [
    { label: t("companiesStat"), value: companies, href: "/admin/companies" },
    { label: t("usersStat"), value: users, href: null },
    { label: t("machinesStat"), value: machines, href: "/admin/machines" },
    { label: t("rfqsStat"), value: rfqs, href: "/admin/rfqs" },
    { label: t("compatibleMatchesStat"), value: matches, href: null },
  ];

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t("overviewTitle")}</h1>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const content = (
            <div className="card">
              <p className="section-title">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
