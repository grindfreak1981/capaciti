import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCompaniesPage() {
  await requireAdmin();
  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true, machines: true, rfqs: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="page-title">Companies</h1>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Users</th>
              <th className="px-4 py-2">Machines</th>
              <th className="px-4 py-2">RFQs</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-2">{c.companyType}</td>
                <td className="px-4 py-2">{c.city}, {c.country}</td>
                <td className="px-4 py-2">{c._count.users}</td>
                <td className="px-4 py-2">{c._count.machines}</td>
                <td className="px-4 py-2">{c._count.rfqs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
