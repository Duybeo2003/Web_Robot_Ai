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
  inventoryCount?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (item.inventoryCount !== undefined && item.inventoryCount <= 0) return;
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (i) => i.id === item.id && i.variantId === item.variantId,
        );

        if (existingItem) {
          const maxQuantity = Math.min(
            99,
            item.inventoryCount ?? existingItem.inventoryCount ?? 99,
          );
          set({
            items: currentItems.map((i) =>
              i.id === item.id && i.variantId === item.variantId
                ? {
                    ...i,
                    ...item,
                    quantity: Math.min(maxQuantity, i.quantity + item.quantity),
                  }
                : i,
            ),
          });
        } else {
          set({
            items: [
              ...currentItems,
              {
                ...item,
                quantity: Math.min(
                  99,
                  item.inventoryCount ?? 99,
                  Math.max(1, item.quantity),
                ),
              },
            ],
          });
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
            i.id === id && i.variantId === variantId
              ? {
                  ...i,
                  quantity: Math.min(99, i.inventoryCount ?? 99, quantity),
                }
              : i,
          ),
        });
      },
      replaceItems: (items) => set({ items }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "RoboEQ-cart",
    },
  ),
);
