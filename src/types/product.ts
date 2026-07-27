export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  slug: string;
  // additional fields as needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
