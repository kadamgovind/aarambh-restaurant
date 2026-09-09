"use client";

import { useEffect, useState } from "react";
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

type PaymentMethod = "cash" | "upi" | "card";
type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

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
  payment: "UPI" | "Card" | "Cash";
  paymentStatus: "PAID" | "PENDING";
  status: OrderStatus;
  time: string;
  date: string;
  address?: string;
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

const dbStatusToUi: Record<DbOrderStatus, OrderStatus> = {
  pending: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Rejected",
};

const uiStatusToDb: Record<OrderStatus, DbOrderStatus> = {
  New: "pending",
  Accepted: "accepted",
  Preparing: "preparing",
  Ready: "ready",
  Delivered: "delivered",
  Rejected: "cancelled",
};

const paymentMethodToUi: Record<
  PaymentMethod,
  "UPI" | "Card" | "Cash"
> = {
  upi: "UPI",
  card: "Card",
  cash: "Cash",
};

const paymentStatusToUi: Record<
  PaymentStatus,
  "PAID" | "PENDING"
> = {
  paid: "PAID",
  pending: "PENDING",
  failed: "PENDING",
  refunded: "PENDING",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      /* -----------------------------------------------
         1. CURRENT USER
      ------------------------------------------------ */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      /* -----------------------------------------------
         2. OWNER RESTAURANT
      ------------------------------------------------ */

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        throw restaurantError;
      }

      if (!restaurant) {
        throw new Error(
          "No restaurant is linked to this owner account."
        );
      }

      /* -----------------------------------------------
         3. ORDERS
      ------------------------------------------------ */

      const { data: dbOrders, error: ordersError } =
        await supabase
          .from("orders")
          .select(
            `
              id,
              customer_id,
              order_number,
              status,
              total,
              payment_method,
              delivery_address,
              created_at
            `
          )
          .eq("restaurant_id", restaurant.id)
          .order("created_at", {
            ascending: false,
          });

      if (ordersError) {
        throw ordersError;
      }

      if (!dbOrders || dbOrders.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = dbOrders.map(
        (order) => order.id
      );

      const customerIds = Array.from(
        new Set(
          dbOrders
            .map((order) => order.customer_id)
            .filter(Boolean)
        )
      );

      /* -----------------------------------------------
         4. ORDER ITEMS
      ------------------------------------------------ */

      const { data: dbItems, error: itemsError } =
        await supabase
          .from("order_items")
          .select(
            `
              id,
              order_id,
              item_name,
              quantity,
              unit_price,
              total_price
            `
          )
          .in("order_id", orderIds);

      if (itemsError) {
        throw itemsError;
      }

      /* -----------------------------------------------
         5. PAYMENTS
         Table name = payment
      ------------------------------------------------ */

      const { data: dbPayments, error: paymentsError } =
        await supabase
          .from("payment")
          .select(
            `
              id,
              order_id,
              amount,
              method,
              status
            `
          )
          .in("order_id", orderIds);

      if (paymentsError) {
        throw paymentsError;
      }

      /* -----------------------------------------------
         6. CUSTOMER PROFILE
         Table name = profile
      ------------------------------------------------ */

      let dbProfiles: {
        id: string;
        full_name: string | null;
        phone: string | null;
      }[] = [];

      if (customerIds.length > 0) {
        const { data: profiles, error: profilesError } =
          await supabase
            .from("profile")
            .select(
              `
                id,
                full_name,
                phone
              `
            )
            .in("id", customerIds);

        if (profilesError) {
          throw profilesError;
        }

        dbProfiles = profiles || [];
      }

      /* -----------------------------------------------
         7. PROFILE MAP
      ------------------------------------------------ */

      const profileMap = new Map(
        dbProfiles.map((profile) => [
          profile.id,
          profile,
        ])
      );

      /* -----------------------------------------------
         8. ITEMS MAP
      ------------------------------------------------ */

      const itemsMap = new Map<
        string,
        OrderItem[]
      >();

      (dbItems || []).forEach((item) => {
        const existing =
          itemsMap.get(item.order_id) || [];

        existing.push({
          name: item.item_name,
          quantity: Number(item.quantity || 0),
          price: Number(item.unit_price || 0),
          total: Number(
            item.total_price ??
              Number(item.quantity || 0) *
                Number(item.unit_price || 0)
          ),
        });

        itemsMap.set(
          item.order_id,
          existing
        );
      });

      /* -----------------------------------------------
         9. PAYMENT MAP
      ------------------------------------------------ */

      const paymentMap = new Map<
        string,
        {
          method: PaymentMethod;
          status: PaymentStatus;
        }
      >();

      (dbPayments || []).forEach((payment) => {
        paymentMap.set(payment.order_id, {
          method:
            payment.method as PaymentMethod,
          status:
            payment.status as PaymentStatus,
        });
      });

      /* -----------------------------------------------
         10. FORMAT ORDERS
      ------------------------------------------------ */

      const formattedOrders: Order[] =
        dbOrders.map((order) => {
          const profile = profileMap.get(
            order.customer_id
          );

          const payment = paymentMap.get(
            order.id
          );

          const dbStatus =
            order.status as DbOrderStatus;

          const paymentMethod =
            payment?.method ||
            (order.payment_method as PaymentMethod);

          const paymentStatus =
            payment?.status || "pending";

          const createdAt = new Date(
            order.created_at
          );

          return {
            dbId: order.id,

            orderNumber: String(
              order.order_number
            ),

            customer:
              profile?.full_name?.trim() ||
              "Customer",

            phone:
              profile?.phone?.trim() ||
              "Phone not available",

            type: order.delivery_address
              ? "Delivery"
              : "Pickup",

            items:
              itemsMap.get(order.id) || [],

            total: Number(order.total || 0),

            payment:
              paymentMethodToUi[
                paymentMethod
              ] || "Cash",

            paymentStatus:
              paymentStatusToUi[
                paymentStatus
              ] || "PENDING",

            status:
              dbStatusToUi[dbStatus] ||
              "New",

            time: createdAt.toLocaleTimeString(
              "en-IN",
              {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }
            ),

            date: createdAt.toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              }
            ),

            address:
              order.delivery_address ||
              undefined,
          };
        });

      setOrders(formattedOrders);
    } catch (err) {
      console.error(
        "Orders loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadOrders();
  }, []);

  /* =====================================================
     UPDATE ORDER STATUS
  ===================================================== */

  const updateStatus = async (
    orderId: string,
    status: OrderStatus
  ) => {
    try {
      setUpdating(true);
      setError("");

      const dbStatus =
        uiStatusToDb[status];

      if (!dbStatus) {
        throw new Error(
          "Invalid order status."
        );
      }

      /* -----------------------------------------------
         UPDATE USING REAL DATABASE UUID
      ------------------------------------------------ */

      const { error: updateError } =
        await supabase
          .from("orders")
          .update({
            status: dbStatus,
          })
          .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      /* -----------------------------------------------
         UPDATE LOCAL STATE
      ------------------------------------------------ */

      setOrders((current) =>
        current.map((order) =>
          order.dbId === orderId
            ? {
                ...order,
                status,
              }
            : order
        )
      );

      setSelectedOrder((current) =>
        current?.dbId === orderId
          ? {
              ...current,
              status,
            }
          : current
      );
    } catch (err) {
      console.error(
        "Order status update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    } finally {
      setUpdating(false);
    }
  };

  /* =====================================================
     FILTER + SEARCH
  ===================================================== */

  const filteredOrders =
    orders.filter((order) => {
      const matchesFilter =
        activeFilter === "All" ||
        order.status === activeFilter;

      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        order.orderNumber
          .toLowerCase()
          .includes(searchValue) ||
        order.customer
          .toLowerCase()
          .includes(searchValue) ||
        order.phone
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesFilter &&
        matchesSearch
      );
    });

  /* =====================================================
     SUMMARY
  ===================================================== */

  const newOrders = orders.filter(
    (order) =>
      order.status === "New"
  ).length;

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "Delivered" &&
      order.status !== "Rejected"
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "Delivered"
  ).length;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="mx-auto max-w-7xl">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
            Order Management
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Orders
          </h1>

          <p className="mt-3 text-sm text-white/40">
            Manage incoming orders and track their progress.
          </p>
        </div>

        <div className="text-sm text-white/40">
          Today •{" "}
          {new Date().toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">

          <span>{error}</span>

          <button
            onClick={loadOrders}
            className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs hover:bg-red-400/10"
          >
            Retry
          </button>

        </div>
      )}

      {/* SUMMARY */}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">

        <SummaryCard
          label="New Orders"
          value={
            loading
              ? "..."
              : String(newOrders)
          }
          description="Need attention"
        />

        <SummaryCard
          label="Active Orders"
          value={
            loading
              ? "..."
              : String(activeOrders)
          }
          description="Currently processing"
        />

        <SummaryCard
          label="Delivered"
          value={
            loading
              ? "..."
              : String(deliveredOrders)
          }
          description="Completed"
        />

      </div>

      {/* TOOLBAR */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* FILTERS */}

          <div className="flex gap-2 overflow-x-auto pb-1">

            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() =>
                  setActiveFilter(filter)
                }
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs transition ${
                  activeFilter === filter
                    ? "bg-white text-black"
                    : "border border-white/10 text-white/45 hover:bg-white/5 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}

          </div>

          {/* SEARCH */}

          <div className="relative w-full lg:w-72">

            <input
              type="text"
              placeholder="Search order or customer..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
            />

          </div>

        </div>

      </div>

      {/* ORDERS */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

        {loading ? (
          <div className="px-6 py-20 text-center">

            <div className="text-sm text-white/40">
              Loading orders...
            </div>

          </div>
        ) : (
          <>

            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full text-left">

                <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/30">

                  <tr>

                    <th className="px-6 py-5">
                      Order
                    </th>

                    <th className="px-6 py-5">
                      Customer
                    </th>

                    <th className="px-6 py-5">
                      Type
                    </th>

                    <th className="px-6 py-5">
                      Total
                    </th>

                    <th className="px-6 py-5">
                      Payment
                    </th>

                    <th className="px-6 py-5">
                      Status
                    </th>

                    <th className="px-6 py-5"></th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-white/10">

                  {filteredOrders.map(
                    (order) => (
                      <tr
                        key={order.dbId}
                        className="transition hover:bg-white/[0.025]"
                      >

                        <td className="px-6 py-6">

                          <div className="font-medium">
                            #{order.orderNumber}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {order.date} •{" "}
                            {order.time}
                          </div>

                        </td>

                        <td className="px-6 py-6">

                          <div className="text-sm font-medium">
                            {order.customer}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {order.phone}
                          </div>

                        </td>

                        <td className="px-6 py-6">

                          <span className="text-xs text-white/50">
                            {order.type}
                          </span>

                        </td>

                        <td className="px-6 py-6">

                          <div className="font-medium">
                            ₹
                            {order.total.toLocaleString(
                              "en-IN"
                            )}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {order.items.length} items
                          </div>

                        </td>

                        <td className="px-6 py-6">

                          <div className="text-xs">
                            {order.payment}
                          </div>

                          <div
                            className={`mt-1 text-[10px] ${
                              order.paymentStatus ===
                              "PAID"
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {order.paymentStatus}
                          </div>

                        </td>

                        <td className="px-6 py-6">

                          <StatusBadge
                            status={order.status}
                          />

                        </td>

                        <td className="px-6 py-6 text-right">

                          <button
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                          >
                            View
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE */}

            <div className="divide-y divide-white/10 lg:hidden">

              {filteredOrders.map(
                (order) => (
                  <div
                    key={order.dbId}
                    className="p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="font-medium">
                          #{order.orderNumber}
                        </div>

                        <div className="mt-1 text-xs text-white/30">
                          {order.date} •{" "}
                          {order.time}
                        </div>

                      </div>

                      <StatusBadge
                        status={order.status}
                      />

                    </div>

                    <div className="mt-5">

                      <div className="text-sm font-medium">
                        {order.customer}
                      </div>

                      <div className="mt-1 text-xs text-white/30">
                        {order.phone}
                      </div>

                    </div>

                    <div className="mt-5 flex items-end justify-between">

                      <div>

                        <div className="text-xs text-white/35">
                          TOTAL
                        </div>

                        <div className="mt-1 font-medium">
                          ₹
                          {order.total.toLocaleString(
                            "en-IN"
                          )}
                        </div>

                      </div>

                      <button
                        onClick={() =>
                          setSelectedOrder(
                            order
                          )
                        }
                        className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60"
                      >
                        View Order
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

            {filteredOrders.length === 0 && (
              <div className="px-6 py-20 text-center">

                <div className="text-sm text-white/40">
                  No orders found.
                </div>

                <div className="mt-2 text-xs text-white/25">
                  Orders placed at this restaurant will appear here.
                </div>

              </div>
            )}

          </>
        )}

      </div>

      {/* MODAL */}

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
          onStatusChange={updateStatus}
          updating={updating}
        />
      )}

    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

      <div className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </div>

      <div className="mt-4 text-3xl font-semibold">
        {value}
      </div>

      <div className="mt-2 text-xs text-white/30">
        {description}
      </div>

    </div>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const statusClasses: Record<
    OrderStatus,
    string
  > = {
    New:
      "border-white/20 bg-white/10 text-white",

    Accepted:
      "border-blue-400/20 bg-blue-400/10 text-blue-300",

    Preparing:
      "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",

    Ready:
      "border-green-400/20 bg-green-400/10 text-green-300",

    Delivered:
      "border-white/10 bg-white/5 text-white/40",

    Rejected:
      "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   ORDER MODAL
===================================================== */

function OrderModal({
  order,
  onClose,
  onStatusChange,
  updating,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: OrderStatus
  ) => void;
  updating: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >

      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0d0d]"
      >

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 p-6">

          <div>

            <div className="text-xs uppercase tracking-[0.2em] text-white/30">
              Order Details
            </div>

            <h2 className="mt-2 text-2xl font-semibold">
              #{order.orderNumber}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
          >
            ×
          </button>

        </div>

        {/* ORDER INFO */}

        <div className="grid grid-cols-2 border-b border-white/10">

          <div className="border-r border-white/10 p-6">

            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Order Type
            </div>

            <div className="mt-2 text-sm">
              {order.type}
            </div>

          </div>

          <div className="p-6">

            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Order Time
            </div>

            <div className="mt-2 text-sm">
              {order.date} •{" "}
              {order.time}
            </div>

          </div>

        </div>

        {/* CUSTOMER */}

        <div className="border-b border-white/10 p-6">

          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Customer
          </div>

          <div className="mt-4">

            <div className="font-medium">
              {order.customer}
            </div>

            <div className="mt-1 text-sm text-white/40">
              {order.phone}
            </div>

            {order.address && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/25">
                  Delivery Address
                </div>

                {order.address}
              </div>
            )}

          </div>

        </div>

        {/* ITEMS */}

        <div className="border-b border-white/10 p-6">

          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Order Items
          </div>

          <div className="mt-5 space-y-4">

            {order.items.length === 0 ? (
              <div className="text-sm text-white/35">
                No item details available.
              </div>
            ) : (
              order.items.map(
                (item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-4"
                  >

                    <div>

                      <div className="text-sm">
                        {item.name}
                      </div>

                      <div className="mt-1 text-xs text-white/30">
                        {item.quantity} × ₹
                        {item.price.toLocaleString(
                          "en-IN"
                        )}
                      </div>

                    </div>

                    <div className="text-sm font-medium">
                      ₹
                      {item.total.toLocaleString(
                        "en-IN"
                      )}
                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

        {/* PAYMENT */}

        <div className="grid grid-cols-2 border-b border-white/10">

          <div className="border-r border-white/10 p-6">

            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Payment Method
            </div>

            <div className="mt-2 text-sm">
              {order.payment}
            </div>

          </div>

          <div className="p-6">

            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Payment Status
            </div>

            <div
              className={`mt-2 text-sm ${
                order.paymentStatus ===
                "PAID"
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {order.paymentStatus}
            </div>

          </div>

        </div>

        {/* TOTAL */}

        <div className="flex items-center justify-between p-6">

          <div>

            <div className="text-xs text-white/30">
              ORDER TOTAL
            </div>

            <div className="mt-1 text-2xl font-semibold">
              ₹
              {order.total.toLocaleString(
                "en-IN"
              )}
            </div>

          </div>

          <StatusBadge
            status={order.status}
          />

        </div>

        {/* ACTIONS */}

        <div className="border-t border-white/10 p-6">

          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-white/30">
            Update Order
          </div>

          <div className="flex flex-wrap gap-2">

            {order.status === "New" && (
              <>
                <button
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      order.dbId,
                      "Accepted"
                    )
                  }
                  className="rounded-xl bg-white px-5 py-3 text-xs font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating
                    ? "Updating..."
                    : "Accept Order"}
                </button>

                <button
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      order.dbId,
                      "Rejected"
                    )
                  }
                  className="rounded-xl border border-red-400/20 px-5 py-3 text-xs text-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {order.status ===
              "Accepted" && (
              <button
                disabled={updating}
                onClick={() =>
                  onStatusChange(
                    order.dbId,
                    "Preparing"
                  )
                }
                className="rounded-xl bg-white px-5 py-3 text-xs font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating
                  ? "Updating..."
                  : "Start Preparing"}
              </button>
            )}

            {order.status ===
              "Preparing" && (
              <button
                disabled={updating}
                onClick={() =>
                  onStatusChange(
                    order.dbId,
                    "Ready"
                  )
                }
                className="rounded-xl bg-white px-5 py-3 text-xs font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating
                  ? "Updating..."
                  : "Mark Ready"}
              </button>
            )}

            {order.status === "Ready" && (
              <button
                disabled={updating}
                onClick={() =>
                  onStatusChange(
                    order.dbId,
                    "Delivered"
                  )
                }
                className="rounded-xl bg-white px-5 py-3 text-xs font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating
                  ? "Updating..."
                  : "Mark Delivered"}
              </button>
            )}

            {(order.status ===
              "Delivered" ||
              order.status ===
                "Rejected") && (
              <div className="rounded-xl border border-white/10 px-5 py-3 text-xs text-white/35">
                Order completed
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}