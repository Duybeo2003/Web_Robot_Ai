export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  slug: string;
  supplyType?: "IN_HOUSE" | "AFFILIATE_SELL" | "PRE_ORDER" | "AFFILIATE_HOST";
}
