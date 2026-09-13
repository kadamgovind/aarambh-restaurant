import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  ShoppingBag,
} from "lucide-react";

import { getActiveRestaurant } from "@/lib/restaurant";

export default async function FinalCTA() {
  const restaurant = await getActiveRestaurant();

  const restaurantName = restaurant?.name || "Aarambh Restaurant";

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#0a0a0a]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#c9a45c]/5 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-white/[0.015] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-5 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
          Make It a Delicious Moment
        </p>

        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
          Your next
          <br />
          <span className="text-white/40">meal starts here.</span>
        </h2>

        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/50 sm:text-base sm:leading-8">
          Visit {restaurantName}, explore the menu, order your favourites or
          reserve a table for your next dining experience.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/booking"
            className="group inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#c9a45c] px-7 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#dfbd78] hover:shadow-lg hover:shadow-[#c9a45c]/10 sm:w-auto"
          >
            <CalendarCheck size={16} />
            <span className="ml-2">Book a Table</span>
            <ArrowUpRight
              size={15}
              className="ml-2 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/order"
            className="group inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 text-sm font-medium text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white sm:w-auto"
          >
            <ShoppingBag size={16} />
            <span className="ml-2">Order Online</span>
            <ArrowUpRight
              size={15}
              className="ml-2 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/menu"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 px-7 text-sm font-medium text-white/45 transition-all duration-300 hover:border-[#c9a45c]/40 hover:text-[#c9a45c] sm:w-auto"
          >
            Explore Menu
          </Link>
        </div>

        <div className="mx-auto mt-14 flex items-center justify-center gap-4">
          <span
            className="h-px w-10 bg-white/10"
            aria-hidden="true"
          />

          <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-white/25 sm:text-[10px]">
            {restaurantName}
          </span>

          <span
            className="h-px w-10 bg-white/10"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}