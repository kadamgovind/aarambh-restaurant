import Link from "next/link";

const exploreLinks = [
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Order Online", href: "/order" },
  { label: "Book a Table", href: "/booking" },
  { label: "My Account", href: "/account" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="group inline-block">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white transition-colors duration-300 group-hover:text-[#c9a45c]">
                Aarambh
              </h2>

              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
                Restaurant
              </p>
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/45">
              Taste That Feels Like Home. Experience Indian, Maharashtrian,
              North Indian, Chinese and Tandoor favourites in a warm family
              dining environment.
            </p>

            {/* CTA */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c]"
              >
                Book a Table
              </Link>

              <Link
                href="/order"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Order Online
              </Link>
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Explore
            </p>

            <nav className="mt-5 flex flex-col gap-3">
              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services + Contact */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Services
            </p>

            <nav className="mt-5 flex flex-col gap-3">
              {serviceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Contact */}
            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                Contact
              </p>

              <a
                href="tel:+917498168865"
                className="mt-3 block text-sm text-white/60 transition-colors hover:text-[#c9a45c]"
              >
                +91 74981 68865
              </a>

              <a
                href="mailto:fec@aarambhrestaurant.in"
                className="mt-2 block break-all text-sm text-white/60 transition-colors hover:text-[#c9a45c]"
              >
                fec@aarambhrestaurant.in
              </a>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mt-14 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Location
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Narhe, Pune
              <br />
              Maharashtra – 411041, India
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Opening Hours
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Monday – Sunday
              <br />
              11:00 AM – 11:00 PM
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Dining
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Dine-in • Takeaway
              <br />
              Home Delivery • Table Booking
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Aarambh Restaurant. All rights
            reserved.
          </p>

          <div className="flex items-center gap-5">
            <span className="text-xs text-white/25">
              Instagram
            </span>

            <span className="text-xs text-white/25">
              Privacy
            </span>

            <span className="text-xs text-white/25">
              Terms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}