import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/store/logo";

export default function PendentePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-10" />
      <Clock className="size-20 text-warning" />
      <h1 className="display mt-6 text-4xl text-foreground md:text-5xl">
        Pagamento <span className="text-warning">pendente</span>
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Estamos aguardando a confirmação do pagamento (Pix ou boleto). Assim que
        for aprovado, seu pedido será processado automaticamente.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Voltar para a loja</Link>
      </Button>
    </main>
  );
}
