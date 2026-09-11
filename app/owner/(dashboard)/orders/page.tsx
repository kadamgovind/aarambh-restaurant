"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus =
  | "New"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "Delivered"
  | "Rejected";

type DbOrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

type PaymentMethod =
  | "UPI"
  | "Card"
  | "Cash"
  | "Not Available";

type PaymentStatus = "PAID" | "PENDING";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  dbId: string;
  orderNumber: string;
  customer: string;
  phone: string;
  type: "Delivery" | "Pickup";
  items: OrderItem[];
  total: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  time: string;
  date: string;
  address?: string;
  specialInstructions?: string;
};

type DbOrder = {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  order_number: number;
  status: string;
  order_type: string | null;
  subtotal: number | string | null;
  delivery_fee: number | string | null;
  discount_amount: number | string | null;
  total_amount: number | string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
};

type DbOrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  item_price: number | string;
  quantity: number;
  item_total: number | string;
  created_at?: string;
};

type DbPayment = {
  id: string;
  order_id: string;
  amount: number | string;
  payment_method: string | null;
  payment_status: string | null;
  transaction_id?: string | null;
  provider?: string | null;
  provider_payment_id?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const filters = [
  "All",
  "New",
  "Accepted",
  "Preparing",
  "Ready",
  "Delivered",
  "Rejected",
] as const;

type Filter = (typeof filters)[number];

const dbStatusToUi = (status: string): OrderStatus => {
  switch (status.toLowerCase()) {
    case "pending":
      return "New";

    case "accepted":
      return "Accepted";

    case "preparing":
      return "Preparing";

    case "ready":
      return "Ready";

    case "delivered":
      return "Delivered";

    case "cancelled":
    case "rejected":
      return "Rejected";

    default:
      return "New";
  }
};

const uiStatusToDb = (status: OrderStatus): DbOrderStatus => {
  switch (status) {
    case "New":
      return "pending";

    case "Accepted":
      return "accepted";

    case "Preparing":
      return "preparing";

    case "Ready":
      return "ready";

    case "Delivered":
      return "delivered";

    case "Rejected":
      return "cancelled";

    default:
      return "pending";
  }
};

const paymentMethodToUi = (method: string | null | undefined): PaymentMethod => {
  switch ((method || "").toLowerCase()) {
    case "upi":
      return "UPI";

    case "card":
      return "Card";

    case "cash":
      return "Cash";

    default:
      return "Not Available";
  }
};

const paymentStatusToUi = (
  status: string | null | undefined
): PaymentStatus => {
  return (status || "").toLowerCase() === "paid" ? "PAID" : "PENDING";
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const statusClass = (status: OrderStatus) => {
  switch (status) {
    case "New":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";

    case "Accepted":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

    case "Preparing":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

    case "Ready":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";

    case "Delivered":
      return "bg-green-500/10 text-green-400 border-green-500/20";

    case "Rejected":
      return "bg-red-500/10 text-red-400 border-red-500/20";

    default:
      return "bg-white/5 text-white/60 border-white/10";
  }
};

const paymentClass = (status: PaymentStatus) => {
  return status === "PAID"
    ? "text-green-400"
    : "text-yellow-400";
};

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOrders = useCallback(async () => {
    let cancelled = false;

    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("User is not authenticated.");
      }

      // ---------------------------------------------------------
      // 1. Find restaurant owned by current user
      // ---------------------------------------------------------
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (restaurantError) {
        throw restaurantError;
      }

      if (!restaurant) {
        throw new Error("No restaurant found for this owner.");
      }

      // ---------------------------------------------------------
      // 2. Load orders
      // ---------------------------------------------------------
      const { data: dbOrders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          restaurant_id,
          customer_id,
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
          updated_at
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      const safeOrders = (dbOrders || []) as DbOrder[];

      // No orders
      if (safeOrders.length === 0) {
        if (!cancelled) {
          setOrders([]);
          setLoading(false);
        }

        return;
      }

      const orderIds = safeOrders.map((order) => order.id);

      // ---------------------------------------------------------
      // 3. Load order items
      // ---------------------------------------------------------
      const { data: dbOrderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          menu_item_id,
          item_name,
          item_price,
          quantity,
          item_total,
          created_at
        `)
        .in("order_id", orderIds);

      if (itemsError) {
        throw itemsError;
      }

      const safeOrderItems = (dbOrderItems || []) as DbOrderItem[];

      // ---------------------------------------------------------
      // 4. Load payments
      // ---------------------------------------------------------
      const { data: dbPayments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          order_id,
          amount,
          payment_method,
          payment_status,
          transaction_id,
          provider,
          provider_payment_id,
          paid_at,
          created_at,
          updated_at
        `)
        .in("order_id", orderIds);

      if (paymentsError) {
        throw paymentsError;
      }

      const safePayments = (dbPayments || []) as DbPayment[];

      // ---------------------------------------------------------
      // 5. Create item map
      // ---------------------------------------------------------
      const itemsMap = new Map<string, OrderItem[]>();

      safeOrderItems.forEach((item) => {
        const existing = itemsMap.get(item.order_id) || [];

        existing.push({
          name: item.item_name,
          quantity: Number(item.quantity || 0),
          price: Number(item.item_price || 0),
          total: Number(item.item_total || 0),
        });

        itemsMap.set(item.order_id, existing);
      });

      // ---------------------------------------------------------
      // 6. Create payment map
      // ---------------------------------------------------------
      const paymentMap = new Map<string, DbPayment>();

      safePayments.forEach((payment) => {
        paymentMap.set(payment.order_id, payment);
      });

      // ---------------------------------------------------------
      // 7. Convert DB orders → UI orders
      // ---------------------------------------------------------
      const formattedOrders: Order[] = safeOrders.map((order) => {
        const payment = paymentMap.get(order.id);

        const orderType =
          (order.order_type || "").toLowerCase() === "pickup"
            ? "Pickup"
            : "Delivery";

        return {
          dbId: order.id,

          orderNumber: String(order.order_number),

          customer:
            order.customer_name?.trim() || "Guest Customer",

          phone:
            order.customer_phone?.trim() || "Not Available",

          type: orderType,

          items: itemsMap.get(order.id) || [],

          total: Number(order.total_amount || 0),

          payment: paymentMethodToUi(payment?.payment_method),

          paymentStatus: paymentStatusToUi(payment?.payment_status),

          status: dbStatusToUi(order.status),

          time: formatTime(order.created_at),

          date: formatDate(order.created_at),

          address:
            order.delivery_address?.trim() || undefined,

          specialInstructions:
            order.special_instructions?.trim() || undefined,
        };
      });

      if (!cancelled) {
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error("Orders loading error:", err);

      if (!cancelled) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unable to load orders.");
        }

        setOrders([]);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const cleanup = await loadOrders();

      if (!active && typeof cleanup === "function") {
        cleanup();
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [loadOrders, refreshKey]);

  // ---------------------------------------------------------
  // Update order status
  // ---------------------------------------------------------
  const updateStatus = async (
    order: Order,
    newStatus: OrderStatus
  ) => {
    try {
      setUpdating(order.dbId);
      setError("");

      const dbStatus = uiStatusToDb(newStatus);

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: dbStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.dbId);

      if (updateError) {
        throw updateError;
      }

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.dbId === order.dbId
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      setSelectedOrder((currentOrder) =>
        currentOrder && currentOrder.dbId === order.dbId
          ? {
              ...currentOrder,
              status: newStatus,
            }
          : currentOrder
      );
    } catch (err) {
      console.error("Order status update error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to update order status.");
      }
    } finally {
      setUpdating(null);
    }
  };

  // ---------------------------------------------------------
  // Search + filter
  // ---------------------------------------------------------
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "All" ||
        order.status === activeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        order.type.toLowerCase().includes(query)
      );
    });
  }, [orders, activeFilter, search]);

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------
  const summary = useMemo(() => {
    const total = orders.length;

    const newOrders = orders.filter(
      (order) => order.status === "New"
    ).length;

    const preparing = orders.filter(
      (order) =>
        order.status === "Preparing" ||
        order.status === "Accepted"
    ).length;

    const completed = orders.filter(
      (order) => order.status === "Delivered"
    ).length;

    const revenue = orders
      .filter((order) => order.status !== "Rejected")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      total,
      newOrders,
      preparing,
      completed,
      revenue,
    };
  }, [orders]);

  const nextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case "New":
        return "Accepted";

      case "Accepted":
        return "Preparing";

      case "Preparing":
        return "Ready";

      case "Ready":
        return "Delivered";

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------
            Header
        --------------------------------------------------- */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
              Owner Dashboard
            </p>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Orders
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Manage incoming restaurant orders and update their status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        {/* ---------------------------------------------------
            Error
        --------------------------------------------------- */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setRefreshKey((value) => value + 1);
                }}
                className="text-left font-medium text-red-200 underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------
            Summary cards
        --------------------------------------------------- */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Total
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              New
            </p>

            <p className="mt-2 text-2xl font-semibold text-blue-400">
              {summary.newOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Active
            </p>

            <p className="mt-2 text-2xl font-semibold text-yellow-400">
              {summary.preparing}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Delivered
            </p>

            <p className="mt-2 text-2xl font-semibold text-green-400">
              {summary.completed}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-[#c9a45c]/20 bg-[#c9a45c]/5 p-4 lg:col-span-1">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Revenue
            </p>

            <p className="mt-2 text-2xl font-semibold text-[#c9a45c]">
              {formatCurrency(summary.revenue)}
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------
            Search
        --------------------------------------------------- */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order number, customer, phone..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c9a45c]/50"
            />
          </div>
        </div>

        {/* ---------------------------------------------------
            Filters
        --------------------------------------------------- */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                activeFilter === filter
                  ? "border-[#c9a45c]/40 bg-[#c9a45c]/10 text-[#c9a45c]"
                  : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* ---------------------------------------------------
            Loading
        --------------------------------------------------- */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="text-sm text-white/50">
              Loading orders...
            </p>
          </div>
        )}

        {/* ---------------------------------------------------
            Empty state
        --------------------------------------------------- */}
        {!loading && filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl">
              🧾
            </div>

            <h2 className="text-lg font-medium">
              No orders found
            </h2>

            <p className="mt-2 text-sm text-white/40">
              {search || activeFilter !== "All"
                ? "Try changing your search or filter."
                : "New customer orders will appear here."}
            </p>
          </div>
        )}

        {/* ---------------------------------------------------
            Desktop table
        --------------------------------------------------- */}
        {!loading && filteredOrders.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Order
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Type
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Items
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Total
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Payment
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/40">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => {
                      const next = nextStatus(order.status);

                      return (
                        <tr
                          key={order.dbId}
                          className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="text-left"
                            >
                              <p className="font-medium text-white hover:text-[#c9a45c]">
                                #{order.orderNumber}
                              </p>

                              <p className="mt-1 text-xs text-white/35">
                                {order.date} · {order.time}
                              </p>
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium">
                              {order.customer}
                            </p>

                            <p className="mt-1 text-xs text-white/40">
                              {order.phone}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm text-white/70">
                              {order.type}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[220px]">
                              {order.items.length > 0 ? (
                                <p className="truncate text-sm text-white/70">
                                  {order.items
                                    .map(
                                      (item) =>
                                        `${item.name} × ${item.quantity}`
                                    )
                                    .join(", ")}
                                </p>
                              ) : (
                                <span className="text-sm text-white/30">
                                  No items
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-semibold text-[#c9a45c]">
                              {formatCurrency(order.total)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm">
                              {order.payment}
                            </p>

                            <p
                              className={`mt-1 text-xs font-medium ${paymentClass(
                                order.paymentStatus
                              )}`}
                            >
                              {order.paymentStatus}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedOrder(order)
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
                              >
                                View
                              </button>

                              {next && (
                                <button
                                  type="button"
                                  disabled={updating === order.dbId}
                                  onClick={() =>
                                    void updateStatus(
                                      order,
                                      next
                                    )
                                  }
                                  className="rounded-lg bg-[#c9a45c] px-3 py-2 text-xs font-medium text-black transition hover:bg-[#d8b66f] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updating === order.dbId
                                    ? "..."
                                    : next}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------------------------------------
                Mobile cards
            ------------------------------------------------- */}
            <div className="grid gap-3 lg:hidden">
              {filteredOrders.map((order) => {
                const next = nextStatus(order.status);

                return (
                  <div
                    key={order.dbId}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-left"
                      >
                        <p className="font-semibold">
                          #{order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {order.date} · {order.time}
                        </p>
                      </button>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-white/35">
                          Customer
                        </p>

                        <p className="mt-1 text-sm">
                          {order.customer}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/35">
                          Type
                        </p>

                        <p className="mt-1 text-sm">
                          {order.type}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/35">
                          Total
                        </p>

                        <p className="mt-1 font-semibold text-[#c9a45c]">
                          {formatCurrency(order.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/35">
                          Payment
                        </p>

                        <p className="mt-1 text-sm">
                          {order.payment}
                        </p>

                        <p
                          className={`text-xs ${paymentClass(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </p>
                      </div>
                    </div>

                    {order.items.length > 0 && (
                      <div className="mt-4 border-t border-white/5 pt-3">
                        <p className="mb-2 text-xs text-white/35">
                          Items
                        </p>

                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div
                              key={`${order.dbId}-${item.name}-${index}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="truncate text-white/70">
                                {item.name} × {item.quantity}
                              </span>

                              <span className="shrink-0 text-white/50">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                      >
                        View Details
                      </button>

                      {next && (
                        <button
                          type="button"
                          disabled={updating === order.dbId}
                          onClick={() =>
                            void updateStatus(order, next)
                          }
                          className="flex-1 rounded-xl bg-[#c9a45c] px-3 py-2.5 text-sm font-medium text-black transition hover:bg-[#d8b66f] disabled:opacity-50"
                        >
                          {updating === order.dbId
                            ? "Updating..."
                            : next}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* -----------------------------------------------------
          Order Details Modal
      ----------------------------------------------------- */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#111111] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/35">
                  Order
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  #{selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Customer */}
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/35">
                  Customer
                </p>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="font-medium">
                    {selectedOrder.customer}
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    {selectedOrder.phone}
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    {selectedOrder.type}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/35">
                  Order Items
                </p>

                <div className="overflow-hidden rounded-xl border border-white/10">
                  {selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div
                        key={`${selectedOrder.dbId}-modal-${item.name}-${index}`}
                        className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {item.quantity} ×{" "}
                            {formatCurrency(item.price)}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-medium">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-5 text-sm text-white/40">
                      No order items found.
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-white/[0.03] px-4 py-4">
                    <span className="font-medium">
                      Total
                    </span>

                    <span className="text-lg font-semibold text-[#c9a45c]">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              {selectedOrder.address && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/35">
                    Delivery Address
                  </p>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/70">
                    {selectedOrder.address}
                  </div>
                </div>
              )}

              {/* Special instructions */}
              {selectedOrder.specialInstructions && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/35">
                    Special Instructions
                  </p>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/70">
                    {selectedOrder.specialInstructions}
                  </div>
                </div>
              )}

              {/* Payment + status */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-xs text-white/35">
                    Payment Method
                  </p>

                  <p className="mt-2 font-medium">
                    {selectedOrder.payment}
                  </p>

                  <p
                    className={`mt-1 text-xs font-medium ${paymentClass(
                      selectedOrder.paymentStatus
                    )}`}
                  >
                    {selectedOrder.paymentStatus}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-xs text-white/35">
                    Order Status
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status actions */}
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/35">
                  Update Status
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "New",
                      "Accepted",
                      "Preparing",
                      "Ready",
                      "Delivered",
                      "Rejected",
                    ] as OrderStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating === selectedOrder.dbId}
                      onClick={() =>
                        void updateStatus(
                          selectedOrder,
                          status
                        )
                      }
                      className={`rounded-lg border px-3 py-2 text-xs transition ${
                        selectedOrder.status === status
                          ? statusClass(status)
                          : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {updating === selectedOrder.dbId &&
                      selectedOrder.status !== status
                        ? "..."
                        : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}