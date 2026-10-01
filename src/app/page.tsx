import { CartProvider } from "@/components/providers/cart-provider";
import { SiteHeader } from "@/components/store/site-header";
import { Hero } from "@/components/store/hero";
import { TrustBar } from "@/components/store/trust-bar";
import { Storefront } from "@/components/store/storefront";
import { CartSheet } from "@/components/store/cart-sheet";
import { SiteFooter } from "@/components/store/site-footer";
import { getStoreProducts } from "@/server/services/products";
import { getCustomerSession } from "@/server/auth/customer";
import { getSettings } from "@/server/services/settings";

export const dynamic = "force-dynamic";

export default async function HomePage({
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
        <Hero />
        <TrustBar />
        <Storefront
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
