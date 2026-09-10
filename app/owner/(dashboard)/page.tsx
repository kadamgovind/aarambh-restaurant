"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  restaurant_status: string;
};

type DashboardStats = {
  todayOrders: number;
  todayReservations: number;
  todayRevenue: number;
  totalCustomers: number;
};

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayReservations: 0,
    todayRevenue: 0,
    totalCustomers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/owner/login");
          return;
        }

        const { data: restaurantData, error: restaurantError } =
          await supabase
            .from("restaurants")
            .select(
              "id, name, slug, restaurant_status"
            )
            .eq("owner_id", user.id)
            .maybeSingle();

        if (restaurantError) {
          throw new Error(
            restaurantError.message
          );
        }

        if (!restaurantData) {
          if (mounted) {
            setRestaurant(null);
            setLoading(false);
          }

          return;
        }

        if (mounted) {
          setRestaurant(restaurantData);
        }

        const today = new Date();

        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const startOfTomorrow = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );

        const startISO =
          startOfToday.toISOString();

        const tomorrowISO =
          startOfTomorrow.toISOString();

        const [
          ordersResult,
          reservationsResult,
          customersResult,
        ] = await Promise.all([
          supabase
            .from("orders")
            .select("id, total_amount")
            .eq("restaurant_id", restaurantData.id)
            .gte("created_at", startISO)
            .lt("created_at", tomorrowISO),

          supabase
            .from("reservations")
            .select("id")
            .eq(
              "restaurant_id",
              restaurantData.id
            )
            .eq(
              "reservation_date",
              today
                .toISOString()
                .split("T")[0]
            ),

          supabase
            .from("orders")
            .select("customer_id")
            .eq("restaurant_id", restaurantData.id),
        ]);

        if (ordersResult.error) {
          throw new Error(
            ordersResult.error.message
          );
        }

        if (reservationsResult.error) {
          throw new Error(
            reservationsResult.error.message
          );
        }

        if (customersResult.error) {
          throw new Error(
            customersResult.error.message
          );
        }

        const todayOrders =
          ordersResult.data?.length ?? 0;

        const todayRevenue =
          ordersResult.data?.reduce(
            (sum, order) =>
              sum +
              Number(order.total_amount ?? 0),
            0
          ) ?? 0;

        const todayReservations =
          reservationsResult.data?.length ?? 0;

        const customerIds = new Set(
          (customersResult.data ?? []).map(
            (order) => order.customer_id
          )
        );

        if (mounted) {
          setStats({
            todayOrders,
            todayReservations,
            todayRevenue,
            totalCustomers: customerIds.size,
          });
        }
      } catch (err) {
        console.error(
          "Owner dashboard error:",
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load owner dashboard."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await supabase.auth.signOut();

      router.replace("/owner/login");
      router.refresh();
    } catch (err) {
      console.error(
        "Owner logout error:",
        err
      );

      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
            Loading dashboard
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-red-300">
            Dashboard Error
          </p>

          <h1 className="mt-4 text-2xl font-light">
            Unable to load dashboard
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/45">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-7 rounded-xl bg-[#c9a45c] px-6 py-3 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12 sm:px-10">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c9a45c]/20 bg-[#c9a45c]/5">
              <Store
                size={28}
                className="text-[#c9a45c]"
              />
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
              Restaurant Setup
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
              Connect your restaurant
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45">
              Your owner account is ready, but no restaurant
              is connected to it yet. Complete your restaurant
              setup to start managing your business.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/owner/restaurant/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
              >
                Create Restaurant
                <ChevronRight size={17} />
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-4 text-sm text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                <LogOut size={17} />
                {loggingOut
                  ? "Signing Out..."
                  : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/owner",
      icon: LayoutDashboard,
    },
    {
      name: "Orders",
      href: "/owner/orders",
      icon: ShoppingBag,
    },
    {
      name: "Reservations",
      href: "/owner/reservations",
      icon: CalendarDays,
    },
    {
      name: "Menu",
      href: "/owner/menu",
      icon: Menu,
    },
    {
      name: "Customers",
      href: "/owner/customers",
      icon: Users,
    },
    {
      name: "Analytics",
      href: "/owner/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/owner/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-[#c9a45c]">
              AARAMBH
            </p>

            <p className="mt-1 text-xs text-white/35">
              Restaurant Management
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <LogOut size={15} />
            {loggingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">
            Owner Dashboard
          </p>

          <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
                {restaurant.name}
              </h1>

              <p className="mt-3 text-sm text-white/40">
                Manage your restaurant operations from one
                place.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/45">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              {restaurant.restaurant_status}
            </div>
          </div>
        </div>

        <nav className="mb-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/50 transition hover:border-[#c9a45c]/30 hover:bg-[#c9a45c]/[0.04] hover:text-white"
              >
                <Icon
                  size={17}
                  className="text-white/35 transition group-hover:text-[#c9a45c]"
                />

                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's Orders"
            value={stats.todayOrders.toString()}
            icon={<ShoppingBag size={19} />}
          />

          <StatCard
            label="Today's Revenue"
            value={`₹${stats.todayRevenue.toLocaleString(
              "en-IN"
            )}`}
            icon={<IndianRupee size={19} />}
          />

          <StatCard
            label="Today's Reservations"
            value={stats.todayReservations.toString()}
            icon={<CalendarDays size={19} />}
          />

          <StatCard
            label="Customers"
            value={stats.totalCustomers.toString()}
            icon={<Users size={19} />}
          />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <ClipboardList
                size={20}
                className="text-[#c9a45c]"
              />

              <h2 className="text-lg font-medium">
                Quick Actions
              </h2>
            </div>

            <div className="mt-6 space-y-3">
              <QuickLink
                href="/owner/menu"
                title="Manage Menu"
                description="Add and manage menu items."
              />

              <QuickLink
                href="/owner/orders"
                title="View Orders"
                description="Manage incoming customer orders."
              />

              <QuickLink
                href="/owner/reservations"
                title="Manage Reservations"
                description="Review and manage table bookings."
              />

              <QuickLink
                href="/owner/settings"
                title="Restaurant Settings"
                description="Update restaurant information."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Store
                size={20}
                className="text-[#c9a45c]"
              />

              <h2 className="text-lg font-medium">
                Restaurant
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <InfoRow
                label="Name"
                value={restaurant.name}
              />

              <InfoRow
                label="Slug"
                value={restaurant.slug}
              />

              <InfoRow
                label="Status"
                value={restaurant.restaurant_status}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c9a45c]/20 bg-[#c9a45c]/5 text-[#c9a45c]">
        {icon}
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/30">
        {label}
      </p>

      <p className="mt-2 text-3xl font-light">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.015] p-4 transition hover:border-[#c9a45c]/25 hover:bg-[#c9a45c]/[0.03]"
    >
      <div>
        <p className="text-sm text-white transition group-hover:text-[#c9a45c]">
          {title}
        </p>

        <p className="mt-1 text-xs text-white/30">
          {description}
        </p>
      </div>

      <ChevronRight
        size={17}
        className="text-white/20 transition group-hover:text-[#c9a45c]"
      />
    </Link>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/10 pb-4 last:border-b-0">
      <span className="text-xs uppercase tracking-[0.15em] text-white/30">
        {label}
      </span>

      <span className="text-right text-sm text-white/65">
        {value}
      </span>
    </div>
  );
}