import { getTranslations } from "next-intl/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="page-title">{t("loginTitle")}</h1>
      <LoginForm />
    </div>
  );
}
