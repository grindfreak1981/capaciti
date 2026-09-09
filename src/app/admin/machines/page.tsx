import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toIsoWeekRef } from "@/domain/matching/weeks";
import { AvailabilityBadge } from "@/components/StatusBadge";

export default async function AdminMachinesPage() {
  await requireAdmin();
  const machines = await prisma.machine.findMany({
    include: { company: true, manufacturingProcess: true, availability: true },
    orderBy: { createdAt: "desc" },
  });
  const currentWeek = toIsoWeekRef(new Date());

  return (
    <div className="space-y-6">
      <h1 className="page-title">Machines</h1>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Machine</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Process</th>
              <th className="px-4 py-2">This week</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => {
              const current = m.availability.find(
                (a) => a.isoYear === currentWeek.isoYear && a.isoWeek === currentWeek.isoWeek,
              );
              return (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-2">{m.company.name}</td>
                  <td className="px-4 py-2">{m.manufacturingProcess.name}</td>
                  <td className="px-4 py-2">
                    <AvailabilityBadge status={current?.status ?? "UNKNOWN"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
