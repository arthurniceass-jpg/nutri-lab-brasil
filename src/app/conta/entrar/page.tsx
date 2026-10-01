import { Suspense } from "react";
import { AccountForm } from "@/components/store/account-form";

export default function EntrarPage() {
  return (
    <Suspense>
      <AccountForm mode="entrar" />
    </Suspense>
  );
}
