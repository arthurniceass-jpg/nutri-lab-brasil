import { Logo } from "./logo";

type FooterSettings = {
  storeName: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  cnpj: string | null;
  address: string | null;
};

export function SiteFooter({ settings }: { settings?: FooterSettings }) {
  const name = settings?.storeName ?? "NUTRI LAB BRASIL";

  return (
    <footer className="border-t border-border bg-carbon">
      <div className="container py-12">
        <div className="skew-band mb-10 border-y-2 border-lime bg-lime/5 py-6">
          <p className="display text-center text-3xl text-foreground md:text-5xl">
            Energia. <span className="text-lime">Foco.</span> Disciplina.{" "}
            <span className="text-lime">Evolução.</span>
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {name}. Suplementos de alta performance, 100% originais, com envio
              rápido para todo o Brasil.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
              Loja
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/catalogo" className="hover:text-lime">Produtos</a></li>
              <li><a href="#categorias" className="hover:text-lime">Categorias</a></li>
              <li><a href="#confianca" className="hover:text-lime">Por que nós</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
              Contato
            </h3>
            <ul className="space-y-2 font-mono text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${settings?.email ?? "contato@nutrilab.com.br"}`}
                  className="hover:text-lime"
                >
                  {settings?.email ?? "contato@nutrilab.com.br"}
                </a>
              </li>
              {settings?.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    className="hover:text-lime"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp {settings.whatsapp}
                  </a>
                </li>
              )}
              {settings?.phone && <li>{settings.phone}</li>}
              {settings?.instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                    className="hover:text-lime"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {settings.instagram}
                  </a>
                </li>
              )}
              <li>Seg a Sex, 9h às 18h</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-xs">
          <a href="/politicas/trocas" className="text-muted-foreground hover:text-lime">
            Trocas e devoluções
          </a>
          <a href="/politicas/privacidade" className="text-muted-foreground hover:text-lime">
            Privacidade
          </a>
          <a href="/politicas/termos" className="text-muted-foreground hover:text-lime">
            Termos de uso
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p className="font-mono">
            &copy; 2026 {name}. Todos os direitos reservados.
          </p>
          <p className="font-mono">
            {settings?.cnpj ? `CNPJ ${settings.cnpj} . ` : ""}
            Suplemento alimentar
          </p>
        </div>
      </div>
    </footer>
  );
}
