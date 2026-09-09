"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialActionState);

  return (
    <form action={formAction} className="card space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input className="field-input" id="email" name="email" type="email" required />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input className="field-input" id="password" name="password" type="password" required />
      </div>
      <SubmitButton>Log in</SubmitButton>
      <p className="text-sm text-slate-500">
        No account yet? <Link href="/register" className="underline">Register</Link>
      </p>
    </form>
  );
}
