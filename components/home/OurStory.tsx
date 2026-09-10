import Link from "next/link";

import { getActiveRestaurant } from "@/lib/restaurant";

export default async function OurStory() {
  const restaurant = await getActiveRestaurant();

  const restaurantName = restaurant?.name || "Aarambh";
  const city = restaurant?.city || "Pune";
  const description =
    restaurant?.description ||
    "Aarambh is a family-focused restaurant in Narhe, Pune, bringing together traditional Indian flavours, Maharashtrian favourites, popular Chinese classics and tandoor specialties.";

  return (
    <section className="border-b border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Content */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Our Story
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              A Taste of
              <br />
              <span className="text-white/80">Tradition.</span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/60">
              {description}
            </p>

            <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
              We believe great food should feel familiar, generous and
              welcoming. Every dish is prepared with carefully selected
              ingredients and a passion for creating a memorable dining
              experience.
            </p>

            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/35">
              {restaurantName} • {city}
            </p>

            <div className="mt-8">
              <Link
                href="/about"
                className="group inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Discover Our Story
                <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
            <img
              src="/images/restaurant-story.png"
              alt={`${restaurantName} interior`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                {restaurantName}
              </p>

              <p className="mt-1 text-sm text-white/80">
                A Taste of Tradition, Served With Heart.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}