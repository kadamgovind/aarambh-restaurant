"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";

import {
  addToCart,
  getCartItemCount,
  getCartItems,
  getCartSubtotal,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";

import {
  getActiveRestaurant,
} from "@/lib/restaurant";

import {
  getMenuData,
  type MenuCategory,
  type MenuItem,
} from "@/lib/menu";

type Restaurant = Awaited<
  ReturnType<typeof getActiveRestaurant>
>;

export default function OrderClient() {
  const [restaurant, setRestaurant] =
    useState<Restaurant>(null);

  const [categories, setCategories] = useState<
    MenuCategory[]
  >([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");

  const [cartItems, setCartItems] = useState<CartItem[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function loadOrderData() {
      try {
        setLoading(true);
        setError(null);

        const activeRestaurant =
          await getActiveRestaurant();

        if (!activeRestaurant) {
          setError(
            "Restaurant information is currently unavailable."
          );
          return;
        }

        setRestaurant(activeRestaurant);

        const data = await getMenuData(
          activeRestaurant.id
        );

        setCategories(data.categories);
        setMenuItems(data.items);

        setCartItems(getCartItems());
      } catch (err) {
        console.error(
          "Failed to load ordering page:",
          err
        );

        setError(
          "Unable to load the menu right now. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrderData();
  }, []);

  useEffect(() => {
    function handleCartUpdate() {
      setCartItems(getCartItems());
    }

    window.addEventListener(
      "cart-updated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdate
      );
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") {
      return menuItems;
    }

    return menuItems.filter(
      (item) =>
        item.category_id === selectedCategory
    );
  }, [menuItems, selectedCategory]);

  const itemCount = useMemo(
    () => getCartItemCount(cartItems),
    [cartItems]
  );

  const subtotal = useMemo(
    () => getCartSubtotal(cartItems),
    [cartItems]
  );

  const deliveryFee =
    subtotal === 0
      ? 0
      : subtotal >= 1000
        ? 0
        : 49;

  const taxes = Math.round(subtotal * 0.05);

  const total = subtotal + deliveryFee + taxes;

  function getCartQuantity(menuItemId: string) {
    return (
      cartItems.find(
        (item) => item.id === menuItemId
      )?.quantity || 0
    );
  }

  function handleAddToCart(item: MenuItem) {
    if (!restaurant) {
      return;
    }

    const updatedItems = addToCart({
      id: item.id,
      restaurantId: item.restaurant_id,
      categoryId: item.category_id,
      name: item.name,
      price: Number(item.price),
      itemType: item.item_type,
      imageUrl: item.image_url,
      quantity: 1,
    });

    setCartItems(updatedItems);
  }

  function handleIncrease(item: MenuItem) {
    const quantity = getCartQuantity(item.id);

    if (quantity === 0) {
      handleAddToCart(item);
      return;
    }

    const updatedItems = updateCartQuantity(
      item.id,
      quantity + 1
    );

    setCartItems(updatedItems);
  }

  function handleDecrease(item: MenuItem) {
    const quantity = getCartQuantity(item.id);

    if (quantity <= 0) {
      return;
    }

    const updatedItems = updateCartQuantity(
      item.id,
      quantity - 1
    );

    setCartItems(updatedItems);
  }

  const restaurantName =
    restaurant?.name || "Aarambh Restaurant";

  if (loading) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 pt-24">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="mt-6 text-sm text-white/40">
              Loading our menu...
            </p>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 pt-24">
          <div className="max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Ordering
            </p>

            <h1 className="mt-5 text-4xl font-light tracking-tight md:text-5xl">
              Menu unavailable
            </h1>

            <p className="mt-6 leading-7 text-white/45">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-8 rounded-full bg-[#c9a45c] px-7 py-3 text-sm font-medium text-black transition hover:bg-[#d8b873]"
            >
              Try Again
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="border-b border-white/10 px-6 pb-20 pt-36 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            {restaurantName} Delivery
          </p>

          <h1 className="max-w-4xl text-5xl font-light tracking-tight md:text-7xl">
            Exceptional food,
            <br />
            delivered to you.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">
            Order from our current menu and enjoy
            {restaurantName} wherever you are.
          </p>
        </div>
      </section>

      {/* CATEGORY NAVIGATION */}
      <section className="sticky top-[73px] z-30 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-4 lg:px-8">
          <button
            type="button"
            onClick={() =>
              setSelectedCategory("all")
            }
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition ${
              selectedCategory === "all"
                ? "bg-[#c9a45c] text-black"
                : "border border-white/10 text-white/55 hover:border-white/25 hover:text-white"
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setSelectedCategory(category.id)
              }
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition ${
                selectedCategory === category.id
                  ? "bg-[#c9a45c] text-black"
                  : "border border-white/10 text-white/55 hover:border-white/25 hover:text-white"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_360px]">
          {/* MENU */}
          <div>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                  Our Selection
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  {selectedCategory === "all"
                    ? "Our Menu"
                    : categories.find(
                        (category) =>
                          category.id ===
                          selectedCategory
                      )?.name || "Menu"}
                </h2>
              </div>

              <div className="hidden text-sm text-white/35 sm:block">
                {filteredItems.length} items
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-20 text-center">
                <div className="text-4xl text-white/20">
                  🍽️
                </div>

                <h3 className="mt-5 text-xl font-light">
                  No items available
                </h3>

                <p className="mt-3 text-sm text-white/40">
                  Please check another category.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {filteredItems.map((item) => {
                  const quantity =
                    getCartQuantity(item.id);

                  return (
                    <article
                      key={item.id}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition hover:border-[#c9a45c]/30"
                    >
                      {/* IMAGE */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-5xl text-white/15">
                            🍽️
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {item.is_featured && (
                          <span className="absolute left-4 top-4 rounded-full border border-[#c9a45c]/40 bg-black/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#c9a45c] backdrop-blur">
                            Aarambh Special
                          </span>
                        )}

                        <span className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
                          {item.item_type === "veg"
                            ? "Veg"
                            : "Non-Veg"}
                        </span>
                      </div>

                      {/* DETAILS */}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl font-medium">
                            {item.name}
                          </h3>

                          <span className="whitespace-nowrap text-[#c9a45c]">
                            ₹
                            {Number(
                              item.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/45">
                          {item.description ||
                            "Freshly prepared with care."}
                        </p>

                        <div className="mt-6 flex items-center justify-between">
                          {quantity > 0 ? (
                            <div className="flex items-center rounded-full border border-white/10">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDecrease(
                                    item
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center text-white/60 transition hover:text-white"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                −
                              </button>

                              <span className="w-8 text-center text-sm">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleIncrease(
                                    item
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center text-white/60 transition hover:text-white"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart(
                                  item
                                )
                              }
                              className="rounded-full border border-[#c9a45c]/40 px-5 py-2.5 text-sm text-[#c9a45c] transition hover:bg-[#c9a45c] hover:text-black"
                            >
                              Add to Order
                            </button>
                          )}

                          {quantity > 0 && (
                            <span className="text-xs text-white/35">
                              {quantity} added
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP CART */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                    Your Order
                  </p>

                  <h2 className="mt-2 text-2xl font-light">
                    Cart
                  </h2>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#c9a45c] px-3 text-sm text-black">
                  {itemCount}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="text-4xl text-white/20">
                    🛒
                  </div>

                  <p className="mt-5 text-sm text-white/40">
                    Your cart is empty.
                  </p>

                  <p className="mt-2 text-xs text-white/25">
                    Add something delicious.
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-[380px] space-y-5 overflow-y-auto py-6">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 border-b border-white/10 pb-5"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl text-white/20">
                              🍽️
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <h3 className="truncate text-sm">
                              {item.name}
                            </h3>

                            <span className="text-sm text-[#c9a45c]">
                              ₹
                              {(
                                item.price *
                                item.quantity
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex w-fit items-center rounded-full border border-white/10">
                            <button
                              type="button"
                              onClick={() => {
                                const updated =
                                  updateCartQuantity(
                                    item.id,
                                    item.quantity - 1
                                  );

                                setCartItems(
                                  updated
                                );
                              }}
                              className="flex h-7 w-7 items-center justify-center text-white/50 hover:text-white"
                            >
                              −
                            </button>

                            <span className="w-6 text-center text-xs">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const updated =
                                  updateCartQuantity(
                                    item.id,
                                    item.quantity + 1
                                  );

                                setCartItems(
                                  updated
                                );
                              }}
                              className="flex h-7 w-7 items-center justify-center text-white/50 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/45">
                        Subtotal
                      </span>

                      <span>
                        ₹
                        {subtotal.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-white/45">
                        Delivery
                      </span>

                      <span>
                        {deliveryFee === 0
                          ? "FREE"
                          : `₹${deliveryFee}`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-white/45">
                        Taxes
                      </span>

                      <span>
                        ₹
                        {taxes.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-between border-t border-white/10 pt-5 text-lg">
                      <span>Total</span>

                      <span className="text-[#c9a45c]">
                        ₹
                        {total.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/order/cart"
                    className="mt-7 block w-full rounded-full bg-[#c9a45c] py-4 text-center text-sm font-medium text-black transition hover:bg-[#d8b873]"
                  >
                    View Cart
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* MOBILE CART */}
      {itemCount > 0 && (
        <Link
          href="/order/cart"
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black shadow-2xl lg:hidden"
        >
          <span>View Cart</span>

          <span className="h-5 w-px bg-black/20" />

          <span>
            {itemCount}{" "}
            {itemCount === 1 ? "item" : "items"}
          </span>

          <span>
            ₹{total.toLocaleString("en-IN")}
          </span>
        </Link>
      )}
    </>
  );
}