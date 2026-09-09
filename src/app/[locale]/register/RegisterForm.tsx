"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function RegisterForm({ defaultRole }: { defaultRole: "BUYER" | "SUPPLIER" }) {
  const [state, formAction] = useFormState(registerAction, initialActionState);
  const t = useTranslations("auth");

  return (
    <form action={formAction} className="card space-y-4">
      <FormMessage state={state} />

      <div>
        <span className="field-label">{t("roleQuestion")}</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="BUYER" defaultChecked={defaultRole === "BUYER"} />
            {t("roleBuyer")}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="role" value="SUPPLIER" defaultChecked={defaultRole === "SUPPLIER"} />
            {t("roleSupplier")}
          </label>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="name">{t("fullNameLabel")}</label>
        <input className="field-input" id="name" name="name" required minLength={2} />
        <FieldErrors state={state} name="name" />
      </div>

      <div>
        <label className="field-label" htmlFor="email">{t("workEmailLabel")}</label>
        <input className="field-input" id="email" name="email" type="email" required />
        <FieldErrors state={state} name="email" />
      </div>

      <div>
        <label className="field-label" htmlFor="password">{t("passwordLabel")}</label>
        <input className="field-input" id="password" name="password" type="password" required minLength={8} />
        <FieldErrors state={state} name="password" />
      </div>

      <SubmitButton>{t("createAccountButton")}</SubmitButton>

      <p className="text-sm text-slate-500">
        {t("alreadyHaveAccount")} <Link href="/login" className="underline">{t("loginLink")}</Link>
      </p>
    </form>
  );
}
