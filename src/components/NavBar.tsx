import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export async function NavBar() {
  const user = await getCurrentUser();

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
                Dashboard
              </Link>
              {user.company?.companyType !== "BUYER" && (
                <Link href="/machines" className="hover:text-white text-slate-300">
                  Machines
                </Link>
              )}
              {user.company?.companyType !== "SUPPLIER" && (
                <Link href="/rfqs" className="hover:text-white text-slate-300">
                  RFQs
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-white text-slate-300">
                  Admin
                </Link>
              )}
              <span className="text-slate-400">{user.name}</span>
              <form action={logoutAction}>
                <button type="submit" className="text-slate-300 hover:text-white">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white text-slate-300">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-white px-3 py-1.5 font-semibold text-slate-900 hover:bg-slate-100"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
