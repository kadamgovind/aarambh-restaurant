"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";

import {
  clearCart,
  getCartItemCount,
  getCartItems,
  getCartSubtotal,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function loadCart() {
      setItems(getCartItems());
      setLoaded(true);
    }

    loadCart();

    function handleCartUpdate() {
      setItems(getCartItems());
    }

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  const itemCount = useMemo(
    () => getCartItemCount(items),
    [items]
  );

  const subtotal = useMemo(
    () => getCartSubtotal(items),
    [items]
  );

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0;

    return subtotal >= 1000 ? 0 : 49;
  }, [subtotal]);

  const taxes = useMemo(() => {
    return Math.round(subtotal * 0.05);
  }, [subtotal]);

  const total = subtotal + deliveryFee + taxes;

  function handleIncrease(item: CartItem) {
    const updatedItems = updateCartQuantity(
      item.id,
      item.quantity + 1
    );

    setItems(updatedItems);
  }

  function handleDecrease(item: CartItem) {
    const updatedItems = updateCartQuantity(
      item.id,
      item.quantity - 1
    );

    setItems(updatedItems);
  }

  function handleRemove(itemId: string) {
    const updatedItems = removeFromCart(itemId);

    setItems(updatedItems);
  }

  function handleClearCart() {
    clearCart();
    setItems([]);
  }

  if (!loaded) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
          <p className="text-sm text-white/40">
            Loading your cart...
          </p>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 pt-24">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-4xl">
              🛒
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Your Cart
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
              Your cart is empty.
            </h1>

            <p className="mx-auto mt-6 max-w-lg leading-7 text-white/45">
              Discover our menu and add something delicious
              to your order.
            </p>

            <Link
              href="/order"
              className="mt-10 inline-flex rounded-full bg-[#c9a45c] px-8 py-4 text-sm font-medium text-black transition hover:bg-[#d8b873]"
            >
              Explore Menu
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="border-b border-white/10 px-6 pb-16 pt-36 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            Your Selection
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-5xl font-light tracking-tight md:text-7xl">
                Your cart.
              </h1>

              <p className="mt-5 text-base text-white/45">
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"} selected
                for your order.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearCart}
              className="w-fit text-sm text-white/35 underline-offset-4 transition hover:text-red-400 hover:underline"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="space-y-5">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
                >
                  <div className="flex gap-5">
                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] sm:h-36 sm:w-36">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-white/20">
                          🍽️
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.itemType === "veg"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />

                            <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                              {item.itemType === "veg"
                                ? "Veg"
                                : "Non-Veg"}
                            </p>
                          </div>

                          <h2 className="mt-2 text-lg font-medium sm:text-xl">
                            {item.name}
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(item.id)
                          }
                          className="text-xl text-white/25 transition hover:text-red-400"
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div className="flex items-center rounded-full border border-white/10">
                          <button
                            type="button"
                            onClick={() =>
                              handleDecrease(item)
                            }
                            className="flex h-9 w-9 items-center justify-center text-white/50 transition hover:text-white"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleIncrease(item)
                            }
                            className="flex h-9 w-9 items-center justify-center text-white/50 transition hover:text-white"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-white/30">
                            ₹
                            {item.price.toLocaleString(
                              "en-IN"
                            )}{" "}
                            × {item.quantity}
                          </p>

                          <p className="mt-1 text-lg text-[#c9a45c]">
                            ₹
                            {(
                              item.price * item.quantity
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Link
              href="/order"
              className="mt-8 inline-flex items-center gap-3 text-sm text-white/45 transition hover:text-[#c9a45c]"
            >
              <span>←</span>
              Continue Shopping
            </Link>
          </div>

          <aside>
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Order Summary
              </p>

              <h2 className="mt-3 text-2xl font-light">
                Almost there.
              </h2>

              <div className="mt-8 space-y-4 border-b border-white/10 pb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/45">
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
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
                    ₹{taxes.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {subtotal > 0 && subtotal < 1000 && (
                <p className="mt-5 rounded-2xl border border-[#c9a45c]/10 bg-[#c9a45c]/5 p-4 text-xs leading-5 text-[#c9a45c]/70">
                  Add ₹
                  {(1000 - subtotal).toLocaleString(
                    "en-IN"
                  )}{" "}
                  more to unlock free delivery.
                </p>
              )}

              <div className="mt-6 flex items-end justify-between">
                <span className="text-white/50">
                  Total
                </span>

                <span className="text-2xl text-[#c9a45c]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <Link
                href="/order/checkout"
                className="mt-7 block w-full rounded-full bg-[#c9a45c] py-4 text-center text-sm font-medium text-black transition hover:bg-[#d8b873]"
              >
                Proceed to Checkout
              </Link>

              <p className="mt-5 text-center text-xs leading-5 text-white/25">
                Secure checkout · Multiple payment options
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}