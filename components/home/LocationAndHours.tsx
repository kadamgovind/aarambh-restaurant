import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Phone } from "lucide-react";

import { getActiveRestaurant } from "@/lib/restaurant";

type OpeningDay = {
  key: string;
  label: string;
};

const openingDays: OpeningDay[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function formatTime(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return text;
  }

  const hours = Number(match[1]);
  const minutes = match[2];

  if (hours > 23) {
    return text;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function getDayHours(
  openingHours: Record<string, unknown>,
  day: string
): string {
  const value = openingHours[day];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object") {
          const item = entry as Record<string, unknown>;
          const open = formatTime(item.open ?? item.opening);
          const close = formatTime(item.close ?? item.closing);

          if (open && close) {
            return `${open} – ${close}`;
          }

          if (open) {
            return `From ${open}`;
          }

          if (close) {
            return `Until ${close}`;
          }
        }

        return null;
      })
      .filter(Boolean);

    return parts.length > 0 ? parts.join(" / ") : "Hours unavailable";
  }

  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;

    if (item.closed === true || item.is_closed === true) {
      return "Closed";
    }

    const open = formatTime(item.open ?? item.opening ?? item.from);
    const close = formatTime(item.close ?? item.closing ?? item.to);

    if (open && close) {
      return `${open} – ${close}`;
    }

    if (open) {
      return `From ${open}`;
    }

    if (close) {
      return `Until ${close}`;
    }

    if (typeof item.label === "string") {
      return item.label;
    }

    if (typeof item.hours === "string") {
      return item.hours;
    }
  }

  return "Hours unavailable";
}

export default async function LocationAndHours() {
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return null;
  }

  const fullAddress = [
    restaurant.address,
    restaurant.city,
    restaurant.state,
    restaurant.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const phoneHref = restaurant.phone
    ? `tel:${restaurant.phone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-7 sm:p-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a45c]/30 text-[#c9a45c]">
              <MapPin size={19} strokeWidth={1.5} />
            </div>

            <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Visit Us
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Come dine with us.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/50">
              We would love to welcome you at {restaurant.name}.
              {fullAddress
                ? " Find us at the address below."
                : " Contact us for our current location details."}
            </p>

            {fullAddress && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm leading-6 text-white/75">
                  {fullAddress}
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {restaurant.maps_url && (
                <a
                  href={restaurant.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-11 items-center justify-center rounded-full bg-[#c9a45c] px-5 text-xs font-semibold text-black transition-all duration-300 hover:bg-[#dfbd78]"
                >
                  Get Directions
                  <ArrowUpRight
                    size={15}
                    className="ml-2 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              )}

              {phoneHref && (
                <a
                  href={phoneHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-medium text-white/65 transition-colors hover:border-[#c9a45c]/50 hover:text-[#c9a45c]"
                >
                  <Phone size={14} />
                  Call Restaurant
                </a>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-7 sm:p-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-[#c9a45c]">
              <Clock3 size={19} strokeWidth={1.5} />
            </div>

            <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Opening Hours
            </p>

            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              Plan your visit.
            </h3>

            <div className="mt-8 border-t border-white/10">
              {openingDays.map((day) => (
                <div
                  key={day.key}
                  className="flex items-center justify-between gap-5 border-b border-white/10 py-4"
                >
                  <span className="text-sm text-white/65">
                    {day.label}
                  </span>

                  <span className="text-right text-xs text-white/40">
                    {getDayHours(restaurant.opening_hours, day.key)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 text-xs font-medium text-[#c9a45c] transition-colors hover:text-white"
              >
                Reserve a Table
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}