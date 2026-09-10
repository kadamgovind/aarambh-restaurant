"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Period = "Daily" | "Weekly" | "Monthly";

type OrderRow = {
  id: string;
  customer_id: string;
  total_amount: number | string;
  status: string;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  item_name: string;
  quantity: number;
  total_price: number | string;
};

type ReservationRow = {
  id: string;
  customer_id: string;
  reservation_date: string;
  guests: number;
  status: string;
};

type ProfileRow = {
  id: string;
  created_at: string;
};

type RevenuePoint = {
  label: string;
  revenue: number;
  orders: number;
};

type CustomerPoint = {
  month: string;
  customers: number;
};

type BookingPoint = {
  label: string;
  bookings: number;
  guests: number;
};

type DishPoint = {
  rank: number;
  name: string;
  orders: number;
  revenue: number;
  trend: string;
};

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
];

const VALID_RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(
    Math.round(value)
  );
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "short",
  });
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function isSuccessfulOrder(status: string) {
  return VALID_ORDER_STATUSES.includes(
    status.toLowerCase()
  );
}

function isSuccessfulReservation(status: string) {
  return VALID_RESERVATION_STATUSES.includes(
    status.toLowerCase()
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] =
    useState<Period>("Daily");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] =
    useState<OrderItemRow[]>([]);
  const [reservations, setReservations] =
    useState<ReservationRow[]>([]);
  const [profiles, setProfiles] =
    useState<ProfileRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [restaurantId, setRestaurantId] =
    useState<string | null>(null);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Please login first.");
      }

      /*
       * -------------------------------------------------------
       * FIND OWNER RESTAURANT
       * -------------------------------------------------------
       */

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) throw restaurantError;

      if (!restaurant) {
        throw new Error(
          "No restaurant is connected to this owner account."
        );
      }

      setRestaurantId(restaurant.id);

      /*
       * -------------------------------------------------------
       * LOAD ORDERS
       * -------------------------------------------------------
       */

      const { data: ordersData, error: ordersError } =
        await supabase
          .from("orders")
          .select(
            `
              id,
              customer_id,
              total_amount,
              status,
              created_at
            `
          )
          .eq("restaurant_id", restaurant.id)
          .order("created_at", {
            ascending: true,
          });

      if (ordersError) throw ordersError;

      /*
       * -------------------------------------------------------
       * LOAD ORDER ITEMS
       * -------------------------------------------------------
       */

      const orderIds = (ordersData ?? []).map(
        (order) => order.id
      );

      let itemsData: OrderItemRow[] = [];

      if (orderIds.length > 0) {
        const { data, error: itemsError } =
          await supabase
            .from("order_items")
            .select(
              `
                order_id,
                item_name,
                quantity,
                total_price
              `
            )
            .in("order_id", orderIds);

        if (itemsError) throw itemsError;

        itemsData = (data ?? []) as OrderItemRow[];
      }

      /*
       * -------------------------------------------------------
       * LOAD RESERVATIONS
       * -------------------------------------------------------
       */

      const {
        data: reservationsData,
        error: reservationsError,
      } = await supabase
        .from("reservations")
        .select(
          `
            id,
            customer_id,
            reservation_date,
            guests,
            status
          `
        )
        .eq("restaurant_id", restaurant.id)
        .order("reservation_date", {
          ascending: true,
        });

      if (reservationsError) throw reservationsError;

      /*
       * -------------------------------------------------------
       * LOAD PROFILES
       * -------------------------------------------------------
       */

      const customerIds = Array.from(
        new Set(
          (ordersData ?? [])
            .map((order) => order.customer_id)
            .filter(Boolean)
            .concat(
              (reservationsData ?? [])
                .map(
                  (reservation) =>
                    reservation.customer_id
                )
                .filter(Boolean)
            )
        )
      );

      let profilesData: ProfileRow[] = [];

      if (customerIds.length > 0) {
        const { data, error: profilesError } =
          await supabase
            .from("profiles")
            .select("id, created_at")
            .in("id", customerIds);

        if (profilesError) throw profilesError;

        profilesData = (data ?? []) as ProfileRow[];
      }

      setOrders((ordersData ?? []) as OrderRow[]);
      setOrderItems(itemsData);
      setReservations(
        (reservationsData ?? []) as ReservationRow[]
      );
      setProfiles(profilesData);
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  /*
   * =========================================================
   * SUCCESSFUL ORDERS
   * =========================================================
   */

  const successfulOrders = useMemo(() => {
    return orders.filter((order) =>
      isSuccessfulOrder(order.status)
    );
  }, [orders]);

  /*
   * =========================================================
   * CURRENT PERIOD DATA
   * =========================================================
   */

  const revenueData = useMemo<RevenuePoint[]>(() => {
    const now = new Date();

    if (period === "Daily") {
      const result: RevenuePoint[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        const start = startOfDay(date);
        const end = endOfDay(date);

        const dayOrders =
          successfulOrders.filter((order) => {
            const orderDate = new Date(
              order.created_at
            );

            return (
              orderDate >= start &&
              orderDate <= end
            );
          });

        result.push({
          label: date.toLocaleDateString("en-IN", {
            weekday: "short",
          }),
          revenue: dayOrders.reduce(
            (sum, order) =>
              sum + Number(order.total_amount || 0),
            0
          ),
          orders: dayOrders.length,
        });
      }

      return result;
    }

    if (period === "Weekly") {
      const result: RevenuePoint[] = [];

      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(
          now.getDate() - i * 7
        );

        const start = new Date(end);
        start.setDate(end.getDate() - 6);

        const weeklyOrders =
          successfulOrders.filter((order) => {
            const orderDate = new Date(
              order.created_at
            );

            return (
              orderDate >= startOfDay(start) &&
              orderDate <= endOfDay(end)
            );
          });

        result.push({
          label: `W${4 - i}`,
          revenue: weeklyOrders.reduce(
            (sum, order) =>
              sum + Number(order.total_amount || 0),
            0
          ),
          orders: weeklyOrders.length,
        });
      }

      return result;
    }

    const result: RevenuePoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const monthKey = getMonthKey(date);

      const monthOrders =
        successfulOrders.filter((order) => {
          const orderDate = new Date(
            order.created_at
          );

          return (
            getMonthKey(orderDate) === monthKey
          );
        });

      result.push({
        label: formatMonth(date),
        revenue: monthOrders.reduce(
          (sum, order) =>
            sum + Number(order.total_amount || 0),
          0
        ),
        orders: monthOrders.length,
      });
    }

    return result;
  }, [period, successfulOrders]);

  /*
   * =========================================================
   * REVENUE
   * =========================================================
   */

  const currentRevenue = useMemo(() => {
    return revenueData.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
  }, [revenueData]);

  /*
   * =========================================================
   * ORDERS
   * =========================================================
   */

  const currentOrders = useMemo(() => {
    return revenueData.reduce(
      (sum, item) => sum + item.orders,
      0
    );
  }, [revenueData]);

  /*
   * =========================================================
   * AVERAGE ORDER VALUE
   * =========================================================
   */

  const averageOrderValue =
    currentOrders > 0
      ? Math.round(
          currentRevenue / currentOrders
        )
      : 0;

  /*
   * =========================================================
   * CUSTOMER COUNT
   * =========================================================
   */

  const customerIds = useMemo(() => {
    return new Set(
      successfulOrders
        .map((order) => order.customer_id)
        .filter(Boolean)
    );
  }, [successfulOrders]);

  const totalCustomers = customerIds.size;

  /*
   * =========================================================
   * CUSTOMER GROWTH — LAST 6 MONTHS
   * =========================================================
   */

  const customerGrowth = useMemo<
    CustomerPoint[]
  >(() => {
    const now = new Date();

    const result: CustomerPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const monthKey = getMonthKey(date);

      const customers = new Set(
        successfulOrders
          .filter((order) => {
            return (
              getMonthKey(
                new Date(order.created_at)
              ) === monthKey
            );
          })
          .map((order) => order.customer_id)
          .filter(Boolean)
      );

      result.push({
        month: formatMonth(date),
        customers: customers.size,
      });
    }

    return result;
  }, [successfulOrders]);

  const maxCustomers = Math.max(
    1,
    ...customerGrowth.map(
      (item) => item.customers
    )
  );

  /*
   * =========================================================
   * BEST SELLING DISHES
   * =========================================================
   */

  const bestSellingDishes = useMemo<
    DishPoint[]
  >(() => {
    const dishMap = new Map<
      string,
      {
        orders: number;
        revenue: number;
      }
    >();

    const successfulOrderIds = new Set(
      successfulOrders.map((order) => order.id)
    );

    orderItems.forEach((item) => {
      if (!successfulOrderIds.has(item.order_id)) {
        return;
      }

      const name = item.item_name.trim();

      if (!name) return;

      const existing = dishMap.get(name);

      if (existing) {
        existing.orders += Number(
          item.quantity || 0
        );

        existing.revenue += Number(
          item.total_price || 0
        );
      } else {
        dishMap.set(name, {
          orders: Number(item.quantity || 0),
          revenue: Number(item.total_price || 0),
        });
      }
    });

    const sorted = Array.from(
      dishMap.entries()
    )
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => {
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }

        return b.orders - a.orders;
      })
      .slice(0, 5);

    if (sorted.length === 0) {
      return [];
    }

    const topRevenue = sorted[0].revenue;

    return sorted.map((dish, index) => ({
      rank: index + 1,
      name: dish.name,
      orders: dish.orders,
      revenue: dish.revenue,
      trend:
        topRevenue > 0
          ? `${Math.round(
              (dish.revenue / topRevenue) * 100
            )}%`
          : "0%",
    }));
  }, [orderItems, successfulOrders]);

  /*
   * =========================================================
   * BOOKINGS
   * =========================================================
   */

  const bookingData = useMemo<
    BookingPoint[]
  >(() => {
    const now = new Date();

    const result: BookingPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      const dateKey = date.toISOString().split("T")[0];

      const dayReservations =
        reservations.filter((reservation) => {
          return (
            reservation.reservation_date ===
              dateKey &&
            isSuccessfulReservation(
              reservation.status
            )
          );
        });

      result.push({
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        bookings: dayReservations.length,
        guests: dayReservations.reduce(
          (sum, reservation) =>
            sum + Number(reservation.guests || 0),
          0
        ),
      });
    }

    return result;
  }, [reservations]);

  const maxBookings = Math.max(
    1,
    ...bookingData.map(
      (item) => item.bookings
    )
  );

  const totalBookings = bookingData.reduce(
    (sum, item) => sum + item.bookings,
    0
  );

  const totalGuests = bookingData.reduce(
    (sum, item) => sum + item.guests,
    0
  );

  /*
   * =========================================================
   * ORDER SOURCES
   *
   * Current orders schema does not contain a dedicated
   * "source" column.
   *
   * Therefore we do NOT fake Website / Walk-in / Phone
   * percentages.
   * =========================================================
   */

  const orderSources = useMemo(() => {
    const total = successfulOrders.length;

    if (total === 0) {
      return [];
    }

    const website = successfulOrders.filter(
      (order) =>
        order.customer_id !== null
    ).length;

    return [
      {
        name: "Online",
        value: Math.round(
          (website / total) * 100
        ),
      },
    ];
  }, [successfulOrders]);

  /*
   * =========================================================
   * MAX REVENUE
   * =========================================================
   */

  const maxRevenue = Math.max(
    1,
    ...revenueData.map(
      (item) => item.revenue
    )
  );

  /*
   * =========================================================
   * PEAK DAY
   * =========================================================
   */

  const peakDay = useMemo(() => {
    if (revenueData.length === 0) {
      return "—";
    }

    return revenueData.reduce(
      (highest, current) =>
        current.orders > highest.orders
          ? current
          : highest,
      revenueData[0]
    ).label;
  }, [revenueData]);

  const topDish =
    bestSellingDishes.length > 0
      ? bestSellingDishes[0].name
      : "—";

  /*
   * =========================================================
   * CUSTOMER GROWTH %
   * =========================================================
   */

  const customerGrowthPercent = useMemo(() => {
    if (customerGrowth.length < 2) {
      return 0;
    }

    const previous =
      customerGrowth[
        customerGrowth.length - 2
      ].customers;

    const current =
      customerGrowth[
        customerGrowth.length - 1
      ].customers;

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.round(
      ((current - previous) / previous) *
        100
    );
  }, [customerGrowth]);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/35">
              Business Intelligence
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Understand revenue, orders, customers,
              menu performance and reservations from
              one intelligent dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-1">
            {(
              ["Daily", "Weekly", "Monthly"] as Period[]
            ).map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`rounded-lg px-4 py-2.5 text-xs font-medium transition ${
                  period === item
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              onClick={loadAnalytics}
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
                />
              ))}
            </div>

            <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
              <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                label="Revenue"
                value={`₹${formatNumber(
                  currentRevenue
                )}`}
                change="Live"
                detail={`${period.toLowerCase()} revenue`}
              />

              <MetricCard
                label="Orders"
                value={formatNumber(
                  currentOrders
                )}
                change="Live"
                detail={`${period.toLowerCase()} orders`}
              />

              <MetricCard
                label="Average Order"
                value={`₹${formatNumber(
                  averageOrderValue
                )}`}
                change="Live"
                detail="Average order value"
              />

              <MetricCard
                label="Customers"
                value={formatNumber(
                  totalCustomers
                )}
                change="Live"
                detail="Unique ordering customers"
              />

            </div>

            {/* =================================================
                REVENUE + ORDERS
            ================================================= */}

            <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                    Revenue Performance
                  </p>

                  <div className="mt-2 flex items-end gap-3">
                    <h2 className="text-3xl font-semibold">
                      ₹{formatNumber(
                        currentRevenue
                      )}
                    </h2>

                    <span className="mb-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/50">
                      Live
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-white/35">
                    Revenue generated during the
                    selected period.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-white/30">
                    Orders
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {formatNumber(
                      currentOrders
                    )}
                  </p>
                </div>

              </div>

              {/* REVENUE CHART */}

              <div className="relative h-72">

                <div className="absolute inset-0 flex flex-col justify-between">
                  {[100, 75, 50, 25, 0].map(
                    (value) => (
                      <div
                        key={value}
                        className="flex items-center gap-3"
                      >
                        <span className="w-10 text-right text-[10px] text-white/20">
                          {value === 0
                            ? "₹0"
                            : `₹${Math.round(
                                (maxRevenue *
                                  value) /
                                  100 /
                                  1000
                              )}k`}
                        </span>

                        <div className="h-px flex-1 bg-white/[0.06]" />
                      </div>
                    )
                  )}
                </div>

                <div className="absolute bottom-0 left-[52px] right-0 top-0 flex items-end justify-between gap-2">

                  {revenueData.map(
                    (item) => {
                      const height =
                        maxRevenue > 0
                          ? (item.revenue /
                              maxRevenue) *
                            100
                          : 0;

                      return (
                        <div
                          key={item.label}
                          className="flex h-full flex-1 flex-col justify-end"
                        >
                          <div className="group relative flex h-full items-end justify-center">

                            <div
                              className="w-full max-w-12 rounded-t-lg bg-white/80 transition-all duration-500 hover:bg-white"
                              style={{
                                height: `${height}%`,
                              }}
                            />

                            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#161616] px-3 py-2 text-xs shadow-xl group-hover:block">
                              ₹
                              {formatNumber(
                                item.revenue
                              )}
                              <span className="ml-2 text-white/40">
                                {item.orders} orders
                              </span>
                            </div>

                          </div>

                          <p className="mt-3 text-center text-[10px] text-white/30">
                            {item.label}
                          </p>
                        </div>
                      );
                    }
                  )}

                </div>
              </div>
            </section>

            {/* =================================================
                SECONDARY GRID
            ================================================= */}

            <div className="mb-6 grid gap-6 xl:grid-cols-2">

              {/* BEST SELLING */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.025]">

                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Menu Intelligence
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Best-Selling Dishes
                    </h2>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/35">
                    Top 5
                  </span>
                </div>

                {bestSellingDishes.length ===
                0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-white/35">
                      No completed order items yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">

                    {bestSellingDishes.map(
                      (dish) => (
                        <div
                          key={dish.name}
                          className="flex items-center gap-4 p-5"
                        >

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-white/45">
                            {String(
                              dish.rank
                            ).padStart(2, "0")}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center justify-between gap-3">

                              <div>
                                <p className="truncate text-sm font-medium">
                                  {dish.name}
                                </p>

                                <p className="mt-1 text-[11px] text-white/30">
                                  {dish.orders} items sold
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  ₹
                                  {formatNumber(
                                    dish.revenue
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-white/35">
                                  {dish.trend}% of top
                                </p>
                              </div>

                            </div>

                            <div className="mt-3 flex items-center gap-3">

                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                  className="h-full rounded-full bg-white/60"
                                  style={{
                                    width: `${
                                      bestSellingDishes[0]
                                        .revenue > 0
                                        ? (dish.revenue /
                                            bestSellingDishes[0]
                                              .revenue) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>

                              <span className="text-[10px] text-white/30">
                                {dish.orders} orders
                              </span>

                            </div>
                          </div>
                        </div>
                      )
                    )}

                  </div>
                )}
              </section>

              {/* CUSTOMER GROWTH */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Customer Intelligence
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Customer Growth
                    </h2>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {formatNumber(
                        totalCustomers
                      )}
                    </p>

                    <p className="text-[10px] text-white/40">
                      unique customers
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex h-56 items-end gap-3">

                  {customerGrowth.map(
                    (item) => {
                      const height =
                        (item.customers /
                          maxCustomers) *
                        100;

                      return (
                        <div
                          key={item.month}
                          className="flex h-full flex-1 flex-col justify-end"
                        >
                          <div className="group relative flex h-full items-end justify-center">

                            <div
                              className="w-full max-w-12 rounded-t-lg bg-white/70 transition hover:bg-white"
                              style={{
                                height: `${height}%`,
                              }}
                            />

                            <div className="absolute bottom-full mb-2 hidden -translate-y-1 rounded-lg border border-white/10 bg-[#161616] px-2 py-1 text-[10px] group-hover:block">
                              {item.customers}
                            </div>

                          </div>

                          <p className="mt-3 text-center text-[10px] text-white/30">
                            {item.month}
                          </p>
                        </div>
                      );
                    }
                  )}

                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">

                  <MiniMetric
                    label="Current"
                    value={formatNumber(
                      customerGrowth[
                        customerGrowth.length -
                          1
                      ]?.customers || 0
                    )}
                  />

                  <MiniMetric
                    label="Total"
                    value={formatNumber(
                      totalCustomers
                    )}
                  />

                  <MiniMetric
                    label="Growth"
                    value={`${customerGrowthPercent >= 0 ? "+" : ""}${customerGrowthPercent}%`}
                  />

                </div>
              </section>
            </div>

            {/* =================================================
                BOOKINGS + ORDER SOURCES
            ================================================= */}

            <div className="mb-6 grid gap-6 xl:grid-cols-3">

              {/* BOOKINGS */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6 xl:col-span-2">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Reservation Intelligence
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Booking Performance
                    </h2>

                    <p className="mt-2 text-sm text-white/35">
                      Confirmed/completed reservations
                      and guests across the last 7 days.
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {formatNumber(
                        totalBookings
                      )}
                    </p>

                    <p className="text-[10px] text-white/30">
                      bookings
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-4">

                  {bookingData.map(
                    (item) => {
                      const width =
                        (item.bookings /
                          maxBookings) *
                        100;

                      return (
                        <div
                          key={item.label}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="w-8 text-xs text-white/40">
                              {item.label}
                            </span>

                            <span className="text-xs text-white/45">
                              {item.bookings}{" "}
                              bookings ·{" "}
                              {item.guests} guests
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-white/65 transition-all"
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}

                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/30">
                    Guests
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {formatNumber(
                      totalGuests
                    )}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Across the displayed reservations
                  </p>
                </div>
              </section>

              {/* ORDER SOURCES */}

              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Order Intelligence
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Order Sources
                </h2>

                <p className="mt-2 text-xs leading-5 text-white/30">
                  Source breakdown will become available
                  when an order-source field is added to
                  the orders table.
                </p>

                <div className="mt-7 space-y-5">

                  {orderSources.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm text-white/40">
                        No source data available.
                      </p>
                    </div>
                  ) : (
                    orderSources.map(
                      (source) => (
                        <div
                          key={source.name}
                        >
                          <div className="mb-2 flex justify-between">
                            <span className="text-sm text-white/60">
                              {source.name}
                            </span>

                            <span className="text-sm font-medium">
                              {source.value}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-white/70"
                              style={{
                                width: `${source.value}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )
                  )}

                </div>

              </section>
            </div>

            {/* =================================================
                BUSINESS INSIGHTS
            ================================================= */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">

              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  AURA Intelligence
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Business Insights
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <InsightCard
                  title="Peak Day"
                  value={peakDay}
                  description="Highest order volume in the selected analytics period."
                />

                <InsightCard
                  title="Top Dish"
                  value={topDish}
                  description="Highest revenue-generating dish based on completed orders."
                />

                <InsightCard
                  title="Customer Growth"
                  value={`${customerGrowthPercent >= 0 ? "+" : ""}${customerGrowthPercent}%`}
                  description="Change in unique ordering customers compared with the previous month."
                />

              </div>

            </section>
          </>
        )}
      </div>
    </main>
  );
}

/* =====================================================
   METRIC CARD
===================================================== */

function MetricCard({
  label,
  value,
  change,
  detail,
}: {
  label: string;
  value: string;
  change: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/15">

      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-white/30">
          {label}
        </p>

        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/40">
          {change}
        </span>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/30">
        {detail}
      </p>
    </div>
  );
}

/* =====================================================
   MINI METRIC
===================================================== */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

/* =====================================================
   INSIGHT CARD
===================================================== */

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

      <p className="text-xs uppercase tracking-[0.18em] text-white/25">
        {title}
      </p>

      <p className="mt-3 text-xl font-semibold">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-white/35">
        {description}
      </p>

    </div>
  );
}
