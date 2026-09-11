"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

type Reservation = {
  id: string;
  customer: string;
  phone: string;
  date: string;
  rawDate: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  createdAt: string;
  notes?: string;
};

const filters = [
  "All",
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

function mapStatus(status: string): ReservationStatus {
  switch (status.toLowerCase()) {
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

function dbStatus(status: ReservationStatus) {
  return status.toLowerCase();
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDate(date, today)) {
    return "Today";
  }

  if (isSameDate(date, tomorrow)) {
    return "Tomorrow";
  }

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
  });
}

function formatCreatedAt(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isToday(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadReservations() {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

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

        // Find restaurant owned by logged-in user
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

        // Load reservations for this restaurant
        const { data, error: reservationsError } =
          await supabase
            .from("reservations")
            .select(
              `
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
                created_at
              `
            )
            .eq("restaurant_id", restaurant.id)
            .order("reservation_date", {
              ascending: true,
            })
            .order("reservation_time", {
              ascending: true,
            });

        if (reservationsError) {
          throw reservationsError;
        }

        if (cancelled) {
          return;
        }

        const formattedReservations: Reservation[] =
          (data || []).map((reservation) => ({
            id: reservation.id,
            customer: reservation.customer_name,
            phone: reservation.customer_phone,
            date: formatDate(reservation.reservation_date),
            rawDate: reservation.reservation_date,
            time: formatTime(reservation.reservation_time),
            guests: reservation.guests,
            status: mapStatus(reservation.status),
            createdAt: formatCreatedAt(reservation.created_at),
            notes:
              reservation.special_request ||
              undefined,
          }));

        setReservations(formattedReservations);
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        console.error(
          "Reservations loading error:",
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : "Failed to load reservations.";

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReservations();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function updateStatus(
    id: string,
    status: ReservationStatus
  ) {
    try {
      setUpdating(true);
      setError("");

      const { error } = await supabase
        .from("reservations")
        .update({
          status: dbStatus(status),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id
            ? {
                ...reservation,
                status,
              }
            : reservation
        )
      );

      setSelectedReservation((current) =>
        current && current.id === id
          ? {
              ...current,
              status,
            }
          : current
      );
    } catch (err: unknown) {
      console.error(
        "Reservation status update error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Failed to update reservation status.";

      setError(message);
    } finally {
      setUpdating(false);
    }
  }

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesFilter =
        activeFilter === "All" ||
        reservation.status === activeFilter;

      const searchValue =
        search.trim().toLowerCase();

      if (!searchValue) {
        return matchesFilter;
      }

      const matchesSearch =
        reservation.id
          .toLowerCase()
          .includes(searchValue) ||
        reservation.customer
          .toLowerCase()
          .includes(searchValue) ||
        reservation.phone
          .toLowerCase()
          .includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [reservations, activeFilter, search]);

  const pendingCount = reservations.filter(
    (reservation) =>
      reservation.status === "Pending"
  ).length;

  const confirmedCount = reservations.filter(
    (reservation) =>
      reservation.status === "Confirmed"
  ).length;

  const todayReservations = reservations.filter(
    (reservation) =>
      isToday(reservation.rawDate) &&
      reservation.status !== "Cancelled"
  );

  const todayCount = todayReservations.length;

  const totalGuestsToday = todayReservations.reduce(
    (total, reservation) =>
      total + reservation.guests,
    0
  );

  const todayLabel = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
            Table Management
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Reservations
          </h1>

          <p className="mt-3 text-sm text-white/40">
            Manage table bookings, guests and reservation status.
          </p>
        </div>

        <div className="text-sm text-white/40">
          {todayLabel}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-300">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <span>{error}</span>

            <button
              onClick={() =>
                setRefreshKey(
                  (current) => current + 1
                )
              }
              className="rounded-lg border border-red-500/20 px-4 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Today's Bookings"
          value={
            loading ? "—" : todayCount.toString()
          }
          description="Reservations today"
        />

        <SummaryCard
          label="Pending"
          value={
            loading
              ? "—"
              : pendingCount.toString()
          }
          description="Need confirmation"
        />

        <SummaryCard
          label="Confirmed"
          value={
            loading
              ? "—"
              : confirmedCount.toString()
          }
          description="Confirmed tables"
        />

        <SummaryCard
          label="Guests Today"
          value={
            loading
              ? "—"
              : totalGuestsToday.toString()
          }
          description="Expected guests"
        />
      </div>

      {/* TOOLBAR */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
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

          <div className="w-full lg:w-72">
            <input
              type="text"
              placeholder="Search customer or booking..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
            />
          </div>
        </div>
      </div>

      {/* RESERVATIONS TABLE */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {/* LOADING */}
        {loading ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />

            <div className="mt-4 text-sm text-white/40">
              Loading reservations...
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
                      Booking
                    </th>

                    <th className="px-6 py-5">
                      Customer
                    </th>

                    <th className="px-6 py-5">
                      Date & Time
                    </th>

                    <th className="px-6 py-5">
                      Guests
                    </th>

                    <th className="px-6 py-5">
                      Status
                    </th>

                    <th className="px-6 py-5" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filteredReservations.map(
                    (reservation) => (
                      <tr
                        key={reservation.id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-6">
                          <div className="max-w-[180px] truncate font-medium">
                            #{reservation.id.slice(0, 8)}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {reservation.createdAt}
                          </div>
                        </td>

                        <td className="px-6 py-6">
                          <div className="text-sm font-medium">
                            {reservation.customer}
                          </div>

                          <div className="mt-1 text-xs text-white/30">
                            {reservation.phone}
                          </div>
                        </td>

                        <td className="px-6 py-6">
                          <div className="text-sm">
                            {reservation.date}
                          </div>

                          <div className="mt-1 text-xs text-white/35">
                            {reservation.time}
                          </div>
                        </td>

                        <td className="px-6 py-6">
                          <span className="text-sm">
                            {reservation.guests}
                          </span>

                          <span className="ml-1 text-xs text-white/30">
                            guests
                          </span>
                        </td>

                        <td className="px-6 py-6">
                          <ReservationStatusBadge
                            status={
                              reservation.status
                            }
                          />
                        </td>

                        <td className="px-6 py-6 text-right">
                          <button
                            onClick={() =>
                              setSelectedReservation(
                                reservation
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
              {filteredReservations.map(
                (reservation) => (
                  <div
                    key={reservation.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">
                          #{reservation.id.slice(0, 8)}
                        </div>

                        <div className="mt-1 text-xs text-white/30">
                          {reservation.createdAt}
                        </div>
                      </div>

                      <ReservationStatusBadge
                        status={
                          reservation.status
                        }
                      />
                    </div>

                    <div className="mt-5">
                      <div className="text-sm font-medium">
                        {reservation.customer}
                      </div>

                      <div className="mt-1 text-xs text-white/30">
                        {reservation.phone}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <MiniInfo
                        label="TIME"
                        value={
                          reservation.time
                        }
                      />

                      <MiniInfo
                        label="GUESTS"
                        value={reservation.guests.toString()}
                      />

                      <MiniInfo
                        label="DATE"
                        value={reservation.date}
                      />
                    </div>

                    <button
                      onClick={() =>
                        setSelectedReservation(
                          reservation
                        )
                      }
                      className="mt-5 w-full rounded-xl border border-white/10 py-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                      View Reservation
                    </button>
                  </div>
                )
              )}
            </div>

            {filteredReservations.length ===
              0 && (
              <div className="px-6 py-20 text-center">
                <div className="text-sm text-white/40">
                  No reservations found.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL */}
      {selectedReservation && (
        <ReservationModal
          reservation={selectedReservation}
          onClose={() =>
            setSelectedReservation(null)
          }
          onStatusChange={updateStatus}
          updating={updating}
        />
      )}
    </div>
  );
}

/* ---------------------------------- */
/* SUMMARY CARD */
/* ---------------------------------- */

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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-white/30">
        {label}
      </div>

      <div className="mt-4 text-3xl font-semibold">
        {value}
      </div>

      <div className="mt-2 text-xs text-white/35">
        {description}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* MINI INFO */
/* ---------------------------------- */

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

      <div className="mt-2 text-xs text-white/70">
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* STATUS BADGE */
/* ---------------------------------- */

function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const styles: Record<
    ReservationStatus,
    string
  > = {
    Pending:
      "border-yellow-500/20 bg-yellow-500/5 text-yellow-300",
    Confirmed:
      "border-blue-500/20 bg-blue-500/5 text-blue-300",
    Completed:
      "border-green-500/20 bg-green-500/5 text-green-300",
    Cancelled:
      "border-red-500/20 bg-red-500/5 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-lg border px-3 py-1.5 text-xs ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ---------------------------------- */
/* MODAL */
/* ---------------------------------- */

function ReservationModal({
  reservation,
  onClose,
  onStatusChange,
  updating,
}: {
  reservation: Reservation;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: ReservationStatus
  ) => void;
  updating: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-white/10 p-6">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-white/30">
              Reservation
            </div>

            <h2 className="mt-2 text-xl font-semibold">
              #{reservation.id.slice(0, 8)}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-6 p-6">
          {/* STATUS */}
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/30">
              Current Status
            </div>

            <ReservationStatusBadge
              status={reservation.status}
            />
          </div>

          {/* CUSTOMER */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock
              label="Customer"
              value={reservation.customer}
            />

            <InfoBlock
              label="Phone"
              value={reservation.phone}
            />

            <InfoBlock
              label="Date"
              value={reservation.date}
            />

            <InfoBlock
              label="Time"
              value={reservation.time}
            />

            <InfoBlock
              label="Guests"
              value={reservation.guests.toString()}
            />

            <InfoBlock
              label="Booking ID"
              value={reservation.id}
            />
          </div>

          {/* NOTES */}
          {reservation.notes && (
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/30">
                Special Request
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-white/60">
                {reservation.notes}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/30">
              Update Status
            </div>

            {reservation.status ===
              "Pending" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      reservation.id,
                      "Confirmed"
                    )
                  }
                  className="rounded-xl bg-white py-3 text-xs font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating
                    ? "Updating..."
                    : "Confirm Reservation"}
                </button>

                <button
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      reservation.id,
                      "Cancelled"
                    )
                  }
                  className="rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {reservation.status ===
              "Confirmed" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      reservation.id,
                      "Completed"
                    )
                  }
                  className="rounded-xl bg-white py-3 text-xs font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating
                    ? "Updating..."
                    : "Mark Completed"}
                </button>

                <button
                  disabled={updating}
                  onClick={() =>
                    onStatusChange(
                      reservation.id,
                      "Cancelled"
                    )
                  }
                  className="rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {(reservation.status ===
              "Completed" ||
              reservation.status ===
                "Cancelled") && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-white/35">
                This reservation is closed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* INFO BLOCK */
/* ---------------------------------- */

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/25">
        {label}
      </div>

      <div className="mt-2 break-words text-sm text-white/75">
        {value}
      </div>
    </div>
  );
}