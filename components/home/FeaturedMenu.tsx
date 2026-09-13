"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  item_type: "veg" | "non_veg";
  image_url: string | null;
  is_featured: boolean;
  display_order: number;
};

const fallbackImage = "/images/signature-dish.png";

export default function FeaturedMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadFeaturedMenu = async () => {
      setLoading(true);

      try {
        const {
          data: restaurant,
          error: restaurantError,
        } = await supabase
          .from("restaurants")
          .select("id")
          .eq("is_active", true)
          .order("created_at", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

        if (restaurantError || !restaurant) {
          if (mounted) {
            setMenuItems([]);
            setLoading(false);
          }

          return;
        }

        const { data, error } = await supabase
          .from("menu_items")
          .select(
            `
              id,
              category_id,
              name,
              description,
              price,
              item_type,
              image_url,
              is_featured,
              display_order
            `
          )
          .eq("restaurant_id", restaurant.id)
          .eq("is_available", true)
          .order("is_featured", {
            ascending: false,
          })
          .order("display_order", {
            ascending: true,
          })
          .order("name", {
            ascending: true,
          })
          .limit(6);

        if (error) {
          console.error(
            "Failed to load featured menu:",
            error
          );

          if (mounted) {
            setMenuItems([]);
          }

          return;
        }

        if (mounted) {
          setMenuItems((data || []) as MenuItem[]);
        }
      } catch (error) {
        console.error(
          "Featured menu loading error:",
          error
        );

        if (mounted) {
          setMenuItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadFeaturedMenu();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    return menuItems.slice(0, 6);
  }, [menuItems]);

  return (
    <section className="border-t border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-28 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              From Our Kitchen
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Something delicious
              <br />
              <span className="text-white/40">
                is waiting for you.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
              Discover a selection of dishes prepared for
              memorable meals, relaxed evenings and
              everyday cravings.
            </p>
          </div>

          <Link
            href="/menu"
            className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-[#c9a45c]"
          >
            Explore Full Menu
            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-14 flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-black">
            <div className="flex items-center gap-3 text-sm text-white/40">
              <Loader2
                size={19}
                className="animate-spin text-[#c9a45c]"
              />
              Loading our favourites...
            </div>
          </div>
        )}

        {/* Menu Cards */}
        {!loading && visibleItems.length > 0 && (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => {
              const isVeg = item.item_type === "veg";

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#151515]">
                    <img
                      src={item.image_url || fallbackImage}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src =
                          fallbackImage;
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Food Type */}
                    <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 backdrop-blur-md">
                      <span
                        className={`text-[9px] font-medium uppercase tracking-[0.18em] ${
                          isVeg
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {isVeg ? "Veg" : "Non-Veg"}
                      </span>
                    </div>

                    {/* Featured Badge */}
                    {item.is_featured && (
                      <div className="absolute bottom-4 left-4 rounded-full border border-[#c9a45c]/40 bg-black/75 px-3 py-1.5 backdrop-blur-md">
                        <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#c9a45c]">
                          Recommended
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-medium tracking-tight text-white sm:text-xl">
                        {item.name}
                      </h3>

                      <span className="shrink-0 text-sm font-semibold text-[#c9a45c]">
                        ₹{Number(item.price).toFixed(0)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/45">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <Link
                        href="/order"
                        className="text-xs font-medium text-white/55 transition-colors hover:text-[#c9a45c]"
                      >
                        Order this dish →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* No Menu Data */}
        {!loading && visibleItems.length === 0 && (
          <div className="mt-14 rounded-2xl border border-white/10 bg-black px-6 py-16 text-center">
            <p className="text-sm text-white/45">
              Our menu is being prepared. Please check back
              shortly.
            </p>

            <Link
              href="/menu"
              className="mt-5 inline-flex text-xs font-medium text-[#c9a45c] transition-colors hover:text-white"
            >
              Visit Full Menu →
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/order"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c9a45c]/40 px-6 text-xs font-medium text-[#c9a45c] transition-all duration-300 hover:bg-[#c9a45c] hover:text-black"
          >
            Start Your Order
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}