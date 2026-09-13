import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const galleryItems = [
  {
    src: "/images/gallery-01.jpeg",
    alt: "Aarambh restaurant food presentation",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/dish-01.jpeg",
    alt: "Signature dish served at Aarambh",
    className: "",
  },
  {
    src: "/images/interior.jpeg",
    alt: "Aarambh restaurant interior",
    className: "",
  },
  {
    src: "/images/dish-02.jpeg",
    alt: "Freshly prepared restaurant dish",
    className: "",
  },
  {
    src: "/images/exterior.jpeg",
    alt: "Aarambh restaurant exterior",
    className: "",
  },
];

export default function GalleryPreview() {
  return (
    <section className="border-t border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              A Glimpse of Aarambh
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              See what makes
              <br />
              <span className="text-white/40">every visit special.</span>
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
              From carefully prepared dishes to a welcoming dining space,
              explore a glimpse of the Aarambh experience.
            </p>
          </div>

          <Link
            href="/about"
            className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-[#c9a45c]"
          >
            Discover Aarambh
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="mt-14 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 md:grid-cols-4 md:auto-rows-[180px]">
          {galleryItems.map((item, index) => (
            <div
              key={`${item.src}-${index}`}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black ${item.className}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 768px) 100vw, 50vw"
                    : "(max-width: 768px) 50vw, 25vw"
                }
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/65">
                  {index === 0
                    ? "Our Food"
                    : index === 1
                      ? "Signature Dish"
                      : index === 2
                        ? "Our Space"
                        : index === 3
                          ? "Freshly Served"
                          : "Visit Us"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-xs font-medium text-white/65 transition-all duration-300 hover:border-[#c9a45c]/50 hover:text-[#c9a45c]"
          >
            Explore More
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}