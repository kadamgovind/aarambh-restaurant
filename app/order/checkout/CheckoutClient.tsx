"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";

import {
  clearCart,
  getCartItems,
  type CartItem,
} from "@/lib/cart";

import { supabase } from "@/lib/supabase";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  city: string;
  deliveryNote: string;
};

type VerifiedMenuItem = {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  item_type: "veg" | "non_veg";
  is_available: boolean;
};

const FREE_DELIVERY_THRESHOLD = 1000;
const DELIVERY_FEE = 49;
const TAX_RATE = 0.05;

export default function CheckoutClient() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    deliveryNote: "",
  });

  useEffect(() => {
    async function loadCheckout() {
      try {
        const cartItems = getCartItems();

        if (cartItems.length === 0) {
          router.replace("/order/cart");
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/customer/login?redirect=/order/checkout");
          return;
        }

        setItems(cartItems);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile loading error:", profileError);
        }

        if (profile) {
          setForm((current) => ({
            ...current,
            name: profile.full_name || "",
            phone: profile.phone || "",
          }));
        }
      } catch (error) {
        console.error("Checkout loading error:", error);
        setErrorMessage("Unable to load checkout.");
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, [router]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [items]);

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0;

    return subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE;
  }, [subtotal]);

  const taxes = useMemo(() => {
    return Math.round(subtotal * TAX_RATE);
  }, [subtotal]);

  const total = subtotal + deliveryFee + taxes;

  function updateField(
    field: keyof CheckoutForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function formatPrice(amount: number) {
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  async function handlePlaceOrder(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!form.phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!form.address.trim()) {
      setErrorMessage("Please enter your delivery address.");
      return;
    }

    if (!form.city.trim()) {
      setErrorMessage("Please enter your city.");
      return;
    }

    setPlacingOrder(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/customer/login?redirect=/order/checkout");
        return;
      }

      const restaurantIds = [
        ...new Set(items.map((item) => item.restaurantId)),
      ];

      if (restaurantIds.length !== 1) {
        throw new Error(
          "Your cart contains items from multiple restaurants."
        );
      }

      const restaurantId = restaurantIds[0];

      const menuItemIds = items.map((item) => item.id);

      const { data: menuItems, error: menuError } =
        await supabase
          .from("menu_items")
          .select(
            "id, restaurant_id, name, price, item_type, is_available"
          )
          .in("id", menuItemIds)
          .eq("restaurant_id", restaurantId);

      if (menuError) {
        throw new Error(
          `Unable to verify menu items: ${menuError.message}`
        );
      }

      const verifiedItems =
        (menuItems || []) as VerifiedMenuItem[];

      if (verifiedItems.length !== items.length) {
        throw new Error(
          "One or more items in your cart are no longer available."
        );
      }

      const verifiedMap = new Map(
        verifiedItems.map((item) => [item.id, item])
      );

      for (const cartItem of items) {
        const verifiedItem = verifiedMap.get(cartItem.id);

        if (!verifiedItem) {
          throw new Error(
            `${cartItem.name} is no longer available.`
          );
        }

        if (!verifiedItem.is_available) {
          throw new Error(
            `${verifiedItem.name} is currently unavailable.`
          );
        }
      }

      const verifiedSubtotal = items.reduce((sum, cartItem) => {
        const verifiedItem = verifiedMap.get(cartItem.id);

        if (!verifiedItem) {
          return sum;
        }

        return (
          sum +
          Number(verifiedItem.price) * cartItem.quantity
        );
      }, 0);

      const verifiedDeliveryFee =
        verifiedSubtotal >= FREE_DELIVERY_THRESHOLD
          ? 0
          : DELIVERY_FEE;

      const verifiedTaxes = Math.round(
        verifiedSubtotal * TAX_RATE
      );

      const verifiedTotal =
        verifiedSubtotal +
        verifiedDeliveryFee +
        verifiedTaxes;

      const orderNumber =
        Number(
          `${Date.now()}${Math.floor(Math.random() * 10)}`
        );

      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            restaurant_id: restaurantId,
            customer_id: user.id,
            order_number: orderNumber,
            status: "pending",
            order_type: "delivery",
            subtotal: verifiedSubtotal,
            delivery_fee: verifiedDeliveryFee,
            discount_amount: 0,
            total_amount: verifiedTotal,
            customer_name: form.name.trim(),
            customer_phone: form.phone.trim(),
            delivery_address: `${form.address.trim()}, ${form.city.trim()}`,
            special_instructions:
              form.deliveryNote.trim() || null,
          })
          .select("id, order_number")
          .single();

      if (orderError || !order) {
        throw new Error(
          orderError?.message ||
            "Unable to create your order."
        );
      }

      const orderItems = items.map((cartItem) => {
        const verifiedItem = verifiedMap.get(cartItem.id)!;
        const itemPrice = Number(verifiedItem.price);

        return {
          order_id: order.id,
          menu_item_id: verifiedItem.id,
          item_name: verifiedItem.name,
          item_price: itemPrice,
          quantity: cartItem.quantity,
          item_total: itemPrice * cartItem.quantity,
        };
      });

      const { error: orderItemsError } =
        await supabase
          .from("order_items")
          .insert(orderItems);

      if (orderItemsError) {
        await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);

        throw new Error(
          `Unable to save order items: ${orderItemsError.message}`
        );
      }

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          amount: verifiedTotal,
          payment_method: "cod",
          payment_status: "pending",
        });

      if (paymentError) {
        console.error(
          "Payment record creation failed:",
          paymentError
        );
      }

      clearCart();

      router.push(
        `/order/success?order=${order.order_number}`
      );
    } catch (error) {
      console.error("Place order error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order."
      );

      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 pt-24">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="mt-5 text-sm text-white/40">
              Preparing secure checkout...
            </p>
          </div>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 pt-24">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Checkout
            </p>

            <h1 className="mt-4 text-4xl font-light md:text-6xl">
              Your cart is empty.
            </h1>

            <Link
              href="/order"
              className="mt-8 inline-flex rounded-full bg-[#c9a45c] px-8 py-4 text-sm font-medium text-black transition hover:bg-[#d8b873]"
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

      <section className="border-b border-white/10 px-6 pb-12 pt-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            Aarambh Restaurant
          </p>

          <h1 className="mt-5 text-5xl font-light tracking-tight md:text-7xl">
            Checkout.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
            Enter your delivery details and place your
            order securely.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handlePlaceOrder}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Delivery Details
              </p>

              <h2 className="mt-3 text-2xl font-light">
                Where should we deliver?
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm text-white/55">
                    Full Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/55">
                    Mobile Number
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    inputMode="numeric"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-white/55">
                    Delivery Address
                  </label>

                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value
                      )
                    }
                    rows={4}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50"
                    placeholder="House / Flat, Street, Area"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/55">
                    City
                  </label>

                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/55">
                    Payment
                  </label>

                  <div className="mt-2 flex min-h-[52px] items-center rounded-2xl border border-[#c9a45c]/30 bg-[#c9a45c]/5 px-4">
                    <span className="text-sm">
                      Cash on Delivery
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-white/55">
                    Delivery Instructions{" "}
                    <span className="text-white/25">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    value={form.deliveryNote}
                    onChange={(event) =>
                      updateField(
                        "deliveryNote",
                        event.target.value
                      )
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50"
                    placeholder="Any special delivery instructions?"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full rounded-full bg-[#c9a45c] py-4 text-sm font-medium text-black transition hover:bg-[#d8b873] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>

            <p className="text-center text-xs leading-5 text-white/25">
              By placing this order, you confirm that
              your delivery details are correct.
            </p>
          </form>

          <aside>
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Order Summary
              </p>

              <h2 className="mt-3 text-2xl font-light">
                Your order.
              </h2>

              <div className="mt-7 space-y-4 border-b border-white/10 pb-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="text-white/75">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {formatPrice(item.price)} ×{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <span className="shrink-0 text-white/70">
                      {formatPrice(
                        item.price * item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/45">
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Delivery
                  </span>

                  <span>
                    {deliveryFee === 0
                      ? "FREE"
                      : formatPrice(deliveryFee)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Taxes
                  </span>

                  <span>{formatPrice(taxes)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
                <span className="text-white/50">
                  Total
                </span>

                <span className="text-2xl text-[#c9a45c]">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/order/cart"
                className="mt-6 block text-center text-sm text-white/35 transition hover:text-[#c9a45c]"
              >
                ← Back to Cart
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}