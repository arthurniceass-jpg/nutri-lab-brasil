import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCog } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { Card } from "@/components/ui/card";
import { EditProfileForm } from "@/components/store/edit-profile-form";
import { getCustomerSession } from "@/server/auth/customer";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function EditarPerfilPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/conta/entrar?from=/conta/editar");

  const me = await prisma.customer.findUnique({ where: { id: session.id } });
  if (!me) redirect("/conta/entrar");

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center">
          <Link href="/" aria-label="Loja">
            <Logo />
          </Link>
        </div>
      </header>

      <div className="container max-w-2xl py-10">
        <Link
          href="/conta"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
        >
          <ArrowLeft className="size-4" /> Voltar para a conta
        </Link>

        <h1 className="display mb-6 flex items-center gap-2 text-3xl text-foreground md:text-4xl">
          <UserCog className="size-6 text-lime" /> Editar dados
        </h1>

        <Card className="p-5">
          <EditProfileForm
            initial={{
              name: me.name ?? "",
              cpf: me.cpf ?? "",
              cep: me.cep ?? "",
              address: me.address ?? "",
              number: me.number ?? "",
              complement: me.complement ?? "",
              neighborhood: me.neighborhood ?? "",
              city: me.city ?? "",
              state: me.state ?? "",
            }}
          />
        </Card>
      </div>
    </main>
  );
}
