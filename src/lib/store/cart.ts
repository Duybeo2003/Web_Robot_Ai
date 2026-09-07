import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // productId
  variantId?: string; // new variant id
  variantAttributes?: Record<string, string>; // to show "Màu sắc: Đỏ" in cart
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  slug: string;
  supplyType?: string; // used for preorder logic
  depositPercent?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (i) => i.id === item.id && i.variantId === item.variantId,
        );

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id && i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...currentItems, item] });
        }
      },
      removeItem: (id, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.variantId === variantId),
          ),
        });
      },
      updateQuantity: (id, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(id, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id && i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "RoboEQ-cart",
    },
  ),
);
