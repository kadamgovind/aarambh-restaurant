import Link from "next/link";

import { getActiveRestaurant } from "@/lib/restaurant";

export default async function FinalCTA() {
  const restaurant = await getActiveRestaurant();

  const restaurantName = restaurant?.name || "Aarambh Restaurant";

  return (
    <section className="relative overflow-hidden bg-[#0a0a0a]">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#c9a45c]/5 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-5 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
          Your Table Awaits
        </p>

        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
          Good Food.
          <br />
          <span className="text-white/80">Good Moments.</span>
        </h2>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/50">
          Bring your family, friends or someone special and experience
          delicious food, warm hospitality and the welcoming spirit of{" "}
          {restaurantName}.
        </p>

        {/* CTA Buttons */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/booking"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c] hover:shadow-lg hover:shadow-[#c9a45c]/10 sm:w-auto"
          >
            Book a Table
            <span className="ml-2">→</span>
          </Link>

          <Link
            href="/menu"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 px-7 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c] sm:w-auto"
          >
            Explore Menu
          </Link>
        </div>

        {/* Restaurant identity */}
        <div className="mx-auto mt-12 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/25">
          <span className="h-px w-8 bg-white/10" />
          <span>{restaurantName}</span>
          <span className="h-px w-8 bg-white/10" />
        </div>
      </div>
    </section>
  );
}