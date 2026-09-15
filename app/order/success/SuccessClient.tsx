"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  item_total: number;
};

type OrderData = {
  id: string;
  order_number: number;
  status: string;
  order_type: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
  order_items: OrderItem[];
  payment: {
    payment_method: string;
    payment_status: string;
  } | null;
};

type RawPayment = {
  payment_method: string;
  payment_status: string;
};

type RawOrderItem = {
  id: string;
  item_name: string;
  item_price: number | string;
  quantity: number | string;
  item_total: number | string;
};

type RawOrder = {
  id: string;
  order_number: number | string;
  status: string;
  order_type: string;
  subtotal: number | string;
  delivery_fee: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
  order_items: RawOrderItem[] | null;
  payments: RawPayment[] | RawPayment | null;
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `₹${safeAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getPaymentName(method: string) {
  switch (method) {
    case "cod":
      return "Cash on Delivery";

    case "upi":
      return "UPI";

    case "card":
      return "Card";

    default:
      return method;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Order Received";

    case "confirmed":
      return "Confirmed";

    case "preparing":
      return "Preparing";

    case "out_for_delivery":
      return "Out for Delivery";

    case "delivered":
      return "Delivered";

    case "cancelled":
      return "Cancelled";

    default:
      return "Order Received";
  }
}

function getStatusWidth(status: string) {
  switch (status) {
    case "pending":
      return "w-1/4";

    case "confirmed":
      return "w-2/4";

    case "preparing":
      return "w-3/4";

    case "out_for_delivery":
      return "w-[90%]";

    case "delivered":
      return "w-full";

    case "cancelled":
      return "w-1/4";

    default:
      return "w-1/4";
  }
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      if (!orderNumber) {
        if (isMounted) {
          setErrorMessage("Order number is missing.");
          setLoading(false);
        }

        return;
      }

      const parsedOrderNumber = Number(orderNumber);

      if (
        !Number.isFinite(parsedOrderNumber) ||
        parsedOrderNumber <= 0
      ) {
        if (isMounted) {
          setErrorMessage("Invalid order number.");
          setLoading(false);
        }

        return;
      }

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          if (isMounted) {
            setErrorMessage(
              "Please sign in to view your order."
            );
            setLoading(false);
          }

          return;
        }

        const { data: orderData, error: orderError } =
          await supabase
            .from("orders")
            .select(
              `
                id,
                order_number,
                status,
                order_type,
                subtotal,
                delivery_fee,
                discount_amount,
                total_amount,
                customer_name,
                customer_phone,
                delivery_address,
                special_instructions,
                created_at,
                order_items (
                  id,
                  item_name,
                  item_price,
                  quantity,
                  item_total
                ),
                payments (
                  payment_method,
                  payment_status
                )
              `
            )
            .eq("order_number", parsedOrderNumber)
            .eq("customer_id", user.id)
            .maybeSingle();

        if (orderError) {
          console.error("Order loading error:", orderError);
          throw new Error("Unable to load your order.");
        }

        if (!orderData) {
          if (isMounted) {
            setErrorMessage("We couldn't find this order.");
            setLoading(false);
          }

          return;
        }

        const rawOrder = orderData as unknown as RawOrder;

        const paymentData = Array.isArray(rawOrder.payments)
          ? rawOrder.payments[0] ?? null
          : rawOrder.payments ?? null;

        const normalizedOrder: OrderData = {
          id: rawOrder.id,
          order_number: toNumber(rawOrder.order_number),
          status: rawOrder.status,
          order_type: rawOrder.order_type,
          subtotal: toNumber(rawOrder.subtotal),
          delivery_fee: toNumber(rawOrder.delivery_fee),
          discount_amount: toNumber(rawOrder.discount_amount),
          total_amount: toNumber(rawOrder.total_amount),
          customer_name: rawOrder.customer_name,
          customer_phone: rawOrder.customer_phone,
          delivery_address: rawOrder.delivery_address,
          special_instructions: rawOrder.special_instructions,
          created_at: rawOrder.created_at,

          order_items: (rawOrder.order_items ?? []).map(
            (item) => ({
              id: item.id,
              item_name: item.item_name,
              item_price: toNumber(item.item_price),
              quantity: toNumber(item.quantity),
              item_total: toNumber(item.item_total),
            })
          ),

          payment: paymentData
            ? {
                payment_method: paymentData.payment_method,
                payment_status: paymentData.payment_status,
              }
            : null,
        };

        if (isMounted) {
          setOrder(normalizedOrder);
          setLoading(false);
        }
      } catch (error) {
        console.error("Success page error:", error);

        if (isMounted) {
          setErrorMessage(
            error instanceof Error &&
              error.message === "Unable to load your order."
              ? error.message
              : "Something went wrong while loading your order."
          );

          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-20">
          <div
            className="text-center"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="mt-5 text-sm text-white/40">
              Loading your order...
            </p>
          </div>
        </section>
      </>
    );
  }

  if (!order || errorMessage) {
    return (
      <>
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-20">
          <div className="max-w-md text-center">
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-3xl"
              aria-hidden="true"
            >
              !
            </div>

            <h1 className="text-3xl font-semibold">
              Order Not Found
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/50">
              {errorMessage ||
                "We couldn't find your recent order."}
            </p>

            <Link
              href="/order"
              className="mt-8 inline-flex rounded-full bg-[#c9a45c] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b873]"
            >
              Browse Menu
            </Link>
          </div>
        </section>
      </>
    );
  }

  const status = getStatusLabel(order.status);
  const statusWidth = getStatusWidth(order.status);

  const statusDescription =
    order.status === "pending"
      ? "The restaurant will start preparing your order shortly."
      : order.status === "cancelled"
      ? "This order has been cancelled."
      : "Your order status will update as the restaurant processes it.";

  return (
    <>
      <Navbar />

      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/5"
              aria-hidden="true"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c9a45c] text-3xl font-semibold text-black">
                ✓
              </div>
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Aarambh Restaurant
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
              Order Confirmed
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/50 md:text-base">
              Thank you, {order.customer_name}. Your order has
              been received successfully.
            </p>

            <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-5 py-2">
              <span className="text-xs text-white/50">
                Order
              </span>

              <span className="ml-2 text-xs font-medium text-[#c9a45c]">
                #{order.order_number}
              </span>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  Order Status
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {status}
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  {statusDescription}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    order.status === "cancelled"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-[#c9a45c] text-black"
                  }`}
                  aria-hidden="true"
                >
                  {order.status === "cancelled" ? "×" : "✓"}
                </div>

                <div>
                  <p className="text-sm font-medium">
                    {status}
                  </p>

                  <p className="text-xs text-white/40">
                    Order #{order.order_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${
                    order.status === "cancelled"
                      ? "bg-red-400"
                      : "bg-[#c9a45c]"
                  } ${statusWidth}`}
                />
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-white/30">
                <span>Received</span>
                <span>Confirmed</span>
                <span>Preparing</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
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
                {order.order_items.length > 0 ? (
                  order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {item.item_name}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {item.quantity} ×{" "}
                          {formatPrice(item.item_price)}
                        </p>
                      </div>

                      <p className="text-sm font-medium">
                        {formatPrice(item.item_total)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/40">
                    No order items were found.
                  </p>
                )}
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">
                    Subtotal
                  </span>

                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">
                    Delivery
                  </span>

                  <span>
                    {order.delivery_fee === 0
                      ? "FREE"
                      : formatPrice(order.delivery_fee)}
                  </span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/40">
                      Discount
                    </span>

                    <span className="text-green-400">
                      -{formatPrice(order.discount_amount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="flex items-end justify-between">
                <span className="text-sm text-white/40">
                  Total
                </span>

                <span className="text-2xl font-semibold text-[#c9a45c]">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
            </section>

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
                    {order.customer_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/30">
                    Phone
                  </p>

                  <p className="mt-1 text-sm">
                    {order.customer_phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/30">
                    Address
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/80">
                    {order.delivery_address ||
                      "Delivery address not provided."}
                  </p>
                </div>

                {order.special_instructions && (
                  <div>
                    <p className="text-xs text-white/30">
                      Delivery Note
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {order.special_instructions}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-white/30">
                    Payment
                  </p>

                  <p className="mt-1 text-sm">
                    {order.payment
                      ? getPaymentName(
                          order.payment.payment_method
                        )
                      : "Payment information unavailable"}
                  </p>

                  {order.payment && (
                    <p className="mt-1 text-xs text-white/30">
                      Status: {order.payment.payment_status}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/order"
              className="rounded-full bg-[#c9a45c] px-7 py-3.5 text-center text-sm font-semibold text-black transition hover:bg-[#d8b873]"
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

          <div className="mt-10 text-center">
            <p className="text-xs leading-5 text-white/30">
              Keep your order number{" "}
              <span className="text-white/50">
                #{order.order_number}
              </span>{" "}
              for future reference.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}