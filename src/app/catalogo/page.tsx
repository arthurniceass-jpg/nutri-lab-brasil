import { CartProvider } from "@/components/providers/cart-provider";
import { SiteHeader } from "@/components/store/site-header";
import { CatalogView } from "@/components/store/catalog-view";
import { CartSheet } from "@/components/store/cart-sheet";
import { SiteFooter } from "@/components/store/site-footer";
import { getStoreProducts } from "@/server/services/products";
import { getCustomerSession } from "@/server/auth/customer";
import { getSettings } from "@/server/services/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catálogo | NUTRI LAB BRASIL" };

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ objetivo?: string; categoria?: string }>;
}) {
  const [{ objetivo, categoria }, products, customer, settings] = await Promise.all([
    searchParams,
    getStoreProducts(),
    getCustomerSession(),
    getSettings(),
  ]);

  return (
    <CartProvider
      freeShippingCents={settings.freeShippingCents}
      defaultShippingCents={settings.defaultShippingCents}
    >
      <SiteHeader customerName={customer?.name} />
      <main id="conteudo">
        <CatalogView
          products={products}
          initialObjetivo={objetivo ?? null}
          initialCategoria={categoria ?? null}
        />
      </main>
      <SiteFooter settings={settings} />
      <CartSheet />
    </CartProvider>
  );
}
