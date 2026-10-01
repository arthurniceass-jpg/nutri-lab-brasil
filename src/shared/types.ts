import type { Category } from "@prisma/client";

// DTO seguro para o cliente (NUNCA inclui custo/lucro)
export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  category: Category;
  image: string;
  rating: number;
  reviews: number;
  stock: number;
  flavor: string | null;
  weight: string | null;
  featured: boolean;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  quantity: number;
  stock: number;
};

export const FREE_SHIPPING_CENTS = 19900; // R$ 199,00
export const DEFAULT_SHIPPING_CENTS = 2490; // R$ 24,90
