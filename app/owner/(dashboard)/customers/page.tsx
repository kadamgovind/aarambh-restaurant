"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  reservations: number;
  spent: number;
  lastOrder: string;
  joined: string;
  status: "Active" | "Inactive";
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        /* =====================================================
           AUTHENTICATED OWNER
        ===================================================== */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("Owner is not logged in.");
        }

        /* =====================================================
           OWNER RESTAURANT
        ===================================================== */

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
            "No restaurant found for this owner."
          );
        }

        /* =====================================================
           ORDERS
        ===================================================== */

        const { data: orders, error: ordersError } =
          await supabase
            .from("orders")
            .select(
              `
                id,
                customer_id,
                total,
                created_at,
                restaurant_id
              `
            )
            .eq("restaurant_id", restaurant.id)
            .order("created_at", {
              ascending: false,
            });

        if (ordersError) {
          throw ordersError;
        }

        /* =====================================================
           RESERVATIONS
        ===================================================== */

        const {
          data: reservations,
          error: reservationsError,
        } = await supabase
          .from("reservations")
          .select(
            `
              id,
              customer_id,
              created_at,
              restaurant_id
            `
          )
          .eq("restaurant_id", restaurant.id)
          .order("created_at", {
            ascending: false,
          });

        if (reservationsError) {
          throw reservationsError;
        }

        /* =====================================================
           CUSTOMER IDS
        ===================================================== */

        const customerIds = Array.from(
          new Set(
            [
              ...(orders || []).map(
                (order) => order.customer_id
              ),
              ...(reservations || []).map(
                (reservation) =>
                  reservation.customer_id
              ),
            ].filter(
              (id): id is string => Boolean(id)
            )
          )
        );

        if (customerIds.length === 0) {
          if (!cancelled) {
            setCustomers([]);
          }

          return;
        }

        /* =====================================================
           PROFILES
        ===================================================== */

        const {
          data: profiles,
          error: profilesError,
        } = await supabase
          .from("profiles")
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

        if (cancelled) {
          return;
        }

        /* =====================================================
           BUILD PROFILE MAP
        ===================================================== */

        const profileMap = new Map<
          string,
          ProfileRow
        >();

        (profiles || []).forEach((profile) => {
          profileMap.set(profile.id, profile);
        });

        const customerMap = new Map<
          string,
          Customer
        >();

        /* =====================================================
           ADD CUSTOMERS FROM ORDERS
        ===================================================== */

        (orders || []).forEach((order) => {
          if (!order.customer_id) {
            return;
          }

          const profile = profileMap.get(
            order.customer_id
          );

          const existing = customerMap.get(
            order.customer_id
          );

          if (!existing) {
            customerMap.set(order.customer_id, {
              id: order.customer_id,
              name:
                profile?.full_name ||
                "Unknown Customer",
              phone: profile?.phone || "—",
              email: "—",
              orders: 1,
              reservations: 0,
              spent: Number(order.total || 0),
              lastOrder: formatDateTime(
                order.created_at
              ),
              joined: formatJoinedDate(
                order.created_at
              ),
              status: getCustomerStatus(
                order.created_at
              ),
            });
          } else {
            existing.orders += 1;
            existing.spent += Number(
              order.total || 0
            );

            if (
              new Date(order.created_at) >
              new Date(
                getDateFromFormattedString(
                  existing.lastOrder
                )
              )
            ) {
              existing.lastOrder =
                formatDateTime(
                  order.created_at
                );

              existing.status =
                getCustomerStatus(
                  order.created_at
                );
            }
          }
        });

        /* =====================================================
           ADD CUSTOMERS FROM RESERVATIONS
        ===================================================== */

        (reservations || []).forEach(
          (reservation) => {
            if (!reservation.customer_id) {
              return;
            }

            const profile = profileMap.get(
              reservation.customer_id
            );

            const existing =
              customerMap.get(
                reservation.customer_id
              );

            if (!existing) {
              customerMap.set(
                reservation.customer_id,
                {
                  id: reservation.customer_id,
                  name:
                    profile?.full_name ||
                    "Unknown Customer",
                  phone: profile?.phone || "—",
                  email: "—",
                  orders: 0,
                  reservations: 1,
                  spent: 0,
                  lastOrder: "No orders yet",
                  joined: formatJoinedDate(
                    reservation.created_at
                  ),
                  status: getCustomerStatus(
                    reservation.created_at
                  ),
                }
              );
            } else {
              existing.reservations += 1;
            }
          }
        );

        /* =====================================================
           SORT CUSTOMERS
        ===================================================== */

        const finalCustomers = Array.from(
          customerMap.values()
        ).sort((a, b) => {
          if (
            a.status === "Active" &&
            b.status !== "Active"
          ) {
            return -1;
          }

          if (
            a.status !== "Active" &&
            b.status === "Active"
          ) {
            return 1;
          }

          return a.name.localeCompare(b.name);
        });

        if (!cancelled) {
          setCustomers(finalCustomers);
        }
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        console.error(
          "Customers loading error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Failed to load customers.";

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredCustomers = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          .toLowerCase()
          .includes(value) ||
        customer.phone
          .toLowerCase()
          .includes(value) ||
        customer.email
          .toLowerCase()
          .includes(value) ||
        customer.id
          .toLowerCase()
          .includes(value)
    );
  }, [customers, search]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalCustomers =
    customers.length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.status === "Active"
    ).length;

  const totalRevenue =
    customers.reduce(
      (total, customer) =>
        total + customer.spent,
      0
    );

  const totalOrders =
    customers.reduce(
      (total, customer) =>
        total + customer.orders,
      0
    );

  return (
    <div className="mx-auto max-w-7xl">
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
            Customer Management
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Customers
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Understand your customers, their orders,
            reservations and spending activity.
          </p>
        </div>

        <div className="text-sm text-white/40">
          {loading
            ? "Loading..."
            : `${totalCustomers} Customers`}
        </div>
      </div>

      {/* =====================================================
         ERROR
      ===================================================== */}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm text-red-300">
                Unable to load customers
              </div>

              <div className="mt-1 text-xs text-red-300/60">
                {error}
              </div>
            </div>

            <button
              onClick={() =>
                setRefreshKey(
                  (current) => current + 1
                )
              }
              className="rounded-xl border border-red-500/20 px-4 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
         SUMMARY
      ===================================================== */}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Customers"
          value={
            loading
              ? "—"
              : totalCustomers.toString()
          }
          description="Registered customers"
        />

        <SummaryCard
          label="Active Customers"
          value={
            loading
              ? "—"
              : activeCustomers.toString()
          }
          description="Recently active"
        />

        <SummaryCard
          label="Total Orders"
          value={
            loading
              ? "—"
              : totalOrders.toString()
          }
          description="Across all customers"
        />

        <SummaryCard
          label="Customer Revenue"
          value={
            loading
              ? "—"
              : `₹${totalRevenue.toLocaleString(
                  "en-IN"
                )}`
          }
          description="Total customer spending"
        />
      </div>

      {/* =====================================================
         SEARCH
      ===================================================== */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <input
          type="text"
          placeholder="Search by name, phone, email or customer ID..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
        />
      </div>

      {/* =====================================================
         CUSTOMER TABLE
      ===================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />

            <div className="mt-4 text-sm text-white/40">
              Loading customers...
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
               DESKTOP
            ================================================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/30">
                  <tr>
                    <th className="px-6 py-5">
                      Customer
                    </th>

                    <th className="px-6 py-5">
                      Orders
                    </th>

                    <th className="px-6 py-5">
                      Reservations
                    </th>

                    <th className="px-6 py-5">
                      Total Spent
                    </th>

                    <th className="px-6 py-5">
                      Last Order
                    </th>

                    <th className="px-6 py-5">
                      Status
                    </th>

                    <th className="px-6 py-5" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        {/* CUSTOMER */}

                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                              {getInitials(
                                customer.name
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-medium">
                                {customer.name}
                              </div>

                              <div className="mt-1 text-xs text-white/30">
                                {customer.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ORDERS */}

                        <td className="px-6 py-6">
                          <div className="text-sm">
                            {customer.orders}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            orders
                          </div>
                        </td>

                        {/* RESERVATIONS */}

                        <td className="px-6 py-6">
                          <div className="text-sm">
                            {customer.reservations}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            bookings
                          </div>
                        </td>

                        {/* SPENT */}

                        <td className="px-6 py-6">
                          <div className="text-sm font-medium">
                            ₹
                            {customer.spent.toLocaleString(
                              "en-IN"
                            )}
                          </div>
                        </td>

                        {/* LAST ORDER */}

                        <td className="px-6 py-6">
                          <div className="text-xs text-white/50">
                            {customer.lastOrder}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-6">
                          <CustomerStatus
                            status={
                              customer.status
                            }
                          />
                        </td>

                        {/* VIEW */}

                        <td className="px-6 py-6 text-right">
                          <button
                            onClick={() =>
                              setSelectedCustomer(
                                customer
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

            {/* =================================================
               MOBILE
            ================================================= */}

            <div className="divide-y divide-white/10 lg:hidden">
              {filteredCustomers.map(
                (customer) => (
                  <div
                    key={customer.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                          {getInitials(
                            customer.name
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-medium">
                            {customer.name}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {customer.phone}
                          </div>
                        </div>
                      </div>

                      <CustomerStatus
                        status={
                          customer.status
                        }
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <MiniInfo
                        label="ORDERS"
                        value={customer.orders.toString()}
                      />

                      <MiniInfo
                        label="BOOKINGS"
                        value={customer.reservations.toString()}
                      />

                      <MiniInfo
                        label="SPENT"
                        value={`₹${customer.spent.toLocaleString(
                          "en-IN"
                        )}`}
                      />
                    </div>

                    <button
                      onClick={() =>
                        setSelectedCustomer(
                          customer
                        )
                      }
                      className="mt-5 w-full rounded-xl border border-white/10 py-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                      View Customer
                    </button>
                  </div>
                )
              )}
            </div>

            {filteredCustomers.length ===
              0 && (
              <div className="px-6 py-20 text-center">
                <div className="text-sm text-white/40">
                  No customers found.
                </div>

                <div className="mt-2 text-xs text-white/25">
                  Try another name or phone number.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =====================================================
         CUSTOMER MODAL
      ===================================================== */}

      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() =>
            setSelectedCustomer(null)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

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

/* =========================================================
   CUSTOMER STATUS
========================================================= */

function CustomerStatus({
  status,
}: {
  status: Customer["status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] ${
        status === "Active"
          ? "border-green-400/20 bg-green-400/10 text-green-300"
          : "border-white/10 bg-white/5 text-white/35"
      }`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[9px] tracking-[0.15em] text-white/25">
        {label}
      </div>

      <div className="mt-2 text-xs text-white/60">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER MODAL
========================================================= */

function CustomerModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0d0d]"
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
              {getInitials(customer.name)}
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                Customer
              </div>

              <h2 className="mt-1 text-xl font-semibold">
                {customer.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* CONTACT */}

        <div className="border-b border-white/10 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Contact Information
          </div>

          <div className="mt-5 space-y-4">
            <ContactRow
              label="Phone"
              value={customer.phone}
            />

            <ContactRow
              label="Email"
              value={customer.email}
            />

            <ContactRow
              label="Customer ID"
              value={customer.id}
            />
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 border-b border-white/10">
          <DetailStat
            label="Orders"
            value={customer.orders.toString()}
          />

          <DetailStat
            label="Reservations"
            value={customer.reservations.toString()}
          />

          <DetailStat
            label="Total Spent"
            value={`₹${customer.spent.toLocaleString(
              "en-IN"
            )}`}
          />

          <DetailStat
            label="Status"
            value={customer.status}
          />
        </div>

        {/* ACTIVITY */}

        <div className="border-b border-white/10 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Activity
          </div>

          <div className="mt-5 space-y-4">
            <ActivityRow
              title="Last Order"
              value={customer.lastOrder}
            />

            <ActivityRow
              title="Customer Since"
              value={customer.joined}
            />
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap gap-2 p-6">
          <button className="rounded-xl bg-white px-5 py-3 text-xs font-medium text-black">
            View Orders
          </button>

          <button className="rounded-xl border border-white/10 px-5 py-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white">
            View Reservations
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL STAT
========================================================= */

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-r border-white/10 p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
        {label}
      </div>

      <div className="mt-3 text-lg font-medium">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   CONTACT ROW
========================================================= */

function ContactRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="text-right text-sm text-white/65">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   ACTIVITY ROW
========================================================= */

function ActivityRow({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="text-sm text-white/50">
        {title}
      </div>

      <div className="text-right text-xs text-white/60">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CU"
  );
}

/* =========================================================
   DATE/TIME HELPERS
========================================================= */

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatJoinedDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCustomerStatus(
  dateString: string
): Customer["status"] {
  const date = new Date(dateString);
  const now = new Date();

  const diff =
    now.getTime() - date.getTime();

  const days =
    diff / (1000 * 60 * 60 * 24);

  return days <= 30
    ? "Active"
    : "Inactive";
}

/*
  Used only for comparing the formatted
  last-order date when multiple orders exist.
*/
function getDateFromFormattedString(
  value: string
) {
  if (value === "No orders yet") {
    return new Date(0).toISOString();
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date(0).toISOString();
}