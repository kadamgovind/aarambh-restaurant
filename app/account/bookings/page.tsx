"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
  Clock3,
  Users,
  Phone,
  MapPin,
  ChevronLeft,
  CalendarCheck2,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type Reservation = {
  id: string;
  restaurant_id: string;
  customer_id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  customer_name: string;
  customer_phone: string;
  special_request: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  restaurant?: {
    id: string;
    name: string;
    logo_url: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getReservationDateTime(reservation: Reservation) {
  return new Date(
    `${reservation.reservation_date}T${reservation.reservation_time}`
  ).getTime();
}

function getStatusLabel(status: ReservationStatus) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function getStatusClasses(status: ReservationStatus) {
  switch (status) {
    case "confirmed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "completed":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

export default function AccountBookingsPage() {

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBookings() {
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
            setReservations([]);
            setError("Please sign in to view your bookings.");
          }
          return;
        }

        const { data, error: reservationError } = await supabase
          .from("reservations")
          .select(`
            id,
            restaurant_id,
            customer_id,
            reservation_date,
            reservation_time,
            guests,
            customer_name,
            customer_phone,
            special_request,
            status,
            created_at,
            updated_at,
            restaurant:restaurants (
              id,
              name,
              logo_url,
              address,
              city,
              state
            )
          `)
          .eq("customer_id", user.id)
          .order("reservation_date", { ascending: false })
          .order("reservation_time", { ascending: false });

        if (reservationError) {
          throw reservationError;
        }

        if (mounted) {
          setReservations((data ?? []) as unknown as Reservation[]);
        }
      } catch (err) {
        console.error("Failed to load bookings:", err);

        if (mounted) {
          setError(
            "We couldn't load your bookings right now. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const now = Date.now();

  const upcomingBookings = useMemo(() => {
    return reservations
      .filter(
        (reservation) =>
          reservation.status !== "cancelled" &&
          getReservationDateTime(reservation) >= now
      )
      .sort(
        (a, b) =>
          getReservationDateTime(a) - getReservationDateTime(b)
      );
  }, [reservations, now]);

  const pastBookings = useMemo(() => {
    return reservations
      .filter(
        (reservation) =>
          reservation.status === "completed" ||
          reservation.status === "cancelled" ||
          getReservationDateTime(reservation) < now
      )
      .sort(
        (a, b) =>
          getReservationDateTime(b) - getReservationDateTime(a)
      );
  }, [reservations, now]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#c9a45c]" />
            <p className="text-sm text-white/60">
              Loading your bookings...
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
            <ChevronLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />

            <h1 className="text-xl font-semibold">
              Unable to load bookings
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
            <ChevronLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/10">
                  <CalendarCheck2 className="h-5 w-5 text-[#c9a45c]" />
                </div>

                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
                  Reservations
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                My Bookings
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                View and manage your restaurant table reservations.
              </p>
            </div>

            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b56d]"
            >
              <CalendarDays className="h-4 w-4" />
              Book a Table
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {reservations.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a45c]/20 bg-[#c9a45c]/10">
              <UtensilsCrossed className="h-7 w-7 text-[#c9a45c]" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No bookings yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
              You haven't made any table reservations yet. Reserve a table
              and your booking will appear here.
            </p>

            <Link
              href="/booking"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b56d]"
            >
              Make a Reservation
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {upcomingBookings.length > 0 && (
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">
                    Upcoming Bookings
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Your upcoming table reservations.
                  </p>
                </div>

                <div className="space-y-4">
                  {upcomingBookings.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                    />
                  ))}
                </div>
              </section>
            )}

            {pastBookings.length > 0 && (
              <section>
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">
                    Booking History
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Your completed and previous reservations.
                  </p>
                </div>

                <div className="space-y-4">
                  {pastBookings.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
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

function ReservationCard({
  reservation,
  muted = false,
}: {
  reservation: Reservation;
  muted?: boolean;
}) {
  const restaurant = reservation.restaurant;

  const addressParts = [
    restaurant?.address,
    restaurant?.city,
    restaurant?.state,
  ].filter(Boolean);

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition ${
        muted ? "opacity-80" : "hover:border-white/20"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {restaurant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name || "Restaurant"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="h-5 w-5 text-[#c9a45c]" />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-white">
                {restaurant?.name || "Aarambh Restaurant"}
              </h3>

              {addressParts.length > 0 && (
                <div className="mt-1 flex items-start gap-1.5 text-xs text-white/45">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{addressParts.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClasses(
              reservation.status
            )}`}
          >
            {getStatusLabel(reservation.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <CalendarDays className="mb-2 h-4 w-4 text-[#c9a45c]" />
            <p className="text-xs text-white/40">Date</p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(reservation.reservation_date)}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <Clock3 className="mb-2 h-4 w-4 text-[#c9a45c]" />
            <p className="text-xs text-white/40">Time</p>
            <p className="mt-1 text-sm font-medium">
              {formatTime(reservation.reservation_time)}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <Users className="mb-2 h-4 w-4 text-[#c9a45c]" />
            <p className="text-xs text-white/40">Guests</p>
            <p className="mt-1 text-sm font-medium">
              {reservation.guests}{" "}
              {reservation.guests === 1 ? "Guest" : "Guests"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-white/40">Booking ID</p>
            <p className="font-mono text-xs text-white/60">
              {reservation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/45">
            {reservation.customer_phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {reservation.customer_phone}
              </span>
            )}

            {reservation.special_request && (
              <span className="max-w-xs truncate">
                Special request: {reservation.special_request}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}