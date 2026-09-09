"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { createCompanyAction } from "@/app/actions/companies";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function CompanyForm({ userRole }: { userRole: "BUYER" | "SUPPLIER" | "ADMIN" }) {
  const [state, formAction] = useFormState(createCompanyAction, initialActionState);
  const defaultType = userRole === "ADMIN" ? "BOTH" : userRole;
  const t = useTranslations("company");

  return (
    <form action={formAction} className="card space-y-4">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="name">{t("nameLabel")}</label>
        <input className="field-input" id="name" name="name" required minLength={2} />
        <FieldErrors state={state} name="name" />
      </div>

      <div>
        <span className="field-label">{t("typeLabel")}</span>
        <select className="field-input" name="companyType" defaultValue={defaultType}>
          <option value="BUYER">{t("typeBuyerOption")}</option>
          <option value="SUPPLIER">{t("typeSupplierOption")}</option>
          <option value="BOTH">{t("typeBothOption")}</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="field-label" htmlFor="country">{t("countryLabel")}</label>
          <input className="field-input" id="country" name="country" defaultValue="SI" maxLength={2} required />
          <FieldErrors state={state} name="country" />
        </div>
        <div>
          <label className="field-label" htmlFor="postalCode">{t("postalCodeLabel")}</label>
          <input className="field-input" id="postalCode" name="postalCode" required />
        </div>
        <div>
          <label className="field-label" htmlFor="city">{t("cityLabel")}</label>
          <input className="field-input" id="city" name="city" required />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="website">{t("websiteLabel")}</label>
        <input className="field-input" id="website" name="website" type="url" placeholder="https://" />
        <FieldErrors state={state} name="website" />
      </div>

      <div>
        <label className="field-label" htmlFor="description">{t("descriptionLabel")}</label>
        <textarea className="field-input" id="description" name="description" rows={3} />
      </div>

      <SubmitButton>{t("createButton")}</SubmitButton>
    </form>
  );
}
