import { AccountMenu } from "@/components/store/account-menu";

// Rota TEMPORÁRIA de prévia (dev). Renderiza só o header + o card de conta/nível
// sem depender do banco. Pode ser apagada depois — a integração real está no
// site-header.tsx (aparece no site quando o banco estiver de pé / em produção).
export default function PreviewConta() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-display text-2xl leading-none">
            <span className="text-foreground">N</span>
            <span className="text-lime">L</span>
          </span>
          <AccountMenu customerName="Arthur Niceas" />
        </div>
      </header>

      <main className="container py-20">
        <p className="font-mono text-sm text-muted-foreground">
          Prévia (dev) — clique no botão “Arthur” no canto superior direito para
          abrir o card de conta com perfil, pedidos e sair.
        </p>
      </main>
    </div>
  );
}
