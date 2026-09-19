"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialActionState);
  const t = useTranslations("auth");

  return (
    <form action={formAction} className="card space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="field-label" htmlFor="email">{t("emailLabel")}</label>
        <input className="field-input" id="email" name="email" type="email" required />
      </div>
      <div>
        <label className="field-label" htmlFor="password">{t("passwordLabel")}</label>
        <input className="field-input" id="password" name="password" type="password" required />
      </div>
      <SubmitButton>{t("loginButton")}</SubmitButton>
      <p className="text-sm text-slate-500">
        {t("noAccountYet")} <Link href="/register" className="underline">{t("registerLink")}</Link>
      </p>
    </form>
  );
}
