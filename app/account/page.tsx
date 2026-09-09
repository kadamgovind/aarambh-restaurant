"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
};

type Reservation = {
  id: string;
  booking_date: string;
  booking_time: string;
  guests: number;
  status: string;
};

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [error, setError] = useState("");

  /*
  ============================================================
  LOAD ACCOUNT
  ============================================================
  */

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        setLoading(true);
        setError("");

        /*
        --------------------------------------------------------
        CURRENT USER
        --------------------------------------------------------
        */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        if (!mounted) return;

        setEmail(user.email || "");

        /*
        --------------------------------------------------------
        PROFILE
        --------------------------------------------------------
        */

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, full_name, phone, role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        let currentProfile: Profile;

        /*
        --------------------------------------------------------
        CREATE PROFILE IF MISSING
        --------------------------------------------------------
        */

        if (!profileData) {
          const newProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || "",
            phone: user.user_metadata?.phone || "",
            role: "customer",
          };

          const {
            data: createdProfile,
            error: createError,
          } = await supabase
            .from("profiles")
            .insert(newProfile)
            .select("id, full_name, phone, role")
            .single();

          if (createError) {
            /*
             * A concurrent profile creation can happen during
             * registration/session initialization.
             * In that case, try reading the existing profile.
             */
            const { data: existingProfile, error: retryError } =
              await supabase
                .from("profiles")
                .select("id, full_name, phone, role")
                .eq("id", user.id)
                .maybeSingle();

            if (retryError || !existingProfile) {
              throw createError;
            }

            currentProfile = existingProfile;
          } else {
            currentProfile = createdProfile;
          }
        } else {
          currentProfile = profileData;
        }

        if (!mounted) return;

        /*
        --------------------------------------------------------
        OWNER REDIRECT
        --------------------------------------------------------
        */

        if (currentProfile.role?.toLowerCase() === "owner") {
          router.replace("/owner");
          return;
        }

        setProfile(currentProfile);

        setFullName(currentProfile.full_name || "");
        setPhone(currentProfile.phone || "");

        /*
        ========================================================
        RESERVATIONS
        ========================================================
        */

        const {
          data: reservationData,
          error: reservationError,
        } = await supabase
          .from("reservations")
          .select(
            "id, booking_date, booking_time, guests, status"
          )
          .eq("customer_id", user.id)
          .order("booking_date", {
            ascending: false,
          });

        if (reservationError) {
          console.error(
            "Reservation loading error:",
            reservationError.message
          );

          if (mounted) {
            setReservations([]);
          }
        } else if (mounted) {
          setReservations(reservationData || []);
        }

        /*
        ========================================================
        ORDERS
        ========================================================
        */

        const { data: orderData, error: orderError } =
          await supabase
            .from("orders")
            .select("id, total, status, created_at")
            .eq("customer_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (orderError) {
          console.error(
            "Order loading error:",
            orderError.message
          );

          if (mounted) {
            setOrders([]);
          }
        } else if (mounted) {
          setOrders(orderData || []);
        }
      } catch (err) {
        console.error("Account loading error:", err);

        if (!mounted) return;

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unable to load your account.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [router]);

  /*
  ============================================================
  SAVE PROFILE
  ============================================================
  */

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const cleanName = fullName.trim();
      const cleanPhone = phone.trim();

      if (!cleanName) {
        setError("Please enter your full name.");
        return;
      }

      /*
       * Do not allow the browser to decide/change the user's role.
       * The existing role remains untouched by updating only
       * customer-editable fields.
       */
      const { data: updatedProfile, error: updateError } =
        await supabase
          .from("profiles")
          .update({
            full_name: cleanName,
            phone: cleanPhone,
          })
          .eq("id", user.id)
          .select("id, full_name, phone, role")
          .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(updatedProfile);
      setFullName(updatedProfile.full_name || "");
      setPhone(updatedProfile.phone || "");

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error("Profile update error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to save your changes.");
      }
    } finally {
      setSaving(false);
    }
  }

  /*
  ============================================================
  SIGN OUT
  ============================================================
  */

  async function handleSignOut() {
    try {
      setSigningOut(true);
      setError("");

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);

      setSigningOut(false);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign out.");
      }
    }
  }

  /*
  ============================================================
  DATE
  ============================================================
  */

  function formatDate(date: string) {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(parsed);
  }

  /*
  ============================================================
  TIME
  ============================================================
  */

  function formatTime(time: string) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");

    const hour = Number(hours);

    if (Number.isNaN(hour)) {
      return time;
    }

    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${suffix}`;
  }

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center pt-24">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#c9a45c]" />

            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
              Loading your account
            </p>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  /*
  ============================================================
  ACCOUNT VALUES
  ============================================================
  */

  const displayName = fullName.trim() || "Guest";

  const firstLetter =
    displayName.charAt(0).toUpperCase() || "G";

  const upcomingReservations = reservations.filter(
    (reservation) => {
      if (
        reservation.status?.toLowerCase() === "cancelled"
      ) {
        return false;
      }

      const reservationDate = new Date(
        reservation.booking_date
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return reservationDate >= today;
    }
  );

  /*
  ============================================================
  UI
  ============================================================
  */

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* HERO */}

      <section className="border-b border-white/10 pt-32">
        <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
            Customer Account
          </p>

          <div className="mt-6 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-light tracking-tight sm:text-6xl">
                Welcome back,
                <br />

                <span className="italic text-[#c9a45c]">
                  {displayName}.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">
                Manage your profile, reservations,
                orders and dining preferences from one place.
              </p>
            </div>

            <Link
              href="/booking"
              className="inline-flex w-fit items-center gap-3 bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
            >
              Book a Table
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ACCOUNT */}

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[240px_1fr]">

          {/* SIDEBAR */}

          <aside className="border-b border-white/10 p-6 lg:min-h-[700px] lg:border-b-0 lg:border-r">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#c9a45c]/10 text-lg text-[#c9a45c]">
                {firstLetter}
              </div>

              <div>
                <p className="text-sm font-medium">
                  {displayName}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Aarambh Guest
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                ["overview", "Overview"],
                ["profile", "My Profile"],
                ["reservations", "Reservations"],
                ["orders", "Orders"],
                ["settings", "Settings"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full px-4 py-3 text-left text-sm transition ${
                    activeTab === id
                      ? "bg-white/[0.06] text-[#c9a45c]"
                      : "text-white/50 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-10 border-t border-white/10 pt-6">
              <Link
                href="/"
                className="block px-4 py-3 text-sm text-white/40 transition hover:text-white"
              >
                ← Back to Aarambh
              </Link>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="block w-full px-4 py-3 text-left text-sm text-red-300/60 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOut
                  ? "Signing Out..."
                  : "Sign Out"}
              </button>
            </div>
          </aside>

          {/* MAIN */}

          <div className="p-6 sm:p-10 lg:p-14">

            {error && (
              <div className="mb-8 border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}

            {/* =================================================
                OVERVIEW
            ================================================= */}

            {activeTab === "overview" && (
              <div>
                <div className="mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                    Overview
                  </p>

                  <h2 className="mt-3 text-3xl font-light">
                    Your Aarambh account
                  </h2>
                </div>

                <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                  <div className="bg-black p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Reservations
                    </p>

                    <p className="mt-4 text-3xl font-light">
                      {String(reservations.length).padStart(
                        2,
                        "0"
                      )}
                    </p>

                    <p className="mt-2 text-xs text-white/35">
                      Total reservations
                    </p>
                  </div>

                  <div className="bg-black p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                      Orders
                    </p>

                    <p className="mt-4 text-3xl font-light">
                      {String(orders.length).padStart(
                        2,
                        "0"
                      )}
                    </p>

                    <p className="mt-2 text-xs text-white/35">
                      Orders placed
                    </p>
                  </div>
                </div>

                {/* UPCOMING */}

                <div className="mt-12">
                  <div className="mb-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                        Upcoming
                      </p>

                      <h3 className="mt-2 text-2xl font-light">
                        Your next reservation
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        setActiveTab("reservations")
                      }
                      className="text-xs text-[#c9a45c]"
                    >
                      View all →
                    </button>
                  </div>

                  {upcomingReservations.length > 0 ? (
                    <div className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                      {(() => {
                        const reservation =
                          upcomingReservations[0];

                        return (
                          <>
                            <div className="grid gap-8 sm:grid-cols-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                  Date
                                </p>

                                <p className="mt-3 text-lg">
                                  {formatDate(
                                    reservation.booking_date
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                  Time
                                </p>

                                <p className="mt-3 text-lg">
                                  {formatTime(
                                    reservation.booking_time
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                  Guests
                                </p>

                                <p className="mt-3 text-lg">
                                  {reservation.guests} Guests
                                </p>
                              </div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                              <span className="border border-[#c9a45c]/30 bg-[#c9a45c]/10 px-3 py-2 text-xs capitalize text-[#c9a45c]">
                                {reservation.status}
                              </span>

                              <Link
                                href="/booking"
                                className="border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
                              >
                                Manage Reservation
                              </Link>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="border border-white/10 bg-white/[0.02] p-8">
                      <p className="text-sm text-white/50">
                        You don&apos;t have any upcoming
                        reservations.
                      </p>

                      <Link
                        href="/booking"
                        className="mt-6 inline-flex bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                      >
                        Book a Table →
                      </Link>
                    </div>
                  )}
                </div>

                {/* QUICK ACTIONS */}

                <div className="mt-12">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                    Quick Actions
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <Link
                      href="/menu"
                      className="border border-white/10 p-6 transition hover:border-[#c9a45c]/40"
                    >
                      <span className="text-2xl">◈</span>

                      <h3 className="mt-5 text-lg font-light">
                        Explore Menu
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-white/35">
                        Discover signature dishes.
                      </p>
                    </Link>

                    <Link
                      href="/order"
                      className="border border-white/10 p-6 transition hover:border-[#c9a45c]/40"
                    >
                      <span className="text-2xl">＋</span>

                      <h3 className="mt-5 text-lg font-light">
                        Order Online
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-white/35">
                        Order your favourites.
                      </p>
                    </Link>

                    <Link
                      href="/gallery"
                      className="border border-white/10 p-6 transition hover:border-[#c9a45c]/40"
                    >
                      <span className="text-2xl">◇</span>

                      <h3 className="mt-5 text-lg font-light">
                        Explore Aarambh
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-white/35">
                        Discover our dining experience.
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                PROFILE
            ================================================= */}

            {activeTab === "profile" && (
              <div>
                <div className="mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                    Personal Information
                  </p>

                  <h2 className="mt-3 text-3xl font-light">
                    My Profile
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40"
                    >
                      Full Name
                    </label>

                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="Enter your full name"
                      className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm outline-none transition focus:border-[#c9a45c]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full cursor-not-allowed border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/40 outline-none"
                    />

                    <p className="mt-2 text-xs text-white/25">
                      Email is managed through your secure
                      Aarambh account.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40"
                    >
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="Enter your phone number"
                      className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm outline-none transition focus:border-[#c9a45c]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                      Account Type
                    </label>

                    <div className="w-full border border-white/10 bg-white/[0.02] px-4 py-4 text-sm capitalize text-white/50">
                      {profile?.role || "customer"}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : saved
                        ? "Changes Saved ✓"
                        : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* =================================================
                RESERVATIONS
            ================================================= */}

            {activeTab === "reservations" && (
              <div>
                <div className="mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                    Dining
                  </p>

                  <h2 className="mt-3 text-3xl font-light">
                    Reservations
                  </h2>
                </div>

                {reservations.length === 0 ? (
                  <div className="border border-white/10 bg-white/[0.02] p-8">
                    <p className="text-sm text-white/50">
                      No reservations found.
                    </p>

                    <Link
                      href="/booking"
                      className="mt-6 inline-flex bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                    >
                      Make a Reservation →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border border-white/10 bg-white/[0.02] p-6"
                      >
                        <div className="grid gap-6 sm:grid-cols-4 sm:items-center">
                          <div>
                            <p className="text-xs text-white/30">
                              Date
                            </p>

                            <p className="mt-2 text-sm">
                              {formatDate(
                                reservation.booking_date
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-white/30">
                              Time
                            </p>

                            <p className="mt-2 text-sm">
                              {formatTime(
                                reservation.booking_time
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-white/30">
                              Guests
                            </p>

                            <p className="mt-2 text-sm">
                              {reservation.guests} Guests
                            </p>
                          </div>

                          <div>
                            <span className="inline-block bg-white/[0.05] px-3 py-2 text-xs capitalize text-white/50">
                              {reservation.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                ORDERS
            ================================================= */}

            {activeTab === "orders" && (
              <div>
                <div className="mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                    Delivery
                  </p>

                  <h2 className="mt-3 text-3xl font-light">
                    Order History
                  </h2>
                </div>

                {orders.length === 0 ? (
                  <div className="border border-white/10 bg-white/[0.02] p-8">
                    <p className="text-sm text-white/50">
                      Your order history will appear here
                      once you place an order.
                    </p>

                    <Link
                      href="/order"
                      className="mt-6 inline-flex border border-white/10 px-6 py-4 text-sm text-white/70 transition hover:border-[#c9a45c]/40 hover:text-[#c9a45c]"
                    >
                      Order Online →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-white/10 bg-white/[0.02] p-6"
                      >
                        <div className="flex flex-col justify-between gap-6 sm:flex-row">
                          <div>
                            <p className="text-sm text-[#c9a45c]">
                              Order
                            </p>

                            <p className="mt-2 text-xs text-white/35">
                              {formatDate(order.created_at)}
                            </p>

                            <p className="mt-4 text-sm text-white/60">
                              Order #{order.id.slice(0, 8)}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-lg font-light">
                              ₹
                              {Number(order.total).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <span className="mt-3 inline-block bg-white/[0.05] px-3 py-2 text-xs capitalize text-white/40">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                SETTINGS
            ================================================= */}

            {activeTab === "settings" && (
              <div>
                <div className="mb-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                    Account Preferences
                  </p>

                  <h2 className="mt-3 text-3xl font-light">
                    Settings
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="border border-white/10 p-5">
                    <p className="text-sm">
                      Password & Security
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Change your password using the secure
                      account recovery flow.
                    </p>

                    <Link
                      href="/forgot-password"
                      className="mt-5 inline-flex border border-white/10 px-4 py-3 text-xs text-white/60 transition hover:border-[#c9a45c]/40 hover:text-[#c9a45c]"
                    >
                      Change Password →
                    </Link>
                  </div>

                  <div className="border border-red-400/10 p-5">
                    <p className="text-sm text-red-300">
                      Danger Zone
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Account deletion requires a secure
                      server-side implementation and is not
                      enabled yet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}