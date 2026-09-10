export type CartItem = {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  name: string;
  price: number;
  itemType: "veg" | "non_veg";
  imageUrl: string | null;
  quantity: number;
};

export const CART_STORAGE_KEY = "aarambh-cart";

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(items)
    );

    window.dispatchEvent(new Event("cart-updated"));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

export function addToCart(item: CartItem) {
  const currentItems = getCartItems();

  const existingItem = currentItems.find(
    (cartItem) => cartItem.id === item.id
  );

  if (existingItem) {
    const updatedItems = currentItems.map((cartItem) =>
      cartItem.id === item.id
        ? {
            ...cartItem,
            quantity: cartItem.quantity + item.quantity,
          }
        : cartItem
    );

    saveCartItems(updatedItems);
    return updatedItems;
  }

  const updatedItems = [...currentItems, item];

  saveCartItems(updatedItems);

  return updatedItems;
}

export function updateCartQuantity(
  itemId: string,
  quantity: number
) {
  const currentItems = getCartItems();

  if (quantity <= 0) {
    return removeFromCart(itemId);
  }

  const updatedItems = currentItems.map((item) =>
    item.id === itemId
      ? {
          ...item,
          quantity,
        }
      : item
  );

  saveCartItems(updatedItems);

  return updatedItems;
}

export function removeFromCart(itemId: string) {
  const currentItems = getCartItems();

  const updatedItems = currentItems.filter(
    (item) => item.id !== itemId
  );

  saveCartItems(updatedItems);

  return updatedItems;
}

export function clearCart() {
  saveCartItems([]);
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}