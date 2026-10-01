import { Suspense } from "react";
import { AccountForm } from "@/components/store/account-form";

export default function CadastroPage() {
  return (
    <Suspense>
      <AccountForm mode="cadastro" />
    </Suspense>
  );
}
