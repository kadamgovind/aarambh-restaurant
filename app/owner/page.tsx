"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: number;
  customer_id: string;
  customer_name: string;
  total_amount: number | string;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
};

type Reservation = {
  id: string;
  customer_id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number | string;
  customer_name: string;
  customer_phone: string;
  status: string;
};

type CustomerProfile = {
  id: string;
  full_name: string | null;
};

type Restaurant = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  role: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string) {
  if (!value) return "";

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function isCancelled(status: string) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "cancelled" ||
    normalized === "canceled"
  );
}

function isActiveOrder(status: string) {
  const normalized = normalizeStatus(status);

  return [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "out-for-delivery",
  ].includes(normalized);
}

function isNewOrder(status: string) {
  return normalizeStatus(status) === "pending";
}

export default function OwnerDashboard() {
  const router = useRouter();

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const [yesterdayRevenue, setYesterdayRevenue] =
    useState(0);

  const [todayCustomers, setTodayCustomers] =
    useState(0);

  const [profiles, setProfiles] = useState<
    Record<string, CustomerProfile>
  >({});

  /* =========================================================
     DATE HELPERS
  ========================================================= */

  const getDateKey = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(
      2,
      "0"
    );
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const todayKey = getDateKey(new Date());

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = getDateKey(yesterday);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      /* -----------------------------------------------------
         AUTH USER
      ----------------------------------------------------- */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      /* -----------------------------------------------------
         OWNER ROLE CHECK
      ----------------------------------------------------- */

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileData) {
        router.replace("/account");
        return;
      }

      const profile = profileData as Profile;

      const role = profile.role?.toLowerCase();

      if (role !== "owner") {
        router.replace("/account");
        return;
      }

      /* -----------------------------------------------------
         RESTAURANT OWNERSHIP CHECK
      ----------------------------------------------------- */

      const {
        data: restaurantData,
        error: restaurantError,
      } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (restaurantError) {
        throw new Error(restaurantError.message);
      }

      if (!restaurantData) {
        throw new Error(
          "No restaurant is connected to this owner account."
        );
      }

      setRestaurant(restaurantData);

      /* -----------------------------------------------------
         TODAY START
      ----------------------------------------------------- */

      const todayStart = new Date();

      todayStart.setHours(0, 0, 0, 0);

      /* -----------------------------------------------------
         ORDERS
      ----------------------------------------------------- */

      const { data: orderData, error: orderError } =
        await supabase
          .from("orders")
          .select(
            `
              id,
              order_number,
              customer_id,
              customer_name,
              total_amount,
              status,
              payment_method,
              payment_status,
              created_at
            `
          )
          .eq("restaurant_id", restaurantData.id)
          .gte("created_at", yesterday.toISOString())
          .order("created_at", {
            ascending: false,
          });

      if (orderError) {
        throw new Error(orderError.message);
      }

      const loadedOrders =
        (orderData ?? []) as Order[];

      setOrders(loadedOrders);

      /* -----------------------------------------------------
         ORDER ITEMS
      ----------------------------------------------------- */

      const orderIds = loadedOrders.map(
        (order) => order.id
      );

      let loadedItems: OrderItem[] = [];

      if (orderIds.length > 0) {
        const { data: itemData, error: itemError } =
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

        if (itemError) {
          throw new Error(itemError.message);
        }

        loadedItems = (itemData ?? []) as OrderItem[];
      }

      setOrderItems(loadedItems);

      /* -----------------------------------------------------
         RESERVATIONS
      ----------------------------------------------------- */

      const {
        data: reservationData,
        error: reservationError,
      } = await supabase
        .from("reservations")
        .select(
          `
            id,
            customer_id,
            reservation_date,
            reservation_time,
            guests,
            customer_name,
            customer_phone,
            status
          `
        )
        .eq("restaurant_id", restaurantData.id)
        .eq("reservation_date", todayKey)
        .order("reservation_time", {
          ascending: true,
        });

      if (reservationError) {
        throw new Error(reservationError.message);
      }

      const loadedReservations =
        (reservationData ?? []) as Reservation[];

      setReservations(loadedReservations);

      /* -----------------------------------------------------
         CUSTOMER PROFILES
      ----------------------------------------------------- */

      const customerIds = Array.from(
        new Set([
          ...loadedOrders.map(
            (order) => order.customer_id
          ),
          ...loadedReservations.map(
            (reservation) =>
              reservation.customer_id
          ),
        ])
      );

      if (customerIds.length > 0) {
        const {
          data: profileData,
          error: customerProfileError,
        } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", customerIds);

        if (customerProfileError) {
          console.warn(
            "Dashboard profile warning:",
            customerProfileError.message
          );
        } else {
          const profileMap: Record<
            string,
            CustomerProfile
          > = {};

          (profileData ?? []).forEach((profile) => {
            profileMap[profile.id] = profile;
          });

          setProfiles(profileMap);
        }
      } else {
        setProfiles({});
      }

      /* -----------------------------------------------------
         TODAY CUSTOMERS
      ----------------------------------------------------- */

      const todayCustomerIds = new Set(
        loadedOrders
          .filter(
            (order) =>
              getDateKey(new Date(order.created_at)) ===
                todayKey &&
              !isCancelled(order.status)
          )
          .map((order) => order.customer_id)
      );

      setTodayCustomers(todayCustomerIds.size);

      /* -----------------------------------------------------
         YESTERDAY REVENUE
      ----------------------------------------------------- */

      const yesterdayTotal = loadedOrders
        .filter((order) => {
          const orderDate = getDateKey(
            new Date(order.created_at)
          );

          return (
            orderDate === yesterdayKey &&
            !isCancelled(order.status)
          );
        })
        .reduce(
          (total, order) =>
            total + Number(order.total_amount || 0),
          0
        );

      setYesterdayRevenue(yesterdayTotal);
    } catch (err) {
      console.error(
        "Owner dashboard loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [
    getDateKey,
    router,
    todayKey,
    yesterdayKey,
  ]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!mounted) return;

      await loadDashboard();
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  /* =========================================================
     ORDER ACTION
  ========================================================= */

  async function updateOrderStatus(
    orderId: string,
    status: string
  ) {
    try {
      setActionLoading(orderId);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      /* -----------------------------------------------------
         VERIFY OWNER SESSION BEFORE MUTATION
      ----------------------------------------------------- */

      const { data: ownerProfile, error: ownerError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (ownerError) {
        throw new Error(ownerError.message);
      }

      if (
        ownerProfile?.role?.toLowerCase() !==
        "owner"
      ) {
        router.replace("/account");
        return;
      }

      /* -----------------------------------------------------
         UPDATE ORDER
         
         RLS must also verify that this order belongs
         to the owner's restaurant.
      ----------------------------------------------------- */

      const { error: updateError } =
        await supabase
          .from("orders")
          .update({
            status,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq(
            "restaurant_id",
            restaurant?.id || ""
          );

      if (updateError) {
        throw new Error(updateError.message);
      }

      await loadDashboard();
    } catch (err) {
      console.error(
        "Order status update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =========================================================
     CALCULATED DATA
  ========================================================= */

  const todayOrders = orders.filter(
    (order) =>
      getDateKey(new Date(order.created_at)) ===
        todayKey &&
      !isCancelled(order.status)
  );

  const todayRevenue = todayOrders.reduce(
    (total, order) =>
      total + Number(order.total_amount || 0),
    0
  );

  const todayOrderCount = todayOrders.length;

  const activeOrders = todayOrders.filter((order) =>
    isActiveOrder(order.status)
  ).length;

  const newOrders = todayOrders.filter((order) =>
    isNewOrder(order.status)
  );

  const todayReservations = reservations.filter(
    (reservation) =>
      !isCancelled(reservation.status)
  );

  const upcomingReservations =
    todayReservations.filter((reservation) => {
      const [hours, minutes] =
        reservation.reservation_time
          .split(":")
          .map(Number);

      const reservationTime = new Date();

      reservationTime.setHours(
        hours,
        minutes,
        0,
        0
      );

      return (
        reservationTime.getTime() >
        Date.now()
      );
    });

  const revenueChange =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) /
          yesterdayRevenue) *
        100
      : null;

  /* =========================================================
     FORMAT ORDER ITEMS
  ========================================================= */

  function getOrderItems(orderId: string) {
    return orderItems.filter(
      (item) => item.order_id === orderId
    );
  }

  function getCustomerName(
    customerId: string,
    fallback: string
  ) {
    return (
      profiles[customerId]?.full_name ||
      fallback ||
      "Customer"
    );
  }

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="mt-4 text-sm text-white/40">
            Checking owner access...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error && !restaurant) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 text-center">
          <h2 className="text-lg font-semibold text-red-300">
            Dashboard unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/45">
            {error}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={loadDashboard}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Try Again
            </button>

            <Link
              href="/account"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70"
            >
              My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <p className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-10">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
          Owner Dashboard
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Good evening, Owner.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
          Here is what is happening with{" "}
          {restaurant?.name || "your restaurant"}{" "}
          today.
        </p>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* REVENUE */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">
            Today's Revenue
          </div>

          <div className="mt-4 text-3xl font-semibold">
            {formatCurrency(todayRevenue)}
          </div>

          <div
            className={`mt-3 text-xs ${
              revenueChange !== null &&
              revenueChange >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {revenueChange === null
              ? "No previous-day data"
              : `${
                  revenueChange >= 0
                    ? "+"
                    : ""
                }${revenueChange.toFixed(
                  1
                )}% from yesterday`}
          </div>
        </div>

        {/* ORDERS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">
            Orders
          </div>

          <div className="mt-4 text-3xl font-semibold">
            {todayOrderCount}
          </div>

          <div className="mt-3 text-xs text-white/35">
            {activeOrders} currently active
          </div>
        </div>

        {/* RESERVATIONS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">
            Reservations
          </div>

          <div className="mt-4 text-3xl font-semibold">
            {todayReservations.length}
          </div>

          <div className="mt-3 text-xs text-white/35">
            {upcomingReservations.length} upcoming
          </div>
        </div>

        {/* CUSTOMERS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">
            Customers
          </div>

          <div className="mt-4 text-3xl font-semibold">
            {todayCustomers}
          </div>

          <div className="mt-3 text-xs text-white/35">
            unique customers today
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* ===================================================
            ORDERS
        =================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <h2 className="font-medium">
                New Orders
              </h2>

              <p className="mt-1 text-xs text-white/35">
                Orders requiring attention
              </p>
            </div>

            <Link
              href="/owner/orders"
              className="text-xs text-white/45 transition hover:text-white"
            >
              View all →
            </Link>
          </div>

          {newOrders.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-sm text-white/50">
                No new orders
              </div>

              <p className="mt-2 text-xs text-white/25">
                New pending orders will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {newOrders
                .slice(0, 5)
                .map((order) => {
                  const items =
                    getOrderItems(order.id);

                  return (
                    <div
                      key={order.id}
                      className="p-6"
                    >
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                          <div className="text-xs text-white/35">
                            ORDER #
                            {order.order_number}
                          </div>

                          <div className="mt-2 font-medium">
                            {getCustomerName(
                              order.customer_id,
                              order.customer_name
                            )}
                          </div>

                          <div className="mt-2 text-sm text-white/45">
                            {items.length > 0 ? (
                              items
                                .slice(0, 4)
                                .map((item) => (
                                  <div
                                    key={item.id}
                                  >
                                    {Number(
                                      item.quantity
                                    )}{" "}
                                    ×{" "}
                                    {item.item_name}
                                  </div>
                                ))
                            ) : (
                              <span>
                                Order items unavailable
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(
                              Number(
                                order.total_amount
                              )
                            )}
                          </div>

                          <div className="mt-1 text-xs uppercase text-yellow-400">
                            {order.payment_method} •{" "}
                            {order.payment_status}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              disabled={
                                actionLoading ===
                                order.id
                              }
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  "confirmed"
                                )
                              }
                              className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
                            >
                              {actionLoading ===
                              order.id
                                ? "..."
                                : "Accept"}
                            </button>

                            <button
                              disabled={
                                actionLoading ===
                                order.id
                              }
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  "cancelled"
                                )
                              }
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/5 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* ===================================================
            RESERVATIONS
        =================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <h2 className="font-medium">
                Today's Reservations
              </h2>

              <p className="mt-1 text-xs text-white/35">
                Upcoming table bookings
              </p>
            </div>

            <Link
              href="/owner/reservations"
              className="text-xs text-white/45 hover:text-white"
            >
              View all →
            </Link>
          </div>

          {todayReservations.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-sm text-white/50">
                No reservations today
              </div>

              <p className="mt-2 text-xs text-white/25">
                Today's bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {todayReservations
                .slice(0, 6)
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-6"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {reservation.customer_name ||
                          "Customer"}
                      </div>

                      <div className="mt-1 text-xs text-white/35">
                        {reservation.guests}{" "}
                        {Number(
                          reservation.guests
                        ) === 1
                          ? "Guest"
                          : "Guests"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-white/60">
                        {formatTime(
                          reservation.reservation_time
                        )}
                      </div>

                      <div className="mt-1 text-xs capitalize text-white/30">
                        {reservation.status}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}