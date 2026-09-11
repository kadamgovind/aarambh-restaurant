"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  name: string;
  description: string;
  image_url: string;
  display_order: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  image_url: "",
  display_order: "0",
  is_active: true,
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(
    null
  );

  const getOwnerRestaurantId = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in.");
    }

    const { data: restaurant, error: restaurantError } =
      await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (restaurantError) {
      throw new Error(
        restaurantError.message || "Failed to load restaurant."
      );
    }

    if (!restaurant) {
      throw new Error("No restaurant found for this owner.");
    }

    return restaurant.id as string;
  }, []);

  /**
   * Fetch categories without changing React state.
   *
   * Keeping this function state-free allows the initial useEffect
   * to safely call it without triggering react-hooks/set-state-in-effect.
   */
  const fetchCategories = useCallback(async () => {
    const id = await getOwnerRestaurantId();

    const { data, error: categoryError } = await supabase
      .from("menu_categories")
      .select(
        `
          id,
          restaurant_id,
          name,
          slug,
          description,
          image_url,
          display_order,
          is_active,
          created_at,
          updated_at
        `
      )
      .eq("restaurant_id", id)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoryError) {
      throw new Error(
        categoryError.message || "Failed to load categories."
      );
    }

    return {
      restaurantId: id,
      categories: (data || []) as Category[],
    };
  }, [getOwnerRestaurantId]);

  /**
   * Normal reload function used by buttons/actions.
   */
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCategories();

      setRestaurantId(result.restaurantId);
      setCategories(result.categories);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load menu categories."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /**
   * Initial page load.
   *
   * State updates happen inside the asynchronous promise callbacks,
   * instead of directly through a state-setting function called by
   * the effect.
   */
  useEffect(() => {
    let cancelled = false;

    void fetchCategories()
      .then((result) => {
        if (cancelled) return;

        setRestaurantId(result.restaurantId);
        setCategories(result.categories);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load menu categories."
        );

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchCategories]);

  const openAddModal = useCallback(() => {
    setEditingCategory(null);

    setForm({
      ...EMPTY_FORM,
      display_order: String(categories.length),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }, [categories.length]);

  const openEditModal = useCallback((category: Category) => {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      display_order: String(category.display_order),
      is_active: category.is_active,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }, [saving]);

  const createUniqueSlug = useCallback(
    (name: string, currentId?: string) => {
      const baseSlug = createSlug(name);

      if (!baseSlug) {
        return "";
      }

      const existingSlugs = new Set(
        categories
          .filter((category) => category.id !== currentId)
          .map((category) => category.slug)
      );

      if (!existingSlugs.has(baseSlug)) {
        return baseSlug;
      }

      let counter = 2;
      let slug = `${baseSlug}-${counter}`;

      while (existingSlugs.has(slug)) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }

      return slug;
    },
    [categories]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const id = restaurantId || (await getOwnerRestaurantId());

      if (!restaurantId) {
        setRestaurantId(id);
      }

      const name = form.name.trim();

      if (!name) {
        throw new Error("Category name is required.");
      }

      const parsedOrder = Number.parseInt(
        form.display_order.trim(),
        10
      );

      const displayOrder = Number.isNaN(parsedOrder)
        ? categories.length
        : parsedOrder;

      const slug = createUniqueSlug(
        name,
        editingCategory?.id
      );

      if (!slug) {
        throw new Error("Unable to create a valid category slug.");
      }

      const payload = {
        restaurant_id: id,
        name,
        slug,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        display_order: displayOrder,
        is_active: form.is_active,
      };

      if (editingCategory) {
        const { error: updateError } = await supabase
          .from("menu_categories")
          .update(payload)
          .eq("id", editingCategory.id)
          .eq("restaurant_id", id);

        if (updateError) {
          throw new Error(
            updateError.message || "Failed to update category."
          );
        }

        setSuccess("Category updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("menu_categories")
          .insert(payload);

        if (insertError) {
          throw new Error(
            insertError.message || "Failed to create category."
          );
        }

        setSuccess("Category created successfully.");
      }

      await loadCategories();

      setShowModal(false);
      setEditingCategory(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category) => {
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("menu_categories")
        .update({
          is_active: !category.is_active,
        })
        .eq("id", category.id);

      if (updateError) {
        throw new Error(
          updateError.message ||
            "Failed to update category status."
        );
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item
        )
      );

      setSuccess(
        `${category.name} is now ${
          !category.is_active ? "active" : "inactive"
        }.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category status."
      );
    }
  };

  const moveCategory = async (
    category: Category,
    direction: "up" | "down"
  ) => {
    const currentIndex = categories.findIndex(
      (item) => item.id === category.id
    );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= categories.length
    ) {
      return;
    }

    const targetCategory = categories[targetIndex];

    setError("");
    setSuccess("");

    try {
      const { error: firstError } = await supabase
        .from("menu_categories")
        .update({
          display_order: targetCategory.display_order,
        })
        .eq("id", category.id);

      if (firstError) {
        throw new Error(
          firstError.message ||
            "Failed to update category order."
        );
      }

      const { error: secondError } = await supabase
        .from("menu_categories")
        .update({
          display_order: category.display_order,
        })
        .eq("id", targetCategory.id);

      if (secondError) {
        throw new Error(
          secondError.message ||
            "Failed to update category order."
        );
      }

      await loadCategories();

      setSuccess("Category order updated.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reorder categories."
      );

      await loadCategories();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", deleteTarget.id);

      if (deleteError) {
        throw new Error(
          deleteError.message ||
            "Failed to delete category."
        );
      }

      setSuccess(
        `"${deleteTarget.name}" was deleted successfully.`
      );

      setDeleteTarget(null);

      await loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete category."
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        (category.description || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [categories, search]);

  const activeCount = useMemo(
    () =>
      categories.filter((category) => category.is_active)
        .length,
    [categories]
  );

  const inactiveCount = categories.length - activeCount;

  const totalCategories = categories.length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a45c]">
              Menu Management
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Menu Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Create, edit, organize, and manage the categories
              used across your restaurant menu.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b66e]"
          >
            + Add Category
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">
              Total Categories
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {totalCategories}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">
              Active
            </p>

            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">
              Inactive
            </p>

            <p className="mt-3 text-3xl font-semibold text-white/70">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search categories..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c9a45c]/60"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadCategories()}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Categories */}
        {loading && categories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="text-sm text-white/50">
              Loading categories...
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-2xl">
              🍽️
            </div>

            <h2 className="text-lg font-semibold">
              {search
                ? "No categories found"
                : "No categories yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
              {search
                ? "Try changing your search term."
                : "Create your first menu category to organize your restaurant menu."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-6 rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b66e]"
              >
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => {
              const originalIndex = categories.findIndex(
                (item) => item.id === category.id
              );

              const canMoveUp = originalIndex > 0;
              const canMoveDown =
                originalIndex < categories.length - 1;

              return (
                <div
                  key={category.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-black">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.08] to-transparent">
                        <span className="text-4xl opacity-40">
                          🍽️
                        </span>
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
                          category.is_active
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {category.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">
                          {category.name}
                        </h2>

                        <p className="mt-1 truncate text-xs text-white/35">
                          /{category.slug}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/45">
                        #{category.display_order}
                      </span>
                    </div>

                    {category.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">
                        {category.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(category)
                        }
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void toggleActive(category)
                        }
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
                      >
                        {category.is_active
                          ? "Disable"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        disabled={!canMoveUp}
                        onClick={() =>
                          void moveCategory(
                            category,
                            "up"
                          )
                        }
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        ↑ Move Up
                      </button>

                      <button
                        type="button"
                        disabled={!canMoveDown}
                        onClick={() =>
                          void moveCategory(
                            category,
                            "down"
                          )
                        }
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        ↓ Move Down
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget(category)
                      }
                      className="mt-2 w-full rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2.5 text-xs font-medium text-red-300/80 transition hover:bg-red-500/10"
                    >
                      Delete Category
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b0b0b] px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  {editingCategory
                    ? "Update your menu category."
                    : "Create a new menu category."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/60 transition hover:bg-white/[0.09] hover:text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Category Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Starters"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60"
                />
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Short description of this category..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60"
                />
              </div>

              <div>
                <label
                  htmlFor="category-image"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Image URL
                </label>

                <input
                  id="category-image"
                  type="url"
                  value={form.image_url}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      image_url: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60"
                />

                {form.image_url.trim() && (
                  <div className="mt-3 h-32 overflow-hidden rounded-xl border border-white/10 bg-black">
                    <img
                      src={form.image_url.trim()}
                      alt="Category preview"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="category-order"
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Display Order
                  </label>

                  <input
                    id="category-order"
                    type="number"
                    min="0"
                    value={form.display_order}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        display_order:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-[#c9a45c]/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category-status"
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Status
                  </label>

                  <button
                    id="category-status"
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        is_active: !current.is_active,
                      }))
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      form.is_active
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.04] text-white/50"
                    }`}
                  >
                    <span>
                      {form.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        form.is_active
                          ? "bg-emerald-400"
                          : "bg-white/30"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b66e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-xl">
              ⚠️
            </div>

            <h2 className="text-xl font-semibold">
              Delete Category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Are you sure you want to delete{" "}
              <span className="font-medium text-white/80">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}