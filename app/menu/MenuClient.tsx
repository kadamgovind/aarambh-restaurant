"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
};

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

export default function MenuClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState<
    "All" | "Veg" | "Non-Veg"
  >("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoading(true);
    setError("");

    try {
      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

      if (restaurantError) {
        throw new Error(
          restaurantError.message ||
            "Failed to load restaurant."
        );
      }

      if (!restaurant) {
        setCategories([]);
        setMenuItems([]);
        setError("Restaurant is currently unavailable.");
        return;
      }

      const [categoriesResult, itemsResult] =
        await Promise.all([
          supabase
            .from("menu_categories")
            .select(
              `
                id,
                name,
                slug,
                display_order
              `
            )
            .eq("restaurant_id", restaurant.id)
            .eq("is_active", true)
            .order("display_order", {
              ascending: true,
            })
            .order("name", {
              ascending: true,
            }),

          supabase
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
            .order("display_order", {
              ascending: true,
            })
            .order("name", {
              ascending: true,
            }),
        ]);

      if (categoriesResult.error) {
        throw new Error(
          categoriesResult.error.message ||
            "Failed to load menu categories."
        );
      }

      if (itemsResult.error) {
        throw new Error(
          itemsResult.error.message ||
            "Failed to load menu items."
        );
      }

      setCategories(
        (categoriesResult.data || []) as Category[]
      );

      setMenuItems(
        (itemsResult.data || []) as MenuItem[]
      );
    } catch (err) {
      console.error("Menu loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load menu."
      );
    } finally {
      setLoading(false);
    }
  }

  const categoryMap = useMemo(() => {
    return new Map(
      categories.map((category) => [
        category.id,
        category.name,
      ])
    );
  }, [categories]);

  const categoryOptions = useMemo(() => {
    return [
      "All",
      ...categories.map((category) => category.name),
    ];
  }, [categories]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const categoryName = item.category_id
        ? categoryMap.get(item.category_id)
        : undefined;

      const categoryMatch =
        activeCategory === "All" ||
        categoryName === activeCategory;

      const typeMatch =
        activeType === "All" ||
        (activeType === "Veg" &&
          item.item_type === "veg") ||
        (activeType === "Non-Veg" &&
          item.item_type === "non_veg");

      return categoryMatch && typeMatch;
    });
  }, [
    menuItems,
    categoryMap,
    activeCategory,
    activeType,
  ]);

  return (
    <>
      <Navbar />

      {/* =====================================================
          MENU HERO
      ===================================================== */}

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-40 sm:px-6 sm:pb-24 sm:pt-48 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              The Aarambh Menu
            </p>

            <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-8xl">
              Flavours for
              <br />
              <span className="text-white/45">
                every occasion.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Explore our selection of carefully prepared
              dishes, made with quality ingredients and served
              with warmth.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/order"
                className="inline-flex min-h-11 items-center rounded-full bg-[#c9a45c] px-6 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#dfbd78]"
              >
                Order Online
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/booking"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Book a Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Loader2
                size={16}
                className="animate-spin"
              />
              Loading menu...
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categoryOptions.map((category) => {
                  const active =
                    activeCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setActiveCategory(category)
                      }
                      className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-medium transition-all duration-200 ${
                        active
                          ? "bg-white text-black"
                          : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-2">
                {(["All", "Veg", "Non-Veg"] as const).map(
                  (type) => {
                    const active = activeType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setActiveType(type)
                        }
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                          active
                            ? "border-[#c9a45c] bg-[#c9a45c]/10 text-[#c9a45c]"
                            : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          MENU GRID
      ===================================================== */}

      <section className="bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#c9a45c]">
                Our Selection
              </p>

              {!loading && (
                <p className="mt-2 text-sm text-white/40">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1
                    ? "dish"
                    : "dishes"}
                </p>
              )}
            </div>

            {!loading &&
              (activeCategory !== "All" ||
                activeType !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveType("All");
                  }}
                  className="text-xs text-white/40 transition hover:text-[#c9a45c]"
                >
                  Clear Filters
                </button>
              )}
          </div>

          {/* Loading */}

          {loading && (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10 bg-black">
              <div className="flex items-center gap-3 text-sm text-white/40">
                <Loader2
                  size={20}
                  className="animate-spin text-[#c9a45c]"
                />
                Loading our menu...
              </div>
            </div>
          )}

          {/* Error */}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
              <p className="text-sm text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={loadMenu}
                className="mt-5 rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium text-white/60 transition hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Menu */}

          {!loading &&
            !error &&
            filteredItems.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => {
                  const categoryName = item.category_id
                    ? categoryMap.get(item.category_id)
                    : undefined;

                  const itemType =
                    item.item_type === "veg"
                      ? "Veg"
                      : "Non-Veg";

                  return (
                    <article
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-black transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                    >
                      {/* Image */}

                      <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
                        <img
                          src={
                            item.image_url ||
                            fallbackImage
                          }
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.src =
                              fallbackImage;
                          }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {item.is_featured && (
                          <div className="absolute left-4 top-4 rounded-full border border-[#c9a45c]/40 bg-black/75 px-3 py-1.5 backdrop-blur">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a45c]">
                              Aarambh Special
                            </span>
                          </div>
                        )}

                        <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 backdrop-blur">
                          <span
                            className={`text-[10px] uppercase tracking-[0.15em] ${
                              itemType === "Veg"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {itemType}
                          </span>
                        </div>
                      </div>

                      {/* Content */}

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="text-xl font-medium tracking-tight text-white">
                            {item.name}
                          </h2>

                          <p className="shrink-0 text-sm font-semibold text-[#c9a45c]">
                            ₹
                            {Number(item.price).toFixed(
                              0
                            )}
                          </p>
                        </div>

                        {item.description && (
                          <p className="mt-4 text-sm leading-7 text-white/45">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                            {categoryName ||
                              "Aarambh Menu"}
                          </span>

                          <Link
                            href="/order"
                            className="text-xs font-medium text-white/60 transition-colors hover:text-[#c9a45c]"
                          >
                            Add to Order →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          {/* Empty */}

          {!loading &&
            !error &&
            filteredItems.length === 0 && (
              <div className="rounded-2xl border border-white/10 py-24 text-center">
                <p className="text-sm text-white/40">
                  No dishes found for this selection.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveType("All");
                  }}
                  className="mt-5 text-xs text-[#c9a45c]"
                >
                  Reset Filters
                </button>
              </div>
            )}
        </div>
      </section>

      {/* =====================================================
          KITCHEN NOTE
      ===================================================== */}

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 sm:py-24">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a45c] sm:text-xs">
            A Note From Our Kitchen
          </p>

          <p className="mt-6 text-sm leading-8 text-white/45">
            Please inform our team about any dietary
            requirements or allergies before ordering. Dish
            availability may vary based on ingredient
            availability.
          </p>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-6 sm:py-32">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
            Your Table Awaits
          </p>

          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Good food.
            <br />
            <span className="text-white/45">
              Good moments.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-white/50">
            Enjoy the flavours of Aarambh with your family
            and friends.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/order"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c] sm:w-auto"
            >
              Order Online
              <span className="ml-2">→</span>
            </Link>

            <Link
              href="/booking"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 px-7 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c] sm:w-auto"
            >
              Book a Table
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}