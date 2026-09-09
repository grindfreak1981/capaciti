import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toIsoWeekRef } from "@/domain/matching/weeks";
import { AvailabilityBadge } from "@/components/StatusBadge";

export default async function MachinesPage() {
  const { company } = await requireCompany();
  if (company.companyType === "BUYER") redirect("/dashboard");

  const machines = await prisma.machine.findMany({
    where: { companyId: company.id },
    include: { manufacturingProcess: true, availability: true },
    orderBy: { createdAt: "desc" },
  });

  const currentWeek = toIsoWeekRef(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Machines</h1>
        <Link href="/machines/new" className="btn-primary">
          Add machine
        </Link>
      </div>

      {machines.length === 0 ? (
        <div className="card text-sm text-slate-500">
          No machines yet. Add your first machine to start receiving matching RFQs.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
          {machines.map((machine) => {
            const currentAvailability = machine.availability.find(
              (a) => a.isoYear === currentWeek.isoYear && a.isoWeek === currentWeek.isoWeek,
            );
            return (
              <Link
                key={machine.id}
                href={`/machines/${machine.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-900">{machine.name}</p>
                  <p className="text-sm text-slate-500">
                    {machine.manufacturer} {machine.model} · {machine.manufacturingProcess.name}
                  </p>
                </div>
                <AvailabilityBadge status={currentAvailability?.status ?? "UNKNOWN"} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
