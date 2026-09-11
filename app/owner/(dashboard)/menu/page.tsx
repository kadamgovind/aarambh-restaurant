"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FoodType = "Veg" | "Non-Veg";

type Category = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category: string;
  type: FoodType;
  available: boolean;
  popular: boolean;
  image: string;
  slug: string;
  displayOrder: number;
};

type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  item_type: "veg" | "non_veg";
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  menu_categories:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  type: FoodType;
  available: boolean;
  popular: boolean;
  image: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  type: "Veg",
  available: true,
  popular: false,
  image: "",
};

/* =========================================================
   HELPERS
========================================================= */

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryName(
  relation: MenuItemRow["menu_categories"]
) {
  if (!relation) {
    return "Uncategorized";
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name || "Uncategorized";
  }

  return relation.name || "Uncategorized";
}

/* =========================================================
   PAGE
========================================================= */

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /* =======================================================
     LOAD MENU
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!user) {
          throw new Error("Please login first.");
        }

        /* ---------------------------------------------------
           Find owner's restaurant
        --------------------------------------------------- */

        const { data: restaurant, error: restaurantError } =
          await supabase
            .from("restaurants")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

        if (restaurantError) {
          throw new Error(restaurantError.message);
        }

        if (!restaurant) {
          throw new Error("No restaurant found for this account.");
        }

        /* ---------------------------------------------------
           Load categories
        --------------------------------------------------- */

        const { data: categoryData, error: categoryError } =
          await supabase
            .from("menu_categories")
            .select(
              "id, name, description, display_order, is_active"
            )
            .eq("restaurant_id", restaurant.id)
            .order("display_order", {
              ascending: true,
            })
            .order("name", {
              ascending: true,
            });

        if (categoryError) {
          throw new Error(categoryError.message);
        }

        const loadedCategories =
          (categoryData || []) as Category[];

        if (cancelled) return;

        setCategories(loadedCategories);

        /* ---------------------------------------------------
           Load all owner menu items

           IMPORTANT:
           Owner needs unavailable items too.
           Therefore we intentionally do NOT use
           is_available = true here.
        --------------------------------------------------- */

        const { data: itemData, error: itemError } =
          await supabase
            .from("menu_items")
            .select(
              `
              id,
              restaurant_id,
              category_id,
              name,
              slug,
              description,
              price,
              item_type,
              image_url,
              is_available,
              is_featured,
              display_order,
              menu_categories (
                id,
                name
              )
            `
            )
            .eq("restaurant_id", restaurant.id)
            .order("display_order", {
              ascending: true,
            })
            .order("created_at", {
              ascending: false,
            });

        if (itemError) {
          throw new Error(itemError.message);
        }

        const rows = (itemData || []) as MenuItemRow[];

        const mappedItems: MenuItem[] = rows.map((item) => ({
          id: item.id,
          restaurantId: item.restaurant_id,
          name: item.name,
          description: item.description || "",
          price: Number(item.price || 0),
          categoryId: item.category_id || "",
          category: getCategoryName(item.menu_categories),
          type: item.item_type === "veg" ? "Veg" : "Non-Veg",
          available: item.is_available,
          popular: item.is_featured,
          image: item.image_url || "",
          slug: item.slug,
          displayOrder: item.display_order,
        }));

        if (cancelled) return;

        setMenu(mappedItems);

        /* ---------------------------------------------------
           Default category
        --------------------------------------------------- */

        if (loadedCategories.length > 0) {
          setForm((previous) => ({
            ...previous,
            categoryId:
              previous.categoryId || loadedCategories[0].id,
          }));
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Menu loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load menu."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMenu();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menu.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        item.categoryId === categoryFilter;

      const matchesType =
        typeFilter === "All" ||
        item.type === typeFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType
      );
    });
  }, [menu, search, categoryFilter, typeFilter]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalItems = menu.length;

  const availableItems = menu.filter(
    (item) => item.available
  ).length;

  const unavailableItems = menu.filter(
    (item) => !item.available
  ).length;

  const popularItems = menu.filter(
    (item) => item.popular
  ).length;

  /* =======================================================
     OPEN ADD
  ======================================================= */

  function openAddModal() {
    setEditingItem(null);

    setForm({
      ...emptyForm,
      categoryId:
        categories.length > 0
          ? categories[0].id
          : "",
    });

    setShowModal(true);
    setError("");
  }

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  function openEditModal(item: MenuItem) {
    setEditingItem(item);

    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      categoryId: item.categoryId,
      type: item.type,
      available: item.available,
      popular: item.popular,
      image: item.image,
    });

    setShowModal(true);
    setError("");
  }

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingItem(null);

    setForm({
      ...emptyForm,
      categoryId:
        categories.length > 0
          ? categories[0].id
          : "",
    });
  }

  /* =======================================================
     CREATE UNIQUE SLUG
  ======================================================= */

  async function createUniqueSlug(
    restaurantId: string,
    name: string,
    currentItemId?: string
  ) {
    const baseSlug = createSlug(name);

    if (!baseSlug) {
      throw new Error(
        "Dish name must contain at least one valid character."
      );
    }

    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
      let query = supabase
        .from("menu_items")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("slug", candidate)
        .limit(1);

      if (currentItemId) {
        query = query.neq("id", currentItemId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(
          `Failed to check dish slug: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        return candidate;
      }

      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  /* =======================================================
     GET NEXT DISPLAY ORDER
  ======================================================= */

  async function getNextDisplayOrder(
    restaurantId: string
  ) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("display_order")
      .eq("restaurant_id", restaurantId)
      .order("display_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to determine display order: ${error.message}`
      );
    }

    return Number(data?.display_order ?? -1) + 1;
  }

  /* =======================================================
     SAVE MENU ITEM
  ======================================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Dish name is required.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    const price = Number(form.price);

    if (
      !form.price ||
      Number.isNaN(price) ||
      price < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Please login first.");
      }

      /* ---------------------------------------------------
         Find restaurant
      --------------------------------------------------- */

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        throw new Error(restaurantError.message);
      }

      if (!restaurant) {
        throw new Error(
          "No restaurant found for this account."
        );
      }

      /* ---------------------------------------------------
         UPDATE
      --------------------------------------------------- */

      if (editingItem) {
        let slug = editingItem.slug;

        if (
          form.name.trim().toLowerCase() !==
          editingItem.name.trim().toLowerCase()
        ) {
          slug = await createUniqueSlug(
            restaurant.id,
            form.name,
            editingItem.id
          );
        }

        const { error: updateError } =
          await supabase
            .from("menu_items")
            .update({
              category_id: form.categoryId,
              name: form.name.trim(),
              slug,
              description:
                form.description.trim() || null,
              price,
              item_type:
                form.type === "Veg"
                  ? "veg"
                  : "non_veg",
              image_url:
                form.image.trim() || null,
              is_available: form.available,
              is_featured: form.popular,
            })
            .eq("id", editingItem.id)
            .eq(
              "restaurant_id",
              restaurant.id
            );

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        /* -------------------------------------------------
           INSERT
        ------------------------------------------------- */

        const slug = await createUniqueSlug(
          restaurant.id,
          form.name
        );

        const displayOrder =
          await getNextDisplayOrder(
            restaurant.id
          );

        const { error: insertError } =
          await supabase
            .from("menu_items")
            .insert({
              restaurant_id: restaurant.id,
              category_id: form.categoryId,
              name: form.name.trim(),
              slug,
              description:
                form.description.trim() || null,
              price,
              item_type:
                form.type === "Veg"
                  ? "veg"
                  : "non_veg",
              image_url:
                form.image.trim() || null,
              is_available: form.available,
              is_featured: form.popular,
              display_order: displayOrder,
            });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      closeModal();
      setRefreshKey((current) => current + 1);
    } catch (err) {
      console.error("Menu save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save dish."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TOGGLE AVAILABILITY
  ======================================================= */

  async function toggleAvailability(
    item: MenuItem
  ) {
    try {
      setActionId(item.id);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Please login first.");
      }

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        throw new Error(restaurantError.message);
      }

      if (!restaurant) {
        throw new Error(
          "No restaurant found for this account."
        );
      }

      const { error: updateError } =
        await supabase
          .from("menu_items")
          .update({
            is_available: !item.available,
          })
          .eq("id", item.id)
          .eq(
            "restaurant_id",
            restaurant.id
          );

      if (updateError) {
        throw new Error(updateError.message);
      }

      setMenu((previous) =>
        previous.map((menuItem) =>
          menuItem.id === item.id
            ? {
                ...menuItem,
                available:
                  !menuItem.available,
              }
            : menuItem
        )
      );
    } catch (err) {
      console.error(
        "Availability update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update availability."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =======================================================
     TOGGLE FEATURED
  ======================================================= */

  async function togglePopular(
    item: MenuItem
  ) {
    try {
      setActionId(item.id);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Please login first.");
      }

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        throw new Error(restaurantError.message);
      }

      if (!restaurant) {
        throw new Error(
          "No restaurant found for this account."
        );
      }

      const { error: updateError } =
        await supabase
          .from("menu_items")
          .update({
            is_featured: !item.popular,
          })
          .eq("id", item.id)
          .eq(
            "restaurant_id",
            restaurant.id
          );

      if (updateError) {
        throw new Error(updateError.message);
      }

      setMenu((previous) =>
        previous.map((menuItem) =>
          menuItem.id === item.id
            ? {
                ...menuItem,
                popular:
                  !menuItem.popular,
              }
            : menuItem
        )
      );
    } catch (err) {
      console.error(
        "Featured update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update featured status."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function confirmDelete() {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Please login first.");
      }

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        throw new Error(restaurantError.message);
      }

      if (!restaurant) {
        throw new Error(
          "No restaurant found for this account."
        );
      }

      const { error: deleteError } =
        await supabase
          .from("menu_items")
          .delete()
          .eq("id", deleteItem.id)
          .eq(
            "restaurant_id",
            restaurant.id
          );

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setMenu((previous) =>
        previous.filter(
          (item) =>
            item.id !== deleteItem.id
        )
      );

      setDeleteItem(null);
    } catch (err) {
      console.error(
        "Menu delete error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete dish."
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-white/40">
              Restaurant Management
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Menu
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Manage dishes, availability and featured items.
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={categories.length === 0}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add New Dish
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>

            <button
              onClick={() =>
                setRefreshKey((current) => current + 1)
              }
              className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-medium hover:bg-red-400/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* NO CATEGORY */}

        {!loading && categories.length === 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
            <p className="font-medium text-yellow-300">
              No menu categories found.
            </p>

            <p className="mt-1 text-sm text-yellow-200/60">
              Create at least one category in{" "}
              <span className="font-medium">
                menu_categories
              </span>{" "}
              before adding dishes.
            </p>
          </div>
        )}

        {/* STATS */}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Dishes"
            value={loading ? "—" : totalItems}
          />

          <StatCard
            title="Available"
            value={loading ? "—" : availableItems}
          />

          <StatCard
            title="Unavailable"
            value={loading ? "—" : unavailableItems}
          />

          <StatCard
            title="Featured"
            value={loading ? "—" : popularItems}
          />
        </div>

        {/* FILTERS */}

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_160px]">
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search dishes..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
            />

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            >
              <option
                value="All"
                className="bg-black"
              >
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                  className="bg-black"
                >
                  {category.name}
                  {!category.is_active
                    ? " (Inactive)"
                    : ""}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            >
              <option
                value="All"
                className="bg-black"
              >
                All Types
              </option>

              <option
                value="Veg"
                className="bg-black"
              >
                Veg
              </option>

              <option
                value="Non-Veg"
                className="bg-black"
              >
                Non-Veg
              </option>
            </select>
          </div>
        </div>

        {/* CONTENT */}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-[430px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
                />
              )
            )}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-20 text-center">
            <div className="text-4xl">🍽️</div>

            <h3 className="mt-4 text-lg font-semibold">
              No dishes found
            </h3>

            <p className="mt-1 text-sm text-white/40">
              Try changing your filters or add a new dish.
            </p>

            <button
              onClick={openAddModal}
              disabled={categories.length === 0}
              className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              Add New Dish
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredMenu.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                actionId={actionId}
                onEdit={() =>
                  openEditModal(item)
                }
                onDelete={() =>
                  setDeleteItem(item)
                }
                onToggleAvailability={() =>
                  toggleAvailability(item)
                }
                onTogglePopular={() =>
                  togglePopular(item)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111111] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingItem
                    ? "Edit Dish"
                    : "Add New Dish"}
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {editingItem
                    ? "Update dish information."
                    : "Add a new dish to your restaurant menu."}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* IMAGE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Image URL
                </label>

                <input
                  value={form.image}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />

                {form.image && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="h-48 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Dish Name
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Paneer Tikka"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />

                <p className="mt-2 text-xs text-white/25">
                  A unique menu slug will be generated automatically.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe the dish..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* PRICE + CATEGORY */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: e.target.value,
                      })
                    }
                    placeholder="280"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category
                  </label>

                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoryId:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                  >
                    <option
                      value=""
                      className="bg-black"
                    >
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                          className="bg-black"
                        >
                          {category.name}
                          {!category.is_active
                            ? " (Inactive)"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* FOOD TYPE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Food Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "Veg",
                      })
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      form.type === "Veg"
                        ? "border-green-400/40 bg-green-400/10 text-green-300"
                        : "border-white/10 bg-white/[0.03] text-white/50"
                    }`}
                  >
                    ● Veg
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        type: "Non-Veg",
                      })
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      form.type === "Non-Veg"
                        ? "border-red-400/40 bg-red-400/10 text-red-300"
                        : "border-white/10 bg-white/[0.03] text-white/50"
                    }`}
                  >
                    ● Non-Veg
                  </button>
                </div>
              </div>

              {/* TOGGLES */}

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Available"
                  description="Customers can order this dish."
                  checked={form.available}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      available: value,
                    })
                  }
                />

                <Toggle
                  label="Featured"
                  description="Highlight this dish as popular."
                  checked={form.popular}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      popular: value,
                    })
                  }
                />
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Save Changes"
                    : "Add Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="mb-5">
              <div className="mb-3 text-3xl">
                🗑️
              </div>

              <h2 className="text-xl font-semibold">
                Delete Dish?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Are you sure you want to delete{" "}
                <span className="font-medium text-white">
                  {deleteItem.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() =>
                  setDeleteItem(null)
                }
                disabled={deleting}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Dish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-white/40">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MENU CARD
========================================================= */

function MenuCard({
  item,
  actionId,
  onEdit,
  onDelete,
  onToggleAvailability,
  onTogglePopular,
}: {
  item: MenuItem;
  actionId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
  onTogglePopular: () => void;
}) {
  const isActionLoading = actionId === item.id;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">

      {/* IMAGE */}

      <div className="relative h-52 bg-white/[0.04]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-white/20">
            🍽️
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* FOOD TYPE */}

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              item.type === "Veg"
                ? "border-green-400/30 bg-green-400/10 text-green-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}
          >
            ● {item.type}
          </span>
        </div>

        {/* FEATURED */}

        {item.popular && (
          <button
            onClick={onTogglePopular}
            disabled={isActionLoading}
            className="absolute right-3 top-3 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-300"
          >
            ★ Featured
          </button>
        )}

        {/* PRICE */}

        <div className="absolute bottom-3 left-4">
          <p className="text-xl font-semibold">
            ₹{item.price.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-white/35">
              {item.category}
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              {item.name}
            </h3>
          </div>

          <button
            onClick={onTogglePopular}
            disabled={isActionLoading}
            title="Toggle featured"
            className={`text-lg ${
              item.popular
                ? "text-yellow-300"
                : "text-white/20 hover:text-white/50"
            }`}
          >
            ★
          </button>
        </div>

        <p className="min-h-[48px] text-sm leading-6 text-white/40">
          {item.description ||
            "No description added."}
        </p>

        {/* AVAILABILITY */}

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={onToggleAvailability}
            disabled={isActionLoading}
            className="flex items-center gap-2"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                item.available
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            <span
              className={`text-sm ${
                item.available
                  ? "text-green-300"
                  : "text-red-300"
              }`}
            >
              {item.available
                ? "Available"
                : "Unavailable"}
            </span>
          </button>

          {isActionLoading && (
            <span className="text-xs text-white/30">
              Updating...
            </span>
          )}
        </div>

        {/* ACTIONS */}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onEdit}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="rounded-xl border border-red-400/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left"
    >
      <div>
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="mt-1 text-xs text-white/35">
          {description}
        </p>
      </div>

      <span
        className={`relative h-6 w-11 rounded-full transition ${
          checked
            ? "bg-white"
            : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition ${
            checked
              ? "left-6 bg-black"
              : "left-1 bg-white/50"
          }`}
        />
      </span>
    </button>
  );
}