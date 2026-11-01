import { CartProvider } from "@/components/providers/cart-provider";
import { SiteHeader } from "@/components/store/site-header";
import { ShakerLab } from "@/components/store/shaker-lab";
import { CartSheet } from "@/components/store/cart-sheet";
import { SiteFooter } from "@/components/store/site-footer";
import { getStoreProducts } from "@/server/services/products";
import { getCustomerSession } from "@/server/auth/customer";
import { getSettings } from "@/server/services/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Monte seu shaker | NUTRI LAB BRASIL",
  description:
    "Escolha seu objetivo, monte o stack com os produtos da Nutri Lab, veja o shake sendo misturado e leve a rotina do dia.",
};

export default async function ShakerPage() {
  const [products, customer, settings] = await Promise.all([
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
        <ShakerLab products={products} />
      </main>
      <SiteFooter settings={settings} />
      <CartSheet />
    </CartProvider>
  );
}
