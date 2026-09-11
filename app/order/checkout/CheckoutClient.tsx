"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { getCartItems, clearCart, type CartItem } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

const FREE_DELIVERY_THRESHOLD = 1000;
const DELIVERY_FEE = 49;
const TAX_RATE = 0.05;

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
  item_type: string | null;
  is_available: boolean;
};

export default function CheckoutClient() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    deliveryNote: "",
  });

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cart]);

  const deliveryFee =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  const taxes = subtotal * TAX_RATE;

  const total = subtotal + deliveryFee + taxes;

  useEffect(() => {
    let active = true;

    async function loadCheckout() {
      try {
        setLoading(true);
        setError("");

        const savedCart = getCartItems();

        if (!savedCart || savedCart.length === 0) {
          router.replace("/order");
          return;
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          router.replace(
            `/login?redirect=${encodeURIComponent("/order/checkout")}`
          );
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile loading error:", profileError);
        }

        if (!active) return;

        setCart(savedCart);

        setForm((current) => ({
          ...current,
          name: current.name || profile?.full_name || "",
          phone: current.phone || profile?.phone || "",
        }));
      } catch (err) {
        console.error("Checkout loading error:", err);

        if (active) {
          setError("Unable to load checkout. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCheckout();

    return () => {
      active = false;
    };
  }, [router]);

  function updateForm(
    field: keyof CheckoutForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePlaceOrder() {
    if (placingOrder) return;

    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!form.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    try {
      setPlacingOrder(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent("/order/checkout")}`
        );
        return;
      }

      /*
       * ---------------------------------------------------------
       * 1. Verify all cart items belong to the same restaurant
       * ---------------------------------------------------------
       */

      const menuItemIds = Array.from(
        new Set(cart.map((item) => item.id))
      );

      if (menuItemIds.length === 0) {
        throw new Error("Your cart is empty.");
      }

      const { data: menuItems, error: menuError } = await supabase
        .from("menu_items")
        .select(
          "id, restaurant_id, name, price, item_type, is_available"
        )
        .in("id", menuItemIds);

      if (menuError) {
        throw menuError;
      }

      if (!menuItems || menuItems.length !== menuItemIds.length) {
        throw new Error(
          "Some items in your cart are no longer available."
        );
      }

      const verifiedItems =
        menuItems as VerifiedMenuItem[];

      const restaurantIds = Array.from(
        new Set(
          verifiedItems.map(
            (item) => item.restaurant_id
          )
        )
      );

      if (restaurantIds.length !== 1) {
        throw new Error(
          "Items from different restaurants cannot be ordered together."
        );
      }

      const restaurantId = restaurantIds[0];

      /*
       * ---------------------------------------------------------
       * 2. Verify availability
       * ---------------------------------------------------------
       */

      const unavailableItem = verifiedItems.find(
        (item) => !item.is_available
      );

      if (unavailableItem) {
        throw new Error(
          `${unavailableItem.name} is currently unavailable.`
        );
      }

      /*
       * ---------------------------------------------------------
       * 3. Calculate prices using database values
       * ---------------------------------------------------------
       */

      const verifiedSubtotal = cart.reduce(
        (sum, cartItem) => {
          const menuItem = verifiedItems.find(
            (item) => item.id === cartItem.id
          );

          if (!menuItem) {
            return sum;
          }

          return (
            sum +
            Number(menuItem.price) *
              Number(cartItem.quantity)
          );
        },
        0
      );

      const verifiedDeliveryFee =
        verifiedSubtotal >= FREE_DELIVERY_THRESHOLD
          ? 0
          : DELIVERY_FEE;

      const verifiedTaxes =
        verifiedSubtotal * TAX_RATE;

      const verifiedTotal =
        verifiedSubtotal +
        verifiedDeliveryFee +
        verifiedTaxes;

      /*
       * ---------------------------------------------------------
       * 4. Create order
       *
       * IMPORTANT:
       * order_number is NOT inserted manually.
       *
       * Database schema:
       * order_number bigint GENERATED ALWAYS AS IDENTITY
       *
       * Supabase/PostgreSQL will generate it automatically.
       * ---------------------------------------------------------
       */

      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            restaurant_id: restaurantId,
            customer_id: user.id,
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

      if (orderError) {
  console.error("ORDER INSERT FAILED");
  console.error("message:", orderError.message);
  console.error("details:", orderError.details);
  console.error("hint:", orderError.hint);
  console.error("code:", orderError.code);
  console.error("full error:", JSON.stringify(orderError, null, 2));

  throw new Error(
    orderError.message ||
      orderError.details ||
      "Unable to create order."
  );
}



      if (!order) {
        throw new Error(
          "Order was not created successfully."
        );
      }

      /*
       * ---------------------------------------------------------
       * 5. Create order items
       * ---------------------------------------------------------
       */

      const orderItems = cart.map((cartItem) => {
        const menuItem = verifiedItems.find(
          (item) => item.id === cartItem.id
        );

        if (!menuItem) {
          throw new Error(
            `Menu item ${cartItem.id} was not found.`
          );
        }

        const quantity = Number(cartItem.quantity);
        const itemPrice = Number(menuItem.price);
        const itemTotal = itemPrice * quantity;

        return {
          order_id: order.id,
          menu_item_id: menuItem.id,
          item_name: menuItem.name,
          item_price: itemPrice,
          quantity,
          item_total: itemTotal,
        };
      });

      const { error: orderItemsError } =
        await supabase
          .from("order_items")
          .insert(orderItems);

      if (orderItemsError) {
        console.error(
          "Order items creation error:",
          orderItemsError
        );

        /*
         * The order itself already exists.
         * We stop here rather than pretending the order
         * was completed successfully.
         */
        throw orderItemsError;
      }

      /*
       * ---------------------------------------------------------
       * 6. Create payment record
       * ---------------------------------------------------------
       *
       * Current checkout uses Cash on Delivery.
       * Payment is initially pending.
       * ---------------------------------------------------------
       */

      const { error: paymentError } =
        await supabase
          .from("payments")
          .insert({
            order_id: order.id,
            amount: verifiedTotal,
            payment_method: "cod",
            payment_status: "pending",
          });

      /*
       * Payment record failure should not hide the successful
       * order if the restaurant can still process the order.
       */
      if (paymentError) {
        console.error(
          "Payment record creation error:",
          paymentError
        );
      }

      /*
       * ---------------------------------------------------------
       * 7. Clear cart
       * ---------------------------------------------------------
       */

      clearCart();

      /*
       * ---------------------------------------------------------
       * 8. Redirect to success page
       *
       * order.order_number is the automatically generated
       * identity value returned by PostgreSQL.
       * ---------------------------------------------------------
       */

      router.push(
        `/order/success?order=${encodeURIComponent(
          String(order.order_number)
        )}`
      );
    } catch (err) {
      console.error(
        "Place order error:",
        err
      );

      if (err instanceof Error) {
        setError(
          err.message ||
            "Unable to place your order. Please try again."
        );
      } else {
        setError(
          "Unable to place your order. Please try again."
        );
      }
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#c9a45c]" />

            <p className="text-sm text-white/60">
              Loading checkout...
            </p>
          </div>
        </main>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h1 className="text-2xl font-semibold">
              Your cart is empty
            </h1>

            <p className="mt-3 text-sm text-white/60">
              Add some delicious items before
              checking out.
            </p>

            <Link
              href="/order"
              className="mt-6 inline-flex rounded-xl bg-[#c9a45c] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Browse Menu
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-4 pb-20 pt-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
              AURA
            </p>

            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Checkout
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Complete your details to place your order.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Checkout Form */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="text-xl font-semibold">
                Delivery Details
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a45c]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      updateForm(
                        "phone",
                        e.target.value
                      )
                    }
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a45c]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Delivery Address
                  </label>

                  <textarea
                    id="address"
                    value={form.address}
                    onChange={(e) =>
                      updateForm(
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="House/flat number, street, area"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a45c]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm text-white/70"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      updateForm(
                        "city",
                        e.target.value
                      )
                    }
                    placeholder="Enter your city"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a45c]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliveryNote"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Delivery Note{" "}
                    <span className="text-white/30">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="deliveryNote"
                    value={form.deliveryNote}
                    onChange={(e) =>
                      updateForm(
                        "deliveryNote",
                        e.target.value
                      )
                    }
                    placeholder="Any special instructions?"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a45c]"
                  />
                </div>
              </div>
            </section>

            {/* Order Summary */}
            <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="text-xl font-semibold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        {item.quantity} × ₹
                        {Number(item.price).toFixed(
                          2
                        )}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm">
                      ₹
                      {(
                        Number(item.price) *
                        Number(item.quantity)
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/50">
                    Delivery
                  </span>

                  <span>
                    {deliveryFee === 0
                      ? "FREE"
                      : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/50">
                    Tax
                  </span>

                  <span>
                    ₹{taxes.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">
                  Total
                </span>

                <span className="text-xl font-semibold text-[#c9a45c]">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Payment Method
                </p>

                <p className="mt-2 text-sm font-medium">
                  Cash on Delivery
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Pay when your order is delivered.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="mt-6 w-full rounded-xl bg-[#c9a45c] px-5 py-3.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {placingOrder
                  ? "Placing Order..."
                  : "Place Order"}
              </button>

              <Link
                href="/order/cart"
                className="mt-3 block text-center text-sm text-white/50 transition hover:text-white"
              >
                ← Back to Cart
              </Link>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}