export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  slug: string;
  // additional fields as needed
   
  [key: string]: any;
}
