import Link from "next/link";

import { getActiveRestaurant } from "@/lib/restaurant";

export default async function SignatureExperience() {
  const restaurant = await getActiveRestaurant();

  const restaurantName = restaurant?.name || "Aarambh Restaurant";

  const description =
    restaurant?.description ||
    "At Aarambh, dining is about more than just food. It is about sharing a table, enjoying familiar flavours and creating moments with the people who matter.";

  return (
    <section className="border-b border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Image */}
          <div className="group relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
            <img
              src="/images/signature-dish.png"
              alt={`${restaurantName} signature dish`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">
                {restaurantName}
              </p>

              <p className="mt-1 text-sm text-white/80">
                Made to be remembered.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="lg:pl-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Signature Experience
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              More Than
              <br />
              <span className="text-white/80">a Meal.</span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/60">
              {description}
            </p>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/40">
              Explore our selection of Indian, Maharashtrian, Chinese and
              tandoor favourites, prepared with carefully selected ingredients
              and served with warmth.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c] hover:shadow-lg hover:shadow-[#c9a45c]/10"
              >
                View Menu
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/booking"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Book a Table
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}