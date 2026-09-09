import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="space-y-16">
      <section className="grid gap-10 py-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="section-title">Manufacturing capacity marketplace — Slovenia</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            Who can make this part — and who has room to make it when you need it?
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Capaciti matches buyers&apos; manufacturing requirements against real supplier machine
            capability <em>and</em> published weekly capacity — not just a supplier directory.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register?role=BUYER" className="btn-primary">
              I need parts made
            </Link>
            <Link href="/register?role=SUPPLIER" className="btn-secondary">
              I have machine capacity
            </Link>
          </div>
        </div>
        <div className="card">
          <p className="section-title">Example match</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">DMG Mori DMU 50 — Demo Precision d.o.o.</p>
            <span className="text-2xl font-bold text-slate-900">92%</span>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
            <li>✓ 5-axis requirement satisfied</li>
            <li>✓ Part fits machine travel</li>
            <li>✓ Aluminium supported</li>
            <li>✓ Capacity available before deadline</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 border-t border-slate-200 pt-10 md:grid-cols-2">
        <div>
          <h2 className="page-title">Capability, verified</h2>
          <p className="mt-2 text-slate-600">
            Every machine declares its process, dimensional envelope and supported materials.
            Requirements that don&apos;t fit are rejected — not guessed at.
          </p>
        </div>
        <div>
          <h2 className="page-title">Availability, published</h2>
          <p className="mt-2 text-slate-600">
            Suppliers keep a simple weekly capacity signal — available, limited, or full. A fully
            booked machine is never shown as a match.
          </p>
        </div>
      </section>
    </div>
  );
}
