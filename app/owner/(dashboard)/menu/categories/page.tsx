"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

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
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OwnerMenuCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function getOwnerRestaurantId() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in.");
    }

    const { data: restaurant, error: restaurantError } = await supabase
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
  }

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const id = await getOwnerRestaurantId();
      setRestaurantId(id);

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

      setCategories((data || []) as Category[]);
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
  }

  function openAddModal() {
    setEditingCategory(null);

    const nextOrder =
      categories.length > 0
        ? Math.max(...categories.map((category) => category.display_order)) + 1
        : 0;

    setForm({
      ...EMPTY_FORM,
      display_order: String(nextOrder),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(category: Category) {
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
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }

  async function createUniqueSlug(name: string, currentId?: string) {
    if (!restaurantId) {
      throw new Error("Restaurant not found.");
    }

    const baseSlug = createSlug(name);

    if (!baseSlug) {
      throw new Error("Please enter a valid category name.");
    }

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      let query = supabase
        .from("menu_categories")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("slug", slug)
        .limit(1);

      if (currentId) {
        query = query.neq("id", currentId);
      }

      const { data, error: slugError } = await query.maybeSingle();

      if (slugError) {
        throw new Error(
          slugError.message || "Failed to check category slug."
        );
      }

      if (!data) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!restaurantId) {
      setError("Restaurant not found.");
      return;
    }

    const cleanName = form.name.trim();

    if (!cleanName) {
      setError("Category name is required.");
      return;
    }

    const displayOrder = Number(form.display_order);

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError("Display order must be a whole number greater than or equal to 0.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const slug = await createUniqueSlug(
        cleanName,
        editingCategory?.id
      );

      if (editingCategory) {
        const { error: updateError } = await supabase
          .from("menu_categories")
          .update({
            name: cleanName,
            slug,
            description: form.description.trim() || null,
            image_url: form.image_url.trim() || null,
            display_order: displayOrder,
            is_active: form.is_active,
          })
          .eq("id", editingCategory.id)
          .eq("restaurant_id", restaurantId);

        if (updateError) {
          throw new Error(
            updateError.message || "Failed to update category."
          );
        }

        setSuccess("Category updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("menu_categories")
          .insert({
            restaurant_id: restaurantId,
            name: cleanName,
            slug,
            description: form.description.trim() || null,
            image_url: form.image_url.trim() || null,
            display_order: displayOrder,
            is_active: form.is_active,
          });

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
          : "Something went wrong while saving the category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: Category) {
    if (!restaurantId) return;

    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("menu_categories")
        .update({
          is_active: !category.is_active,
        })
        .eq("id", category.id)
        .eq("restaurant_id", restaurantId);

      if (updateError) {
        throw new Error(
          updateError.message || "Failed to update category status."
        );
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );

      setSuccess(
        category.is_active
          ? "Category deactivated."
          : "Category activated."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category status."
      );
    }
  }

  async function moveCategory(category: Category, direction: "up" | "down") {
    if (!restaurantId) return;

    const ordered = [...categories].sort(
      (a, b) =>
        a.display_order - b.display_order ||
        a.name.localeCompare(b.name)
    );

    const currentIndex = ordered.findIndex(
      (item) => item.id === category.id
    );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }

    const target = ordered[targetIndex];

    setError("");
    setSuccess("");

    try {
      const currentOrder = category.display_order;
      const targetOrder = target.display_order;

      const firstUpdate = await supabase
        .from("menu_categories")
        .update({
          display_order: targetOrder,
        })
        .eq("id", category.id)
        .eq("restaurant_id", restaurantId);

      if (firstUpdate.error) {
        throw new Error(
          firstUpdate.error.message || "Failed to reorder category."
        );
      }

      const secondUpdate = await supabase
        .from("menu_categories")
        .update({
          display_order: currentOrder,
        })
        .eq("id", target.id)
        .eq("restaurant_id", restaurantId);

      if (secondUpdate.error) {
        throw new Error(
          secondUpdate.error.message || "Failed to reorder category."
        );
      }

      await loadCategories();
      setSuccess("Category order updated.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reorder category."
      );

      await loadCategories();
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !restaurantId) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("restaurant_id", restaurantId);

      if (deleteError) {
        throw new Error(
          deleteError.message || "Failed to delete category."
        );
      }

      setCategories((current) =>
        current.filter((item) => item.id !== deleteTarget.id)
      );

      setSuccess(
        "Category deleted. Any linked dishes are now uncategorized."
      );

      setDeleteTarget(null);
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
  }

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        (category.description || "").toLowerCase().includes(query)
      );
    });
  }, [categories, search]);

  const activeCount = categories.filter(
    (category) => category.is_active
  ).length;

  const inactiveCount = categories.length - activeCount;

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Menu Management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Organize your menu into clean categories and control their
              visibility and display order.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/owner/menu"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              <ArrowLeft size={16} />
              Menu Items
            </a>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c9a45c] px-5 text-sm font-semibold text-black transition hover:bg-[#d8b875]"
            >
              <Plus size={17} />
              Add Category
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && !showModal && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            <Check size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Total Categories
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Active
            </p>
            <p className="mt-2 text-3xl font-semibold text-green-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Inactive
            </p>
            <p className="mt-2 text-3xl font-semibold text-white/60">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60"
            />
          </div>
        </div>

        {/* Category List */}
        <section className="mt-6">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-sm text-white/50">
                <Loader2 size={18} className="animate-spin" />
                Loading categories...
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <ImageIcon size={20} className="text-white/40" />
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                {search
                  ? "No categories found"
                  : "No menu categories yet"}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                {search
                  ? "Try a different search term."
                  : "Create your first menu category to start organizing your dishes."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c9a45c] px-5 text-sm font-semibold text-black hover:bg-[#d8b875]"
                >
                  <Plus size={17} />
                  Create Category
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category, index) => {
                const sortedIndex = categories
                  .slice()
                  .sort(
                    (a, b) =>
                      a.display_order - b.display_order ||
                      a.name.localeCompare(b.name)
                  )
                  .findIndex((item) => item.id === category.id);

                return (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 sm:p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                      {/* Image */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon
                              size={22}
                              className="text-white/20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">
                            {category.name}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${
                              category.is_active
                                ? "bg-green-500/10 text-green-400"
                                : "bg-white/10 text-white/40"
                            }`}
                          >
                            {category.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-white/30">
                          /{category.slug}
                        </p>

                        {category.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* Order */}
                      <div className="flex items-center gap-2 lg:flex-col">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                          Order
                        </span>

                        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
                          <button
                            type="button"
                            disabled={sortedIndex === 0}
                            onClick={() =>
                              moveCategory(category, "up")
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                            title="Move up"
                          >
                            <ChevronUp size={16} />
                          </button>

                          <span className="min-w-7 text-center text-sm font-medium">
                            {category.display_order}
                          </span>

                          <button
                            type="button"
                            disabled={
                              sortedIndex ===
                              categories.length - 1
                            }
                            onClick={() =>
                              moveCategory(category, "down")
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                            title="Move down"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => toggleActive(category)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-xs font-medium transition ${
                            category.is_active
                              ? "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07]"
                              : "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/15"
                          }`}
                        >
                          {category.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#c9a45c]">
                  {editingCategory ? "Edit Category" : "New Category"}
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingCategory
                    ? "Update menu category"
                    : "Create menu category"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <X size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">
                    Category Name
                  </label>

                  <input
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
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#c9a45c]/60"
                  />

                  <p className="mt-2 text-xs text-white/30">
                    A unique URL slug will be generated automatically.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Short description for this category..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#c9a45c]/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">
                    Image URL
                  </label>

                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#c9a45c]/60"
                  />

                  {form.image_url.trim() && (
                    <div className="mt-3 h-32 overflow-hidden rounded-xl border border-white/10 bg-black">
                      <img
                        src={form.image_url.trim()}
                        alt="Category preview"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">
                      Display Order
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.display_order}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          display_order: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none focus:border-[#c9a45c]/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">
                      Visibility
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          is_active: !current.is_active,
                        }))
                      }
                      className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-sm transition ${
                        form.is_active
                          ? "border-green-500/20 bg-green-500/10 text-green-300"
                          : "border-white/10 bg-white/[0.03] text-white/50"
                      }`}
                    >
                      <span>
                        {form.is_active ? "Active" : "Inactive"}
                      </span>

                      <span
                        className={`h-5 w-9 rounded-full p-0.5 transition ${
                          form.is_active
                            ? "bg-green-500"
                            : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-white transition ${
                            form.is_active
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-11 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c9a45c] px-6 text-sm font-semibold text-black transition hover:bg-[#d8b875] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {editingCategory
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <Trash2 size={20} className="text-red-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Delete category?
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              You are about to delete{" "}
              <span className="font-medium text-white">
                {deleteTarget.name}
              </span>
              .
            </p>

            <div className="mt-4 rounded-xl border border-yellow-500/15 bg-yellow-500/[0.06] px-4 py-3 text-sm leading-6 text-yellow-200/80">
              Any menu items linked to this category will remain in your
              menu, but their category will become uncategorized.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="min-h-11 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}