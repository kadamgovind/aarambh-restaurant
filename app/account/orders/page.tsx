"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Clock3,
  Loader2,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  menu_item?: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
};

type Order = {
  id: string;
  order_number: number | string | null;
  status: string;
  subtotal: number | string;
  delivery_fee: number | string;
  tax_amount: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  created_at: string;
  order_items?: OrderItem[] | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";

    case "confirmed":
      return "Confirmed";

    case "preparing":
      return "Preparing";

    case "ready":
      return "Ready";

    case "out_for_delivery":
      return "Out for Delivery";

    case "delivered":
      return "Delivered";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "confirmed":
    case "ready":
    case "delivered":
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    case "preparing":
    case "out_for_delivery":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";

    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

function isPastOrder(order: Order) {
  return (
    order.status === "completed" ||
    order.status === "delivered" ||
    order.status === "cancelled"
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setError("Please sign in to view your orders.");
          }

          return;
        }

        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            status,
            subtotal,
            delivery_fee,
            tax_amount,
            discount_amount,
            total_amount,
            created_at,
            order_items (
              id,
              quantity,
              unit_price,
              total_price,
              menu_item:menu_items (
                id,
                name,
                image_url
              )
            )
          `)
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        if (mounted) {
          setOrders((data ?? []) as unknown as Order[]);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);

        if (mounted) {
          setOrders([]);
          setError(
            "We couldn't load your orders right now. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((order) => !isPastOrder(order)),
    [orders]
  );

  const orderHistory = useMemo(
    () => orders.filter((order) => isPastOrder(order)),
    [orders]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2
              className="h-8 w-8 animate-spin text-[#c9a45c]"
              aria-hidden="true"
            />

            <p className="text-sm text-white/60">
              Loading your orders...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/account"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ChevronLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to Account
          </Link>

          <div
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
            role="alert"
          >
            <AlertCircle
              className="mx-auto mb-4 h-10 w-10 text-red-400"
              aria-hidden="true"
            />

            <h1 className="text-xl font-semibold">
              Unable to load orders
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
              {error}
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-medium text-black transition hover:bg-[#d8b56d]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#15130f] to-[#0a0a0a]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/account"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ChevronLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to Account
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/10">
                  <ShoppingBag
                    className="h-5 w-5 text-[#c9a45c]"
                    aria-hidden="true"
                  />
                </div>

                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
                  Orders
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                My Orders
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                View your recent orders and order history.
              </p>
            </div>

            <Link
              href="/order"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b56d]"
            >
              <UtensilsCrossed
                className="h-4 w-4"
                aria-hidden="true"
              />
              Order Food
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a45c]/20 bg-[#c9a45c]/10">
              <UtensilsCrossed
                className="h-7 w-7 text-[#c9a45c]"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
              You haven&apos;t placed any food orders yet.
              Your orders will appear here after checkout.
            </p>

            <Link
              href="/order"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b56d]"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {activeOrders.length > 0 && (
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">
                    Active Orders
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    Orders that are currently being processed.
                  </p>
                </div>

                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {orderHistory.length > 0 && (
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">
                    Order History
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    Your completed and previous orders.
                  </p>
                </div>

                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      muted
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function OrderCard({
  order,
  muted = false,
}: {
  order: Order;
  muted?: boolean;
}) {
  const items = order.order_items ?? [];

  const itemCount = items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const orderLabel = order.order_number
    ? `#${order.order_number}`
    : `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition ${
        muted ? "opacity-80" : "hover:border-white/20"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold">
                Order {orderLabel}
              </h3>

              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/45">
              <span>
                {formatDate(order.created_at)}
              </span>

              <span aria-hidden="true">•</span>

              <span className="inline-flex items-center gap-1.5">
                <Clock3
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                {formatTime(order.created_at)}
              </span>

              <span aria-hidden="true">•</span>

              <span>
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-white/40">
              Total
            </p>

            <p className="mt-1 text-lg font-semibold text-[#c9a45c]">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.menu_item?.name || "Menu Item"}
                  </p>

                  <p className="mt-0.5 text-xs text-white/40">
                    Qty: {item.quantity} ×{" "}
                    {formatCurrency(item.unit_price)}
                  </p>
                </div>

                <p className="shrink-0 text-sm text-white/70">
                  {formatCurrency(item.total_price)}
                </p>
              </div>
            ))}

            {items.length > 4 && (
              <p className="pt-1 text-xs text-white/40">
                + {items.length - 4} more{" "}
                {items.length - 4 === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
            <div>
              <p className="text-white/40">
                Subtotal
              </p>

              <p className="mt-0.5 text-white/70">
                {formatCurrency(order.subtotal)}
              </p>
            </div>

            <div>
              <p className="text-white/40">
                Delivery
              </p>

              <p className="mt-0.5 text-white/70">
                {formatCurrency(order.delivery_fee)}
              </p>
            </div>
          </div>

          {order.order_number ? (
            <Link
              href={`/order/success?order=${encodeURIComponent(
                String(order.order_number)
              )}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-medium text-white/70 transition hover:border-[#c9a45c]/40 hover:text-[#c9a45c]"
            >
              View Order
              <ArrowRight
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span className="text-xs text-white/35">
              Order ID: {order.id.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}