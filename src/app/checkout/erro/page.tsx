import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/store/logo";

export default function ErroPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-10" />
      <XCircle className="size-20 text-destructive" />
      <h1 className="display mt-6 text-4xl text-foreground md:text-5xl">
        Pagamento <span className="text-destructive">não concluído</span>
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Algo deu errado no pagamento. Seu carrinho continua salvo. Tente
        novamente quando quiser.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Voltar para a loja</Link>
      </Button>
    </main>
  );
}
