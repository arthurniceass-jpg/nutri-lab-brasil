import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Star, ShieldCheck, Truck, Award } from "lucide-react";
import { CartProvider } from "@/components/providers/cart-provider";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { CartSheet } from "@/components/store/cart-sheet";
import { ProductCard } from "@/components/store/product-card";
import { AddToCart } from "@/components/store/add-to-cart";
import { ReviewForm } from "@/components/store/review-form";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getRelatedProducts } from "@/server/services/products";
import { getCustomerSession } from "@/server/auth/customer";
import { getSettings } from "@/server/services/settings";
import { formatBRL, formatDate, installments } from "@/shared/format";
import { CATEGORY_LABEL } from "@/shared/categories";
import type { ProductDTO } from "@/shared/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado | NUTRI LAB BRASIL" };
  return {
    title: `${product.name} | NUTRI LAB BRASIL`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [product.image],
    },
  };
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, customer, settings] = await Promise.all([
    getProductBySlug(slug),
    getCustomerSession(),
    getSettings(),
  ]);
  if (!product || !product.active) notFound();

  const related = await getRelatedProducts(product.category, product.id);
  const { parts, partCents } = installments(product.priceCents);
  const gallery = [product.image, ...product.images].slice(0, 4);

  const dto: ProductDTO = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    category: product.category,
    image: product.image,
    rating: product.rating,
    reviews: product.reviews,
    stock: product.stock,
    flavor: product.flavor,
    weight: product.weight,
    featured: product.featured,
  };

  return (
    <CartProvider
      freeShippingCents={settings.freeShippingCents}
      defaultShippingCents={settings.defaultShippingCents}
    >
      <SiteHeader customerName={customer?.name} />
      <main id="conteudo" className="container py-8">
        <Link
          href="/#produtos"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
        >
          <ArrowLeft className="size-4" /> Voltar aos produtos
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galeria */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-steel">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
                priority
              />
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-md border border-border bg-steel"
                  >
                    <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <Badge variant="outline" className="mb-3">
              {CATEGORY_LABEL[product.category]}
            </Badge>
            <h1 className="display text-4xl text-foreground md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={
                      n <= Math.round(product.rating)
                        ? "size-4 fill-lime text-lime"
                        : "size-4 text-muted-foreground"
                    }
                  />
                ))}
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {product.rating.toFixed(1)} . {product.reviews} avaliações
              </span>
            </div>

            {(product.weight || product.flavor) && (
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                {[product.weight, product.flavor].filter(Boolean).join(" . ")}
              </p>
            )}

            <div className="mt-6">
              <p className="display text-5xl text-lime">
                {formatBRL(product.priceCents)}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                ou {parts}x de {formatBRL(partCents)} sem juros
              </p>
              {product.stock > 0 && product.stock <= 5 && (
                <p className="mt-1 text-sm font-semibold text-warning">
                  Últimas {product.stock} unidades
                </p>
              )}
            </div>

            <div className="mt-6">
              <AddToCart product={dto} />
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-2 border-t border-border pt-6 sm:grid-cols-3">
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-lime" /> 100% original
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="size-4 text-lime" /> Envio para todo Brasil
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="size-4 text-lime" /> Qualidade auditada
              </li>
            </ul>

            <div className="mt-6 space-y-4">
              <Section title="Descrição">{product.description}</Section>
              {product.usage && <Section title="Modo de uso">{product.usage}</Section>}
              {product.ingredients && (
                <Section title="Ingredientes">{product.ingredients}</Section>
              )}
            </div>
          </div>
        </div>

        {/* Avaliações */}
        <section className="mt-14">
          <h2 className="display mb-6 text-3xl text-foreground">
            Avaliações <span className="text-lime">({product.reviews})</span>
          </h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {product.productReviews.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground">
                  Ainda não ha avaliações. Seja o primeiro!
                </p>
              ) : (
                product.productReviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wide text-foreground">
                        {r.customerName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <div className="mb-2 flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= r.rating
                              ? "size-3.5 fill-lime text-lime"
                              : "size-3.5 text-muted-foreground"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
            <ReviewForm productId={product.id} isLoggedIn={!!customer} />
          </div>
        </section>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="display mb-6 text-3xl text-foreground">
              Você também <span className="text-lime">pode gostar</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter settings={settings} />
      <CartSheet />
    </CartProvider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
