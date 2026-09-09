"use client";

import { useFormState } from "react-dom";
import { createCompanyAction } from "@/app/actions/companies";
import { initialActionState } from "@/lib/action-state";
import { FieldErrors, FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function CompanyForm({ userRole }: { userRole: "BUYER" | "SUPPLIER" | "ADMIN" }) {
  const [state, formAction] = useFormState(createCompanyAction, initialActionState);
  const defaultType = userRole === "ADMIN" ? "BOTH" : userRole;

  return (
    <form action={formAction} className="card space-y-4">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="name">Company name</label>
        <input className="field-input" id="name" name="name" required minLength={2} />
        <FieldErrors state={state} name="name" />
      </div>

      <div>
        <span className="field-label">Company type</span>
        <select className="field-input" name="companyType" defaultValue={defaultType}>
          <option value="BUYER">Buyer — sourcing manufactured parts</option>
          <option value="SUPPLIER">Supplier — offering machine capacity</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="field-label" htmlFor="country">Country</label>
          <input className="field-input" id="country" name="country" defaultValue="SI" maxLength={2} required />
          <FieldErrors state={state} name="country" />
        </div>
        <div>
          <label className="field-label" htmlFor="postalCode">Postal code</label>
          <input className="field-input" id="postalCode" name="postalCode" required />
        </div>
        <div>
          <label className="field-label" htmlFor="city">City</label>
          <input className="field-input" id="city" name="city" required />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="website">Website (optional)</label>
        <input className="field-input" id="website" name="website" type="url" placeholder="https://" />
        <FieldErrors state={state} name="website" />
      </div>

      <div>
        <label className="field-label" htmlFor="description">Description (optional)</label>
        <textarea className="field-input" id="description" name="description" rows={3} />
      </div>

      <SubmitButton>Create company</SubmitButton>
    </form>
  );
}
