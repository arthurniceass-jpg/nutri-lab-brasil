import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./logo";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center">
          <Link href="/" aria-label="Loja">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="container max-w-3xl py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
        >
          <ArrowLeft className="size-4" /> Voltar para a loja
        </Link>
        <h1 className="display mb-6 text-4xl text-foreground md:text-5xl">
          {title}
        </h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-foreground">
          {children}
        </div>
      </div>
    </main>
  );
}
