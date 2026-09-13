import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  ShoppingBag,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";

const experiences = [
  {
    number: "01",
    icon: UtensilsCrossed,
    title: "Dine In",
    description:
      "Enjoy a welcoming dining atmosphere with freshly prepared food and comfortable hospitality.",
    href: "/about",
    action: "Discover Our Space",
  },
  {
    number: "02",
    icon: ShoppingBag,
    title: "Takeaway",
    description:
      "Pick up your favourite dishes, carefully packed and ready to enjoy wherever you are.",
    href: "/order",
    action: "Order Takeaway",
  },
  {
    number: "03",
    icon: Smartphone,
    title: "Online Ordering",
    description:
      "Browse the menu and order your favourite meals from the comfort of your home.",
    href: "/order",
    action: "Start Your Order",
  },
  {
    number: "04",
    icon: CalendarCheck,
    title: "Table Booking",
    description:
      "Planning a family meal, gathering or special occasion? Reserve your table with ease.",
    href: "/booking",
    action: "Book a Table",
  },
];

export default function DiningExperience() {
  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Your Way to Enjoy
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Good food,
              <br />
              <span className="text-white/40">your way.</span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/50 sm:text-base">
              Whether you are joining us at the restaurant or enjoying a meal
              at home, Aarambh makes every food experience simple and
              memorable.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {experiences.map((experience) => {
              const Icon = experience.icon;

              return (
                <Link
                  key={experience.number}
                  href={experience.href}
                  className="group relative bg-[#0a0a0a] p-6 transition-colors duration-300 hover:bg-[#111111] sm:p-8"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-[#c9a45c] transition-colors duration-300 group-hover:border-[#c9a45c]/50">
                      <Icon size={19} strokeWidth={1.5} />
                    </div>

                    <span className="text-[10px] font-medium tracking-[0.2em] text-white/25">
                      {experience.number}
                    </span>
                  </div>

                  <h3 className="mt-8 text-xl font-medium tracking-tight text-white">
                    {experience.title}
                  </h3>

                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-white/45">
                    {experience.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2 text-xs font-medium text-white/50 transition-colors group-hover:text-[#c9a45c]">
                    {experience.action}
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}