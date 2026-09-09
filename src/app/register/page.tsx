import { RegisterForm } from "./RegisterForm";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const defaultRole = searchParams.role === "SUPPLIER" ? "SUPPLIER" : "BUYER";

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">You&apos;ll set up your company profile next.</p>
      </div>
      <RegisterForm defaultRole={defaultRole} />
    </div>
  );
}
