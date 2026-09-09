"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function RegisterForm({ defaultRole }: { defaultRole: "BUYER" | "SUPPLIER" }) {
  const [state, formAction] = useFormState(registerAction, initialActionState);

  return (
    <form action={formAction} className="card space-y-4">
      <FormMessage state={state} />

      <div>
        <span className="field-label">I am a…</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="BUYER" defaultChecked={defaultRole === "BUYER"} />
            Buyer — I need parts made
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="SUPPLIER" defaultChecked={defaultRole === "SUPPLIER"} />
            Supplier — I have machine capacity
          </label>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="name">Full name</label>
        <input className="field-input" id="name" name="name" required minLength={2} />
        <FieldErrors state={state} name="name" />
      </div>

      <div>
        <label className="field-label" htmlFor="email">Work email</label>
        <input className="field-input" id="email" name="email" type="email" required />
        <FieldErrors state={state} name="email" />
      </div>

      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input className="field-input" id="password" name="password" type="password" required minLength={8} />
        <FieldErrors state={state} name="password" />
      </div>

      <SubmitButton>Create account</SubmitButton>

      <p className="text-sm text-slate-500">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </form>
  );
}
