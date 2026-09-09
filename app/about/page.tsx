import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const philosophy = [
  {
    number: "01",
    title: "Authentic Flavours",
    description:
      "We respect the traditional flavours and character of Indian and Maharashtrian cuisine while bringing them to today's dining table.",
  },
  {
    number: "02",
    title: "Fresh Ingredients",
    description:
      "Carefully selected ingredients form the foundation of every dish we prepare, helping us create food that feels fresh and satisfying.",
  },
  {
    number: "03",
    title: "Made With Care",
    description:
      "From preparation to presentation, every order receives attention to detail because good food deserves thoughtful craftsmanship.",
  },
  {
    number: "04",
    title: "Warm Hospitality",
    description:
      "We want every guest to feel comfortable and welcome, whether they visit us for a family meal, celebration or casual dinner.",
  },
];

const values = [
  {
    number: "01",
    title: "Tradition",
    description:
      "We celebrate the flavours, recipes and culinary traditions that make Indian food special.",
  },
  {
    number: "02",
    title: "Quality",
    description:
      "We focus on ingredients, preparation and consistency to create a dependable dining experience.",
  },
  {
    number: "03",
    title: "Family",
    description:
      "Aarambh is a place to gather, share food and spend meaningful time with family and friends.",
  },
  {
    number: "04",
    title: "Experience",
    description:
      "Good food is only part of the experience. The atmosphere, service and people around the table matter too.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-40 sm:px-6 sm:pb-32 sm:pt-48 lg:px-8">
          <div className="max-w-5xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              About Aarambh
            </p>

            <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-8xl">
              A taste of
              <br />
              <span className="text-white/45">
                tradition & heart.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Aarambh is a family-focused restaurant in Narhe, Pune,
              bringing together Indian flavours, Maharashtrian favourites,
              Chinese classics and tandoor specialties.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          INTRODUCTION
      ===================================================== */}

      <section className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            {/* Content */}

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
                Our Beginning
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                A Taste of Tradition.
                <br />
                <span className="text-white/45">
                  Served With Heart.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-white/60">
                Aarambh Family Restaurant & Kitchen is a family-focused
                dining destination in Narhe, Pune. Our menu brings together
                traditional Indian flavours, Maharashtrian favourites,
                popular Chinese dishes and tandoor specialties.
              </p>

              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
                Our philosophy is simple — use good ingredients, prepare
                food with care and create a welcoming dining experience
                where people can enjoy good food together.
              </p>

              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
                Whether it is a family dinner, a meal with friends, a
                special celebration or simply a craving for your favourite
                dish, Aarambh is a place to come together around the table.
              </p>
            </div>

            {/* Image */}

            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
              <img
                src="/images/restaurant-story.png"
                alt="Aarambh Restaurant dining experience"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Aarambh Restaurant
                </p>

                <p className="mt-2 text-sm text-white/80">
                  A Taste of Tradition, Served With Heart.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BIG STATEMENT
      ===================================================== */}

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center sm:px-6 sm:py-36">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
            Our Belief
          </p>

          <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Great food is
            <br />
            <span className="text-white/40">
              meant to be shared.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-white/50 sm:text-lg">
            Dining is about more than what is on the plate. It is about
            the aroma, the atmosphere, the conversation, the hospitality
            and the people you share the moment with.
          </p>
        </div>
      </section>

      {/* =====================================================
          PHILOSOPHY
      ===================================================== */}

      <section className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-3 lg:gap-20">
            {/* Heading */}

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
                Our Philosophy
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                Crafted With
                <br />
                <span className="text-white/45">
                  Heart.
                </span>
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-7 text-white/40">
                From the kitchen to the dining table, our approach is
                guided by simple principles that keep the Aarambh
                experience warm, thoughtful and enjoyable.
              </p>
            </div>

            {/* Philosophy Grid */}

            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-2">
              {philosophy.map((item) => (
                <div
                  key={item.number}
                  className="group border-t border-white/10 pt-6 transition-colors duration-300 hover:border-[#c9a45c]/50"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/35 transition-colors duration-300 group-hover:text-[#c9a45c]">
                    {item.number}
                  </p>

                  <h3 className="mt-4 text-xl font-medium tracking-tight text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-white/50">
                    {item.description}
                  </p>

                  <div className="mt-6 h-px w-5 bg-[#c9a45c]/50 transition-all duration-300 group-hover:w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          VALUES
      ===================================================== */}

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              What Defines Us
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              The values behind
              <br />
              <span className="text-white/45">
                every experience.
              </span>
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.number}
                className="group bg-black p-7 transition-colors duration-300 hover:bg-[#0d0d0d] sm:p-8"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a45c]">
                  {value.number}
                </p>

                <h3 className="mt-6 text-xl font-medium">
                  {value.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          EXPERIENCE
      ===================================================== */}

      <section className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
                The Aarambh Experience
              </p>

              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                From our kitchen
                <br />
                <span className="text-white/45">
                  to your table.
                </span>
              </h2>
            </div>

            <div>
              <p className="text-base leading-8 text-white/50">
                Enjoy a wide selection of Indian, Maharashtrian, North
                Indian, Chinese and tandoor dishes in a comfortable family
                dining environment.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Indian",
                  "Maharashtrian",
                  "North Indian",
                  "Chinese",
                  "Tandoor",
                ].map((cuisine) => (
                  <span
                    key={cuisine}
                    className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white/45"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="bg-black">
        <div className="mx-auto max-w-5xl px-5 py-28 text-center sm:px-6 sm:py-36">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
            Experience Aarambh
          </p>

          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Come to the table.
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-white/50">
            Discover good food, warm hospitality and the flavours that
            make Aarambh feel like home.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/booking"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c] sm:w-auto"
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
        </div>
      </section>

      <Footer />
    </main>
  );
}