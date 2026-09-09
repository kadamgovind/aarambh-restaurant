"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type CheckoutItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type CheckoutData = {
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    deliveryNote: string;
  };
  paymentMethod: string;
  items: CheckoutItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
};

export default function SuccessPage() {
  const [order, setOrder] = useState<CheckoutData | null>(null);

  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const savedCheckout = localStorage.getItem("aura_checkout");

    if (savedCheckout) {
      try {
        const parsed = JSON.parse(savedCheckout) as CheckoutData;

        setOrder(parsed);

        const generatedOrderNumber =
          "AURA-" +
          Math.floor(100000 + Math.random() * 900000);

        setOrderNumber(generatedOrderNumber);

        /*
          Checkout data ko success page ke liye rakha gaya hai.

          Actual Supabase order ID connect hone ke baad
          yahan real database order number show hoga.
        */
      } catch (error) {
        console.error(
          "Success page loading error:",
          error
        );
      }
    }
  }, []);

  function formatPrice(amount: number) {
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  function getPaymentName(method: string) {
    if (method === "cod") return "Cash on Delivery";
    if (method === "upi") return "UPI";
    if (method === "card") return "Card";

    return method;
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-20">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-3xl">
              ✓
            </div>

            <h1 className="text-3xl font-semibold">
              Order information unavailable
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/50">
              We couldn't find the recent checkout information.
              You can continue browsing our menu.
            </p>

            <Link
              href="/order"
              className="mt-8 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Browse Menu
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          {/* SUCCESS HEADER */}
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/[0.05]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl font-semibold text-black">
                ✓
              </div>
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/40">
              AURA Restaurant
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
              Order Confirmed
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/50 md:text-base">
              Thank you, {order.customer.name}. Your order has
              been received successfully.
            </p>

            <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-5 py-2">
              <span className="text-xs text-white/50">
                Order
              </span>

              <span className="ml-2 text-xs font-medium">
                {orderNumber}
              </span>
            </div>
          </div>

          {/* DELIVERY STATUS */}
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  Order Status
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Order Received
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  The restaurant will start preparing your
                  order shortly.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Confirmed
                  </p>

                  <p className="text-xs text-white/40">
                    Just now
                  </p>
                </div>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="mt-8">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/4 rounded-full bg-white" />
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-white/30">
                <span>Confirmed</span>
                <span>Preparing</span>
                <span>Out for Delivery</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* ORDER ITEMS */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  Your Order
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Order Items
                </h2>
              </div>

              <div className="space-y-5">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        {item.quantity} ×{" "}
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="text-sm font-medium">
                      {formatPrice(
                        item.price * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">
                    Delivery
                  </span>

                  <span>
                    {order.deliveryFee === 0
                      ? "FREE"
                      : formatPrice(order.deliveryFee)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">
                    Taxes
                  </span>

                  <span>
                    {formatPrice(order.taxes)}
                  </span>
                </div>
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="flex items-end justify-between">
                <span className="text-sm text-white/40">
                  Total
                </span>

                <span className="text-2xl font-semibold">
                  {formatPrice(order.total)}
                </span>
              </div>
            </section>

            {/* DELIVERY INFO */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  Delivery
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Delivery Details
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs text-white/30">
                    Customer
                  </p>

                  <p className="mt-1 text-sm">
                    {order.customer.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/30">
                    Phone
                  </p>

                  <p className="mt-1 text-sm">
                    {order.customer.phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/30">
                    Address
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/80">
                    {order.customer.address}
                    <br />
                    {order.customer.city}
                  </p>
                </div>

                {order.customer.deliveryNote && (
                  <div>
                    <p className="text-xs text-white/30">
                      Delivery Note
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {order.customer.deliveryNote}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-white/30">
                    Payment
                  </p>

                  <p className="mt-1 text-sm">
                    {getPaymentName(
                      order.paymentMethod
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/order"
              className="rounded-full bg-white px-7 py-3.5 text-center text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Order More
            </Link>

            <Link
              href="/account"
              className="rounded-full border border-white/10 bg-white/[0.03] px-7 py-3.5 text-center text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              Go to My Account
            </Link>
          </div>

          {/* NOTE */}
          <div className="mt-10 text-center">
            <p className="text-xs leading-5 text-white/30">
              Keep your order number{" "}
              <span className="text-white/50">
                {orderNumber}
              </span>{" "}
              for future reference.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}