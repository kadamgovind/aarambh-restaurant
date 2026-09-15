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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteCategory, setDeleteCategory] =
    useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getOwnerRestaurantId = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("You must be logged in to manage categories.");
    }

    const { data, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (restaurantError) {
      throw restaurantError;
    }

    if (!data?.id) {
      throw new Error("No restaurant found for this owner.");
    }

    return data.id as string;
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const restaurantId = await getOwnerRestaurantId();

      const { data, error: categoriesError } = await supabase
        .from("menu_categories")
        .select(
          "id, restaurant_id, name, slug, description, image_url, display_order, is_active, created_at, updated_at",
        )
        .eq("restaurant_id", restaurantId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (categoriesError) {
        throw categoriesError;
      }

      setCategories((data ?? []) as Category[]);
    } catch (err) {
      console.error("Failed to fetch categories:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }, [getOwnerRestaurantId]);

  useEffect(() => {
    // Supabase is an external data source; this effect performs the
    // initial client-side synchronization with the database.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCategories();
  }, [fetchCategories]);

  const loadCategories = async () => {
    setSuccess("");
    await fetchCategories();
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description: category.description ?? "",
      image_url: category.image_url ?? "",
      display_order: String(category.display_order),
      is_active: category.is_active,
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  };

  const createUniqueSlug = async (
    name: string,
    restaurantId: string,
    categoryId?: string,
  ) => {
    const baseSlug = createSlug(name) || "category";

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      let query = supabase
        .from("menu_categories")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("slug", slug)
        .limit(1);

      if (categoryId) {
        query = query.neq("id", categoryId);
      }

      const { data, error: slugError } =
        await query.maybeSingle();

      if (slugError) {
        throw slugError;
      }

      if (!data) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const name = form.name.trim();

      if (!name) {
        throw new Error("Category name is required.");
      }

      const restaurantId = await getOwnerRestaurantId();

      const slug = await createUniqueSlug(
        name,
        restaurantId,
        editingCategory?.id,
      );

      const displayOrder = Number.parseInt(
        form.display_order,
        10,
      );

      if (Number.isNaN(displayOrder) || displayOrder < 0) {
        throw new Error(
          "Display order must be a valid number greater than or equal to 0.",
        );
      }

      const payload = {
        restaurant_id: restaurantId,
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
          .eq("restaurant_id", restaurantId);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Category updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("menu_categories")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setSuccess("Category created successfully.");
      }

      closeModal();
      await fetchCategories();
    } catch (err) {
      console.error("Failed to save category:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: Category) => {
    setError("");
    setSuccess("");

    try {
      const restaurantId = await getOwnerRestaurantId();

      const { error: updateError } = await supabase
        .from("menu_categories")
        .update({
          is_active: !category.is_active,
        })
        .eq("id", category.id)
        .eq("restaurant_id", restaurantId);

      if (updateError) {
        throw updateError;
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item,
        ),
      );

      setSuccess(
        `${category.name} is now ${
          !category.is_active ? "active" : "inactive"
        }.`,
      );
    } catch (err) {
      console.error(
        "Failed to update category status:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category status.",
      );
    }
  };

  const moveCategory = async (
    category: Category,
    direction: "up" | "down",
  ) => {
    setError("");
    setSuccess("");

    const index = categories.findIndex(
      (item) => item.id === category.id,
    );

    if (index === -1) {
      return;
    }

    const targetIndex =
      direction === "up" ? index - 1 : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= categories.length
    ) {
      return;
    }

    const target = categories[targetIndex];

    try {
      const restaurantId = await getOwnerRestaurantId();

      const currentOrder = category.display_order;
      const targetOrder = target.display_order;

      const { error: firstError } = await supabase
        .from("menu_categories")
        .update({
          display_order: targetOrder,
        })
        .eq("id", category.id)
        .eq("restaurant_id", restaurantId);

      if (firstError) {
        throw firstError;
      }

      const { error: secondError } = await supabase
        .from("menu_categories")
        .update({
          display_order: currentOrder,
        })
        .eq("id", target.id)
        .eq("restaurant_id", restaurantId);

      if (secondError) {
        throw secondError;
      }

      await fetchCategories();
    } catch (err) {
      console.error("Failed to move category:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category order.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const restaurantId = await getOwnerRestaurantId();

      const { error: deleteError } = await supabase
        .from("menu_categories")
        .delete()
        .eq("id", deleteCategory.id)
        .eq("restaurant_id", restaurantId);

      if (deleteError) {
        throw deleteError;
      }

      setCategories((current) =>
        current.filter(
          (item) => item.id !== deleteCategory.id,
        ),
      );

      setSuccess(
        `${deleteCategory.name} deleted successfully.`,
      );

      setDeleteCategory(null);
    } catch (err) {
      console.error("Failed to delete category:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete category.",
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
        (category.description ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [categories, search]);

  const activeCount = categories.filter(
    (category) => category.is_active,
  ).length;

  const inactiveCount =
    categories.length - activeCount;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
              Menu Management
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
              Create, edit, organize and manage the
              categories used across your restaurant menu.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b875] focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            <span className="mr-2 text-lg leading-none">
              +
            </span>
            Add Category
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">
              Total Categories
            </p>

            <p className="mt-2 text-3xl font-bold">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">
              Active Categories
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">
              Inactive Categories
            </p>

            <p className="mt-2 text-3xl font-bold text-white/50">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search categories..."
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/40"
            />
          </div>

          <button
            type="button"
            onClick={loadCategories}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Categories */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="h-48 animate-pulse bg-white/[0.06]" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-4 w-full animate-pulse rounded bg-white/[0.05]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl text-[#c9a45c]">
              +
            </div>

            <h2 className="text-xl font-semibold">
              {search
                ? "No categories found"
                : "No categories yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
              {search
                ? "Try a different search term."
                : "Create your first menu category to start organizing your menu."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-6 rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b875]"
              >
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map(
              (category, filteredIndex) => {
                const originalIndex =
                  categories.findIndex(
                    (item) => item.id === category.id,
                  );

                const canMoveUp = originalIndex > 0;

                const canMoveDown =
                  originalIndex < categories.length - 1;

                return (
                  <article
                    key={category.id}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#c9a45c]/30 hover:bg-white/[0.045]"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-black">
                      {category.image_url ? (
                        <div
                          role="img"
                          aria-label={category.name}
                          className="h-full w-full bg-cover bg-center bg-no-repeat transition duration-500 group-hover:scale-105"
                          style={{
                            backgroundImage: `url("${category.image_url}")`,
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.06] to-black">
                          <span className="text-4xl font-bold text-[#c9a45c]/40">
                            {category.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

                      <div className="absolute right-3 top-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md ${
                            category.is_active
                              ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                              : "border-white/10 bg-black/50 text-white/50"
                          }`}
                        >
                          {category.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-4">
                        <span className="text-xs text-white/50">
                          Order #{category.display_order}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-white">
                            {category.name}
                          </h2>

                          <p className="mt-1 truncate text-xs text-white/35">
                            /{category.slug}
                          </p>
                        </div>
                      </div>

                      <p className="min-h-[48px] text-sm leading-6 text-white/50">
                        {category.description ||
                          "No description added for this category."}
                      </p>

                      {/* Main Actions */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(category)
                          }
                          className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleActive(category)
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            category.is_active
                              ? "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
                              : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                          }`}
                        >
                          {category.is_active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteCategory(category)
                          }
                          className="rounded-lg border border-red-400/10 bg-red-500/[0.05] px-3 py-2 text-sm font-medium text-red-300 transition hover:border-red-400/20 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Ordering */}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={!canMoveUp}
                          onClick={() =>
                            void moveCategory(
                              category,
                              "up",
                            )
                          }
                          className="flex-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          ↑ Move Up
                        </button>

                        <button
                          type="button"
                          disabled={!canMoveDown}
                          onClick={() =>
                            void moveCategory(
                              category,
                              "down",
                            )
                          }
                          className="flex-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          ↓ Move Down
                        </button>
                      </div>

                      <p className="mt-3 text-right text-[11px] text-white/25">
                        {filteredIndex + 1} of{" "}
                        {filteredCategories.length}
                      </p>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111111]/95 px-5 py-4 backdrop-blur-md sm:px-6">
              <div>
                <h2
                  id="category-modal-title"
                  className="text-xl font-semibold"
                >
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {editingCategory
                    ? "Update your menu category details."
                    : "Create a new category for your menu."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xl text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
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
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/40"
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
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/40"
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
                  placeholder="https://example.com/category-image.jpg"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/40"
                />

                {form.image_url.trim() && (
                  <div
                    role="img"
                    aria-label="Category preview"
                    className="mt-3 h-32 overflow-hidden rounded-xl border border-white/10 bg-black bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url("${form.image_url.trim()}")`,
                    }}
                  />
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
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#c9a45c]/60 focus:ring-1 focus:ring-[#c9a45c]/40"
                  />

                  <p className="mt-2 text-xs text-white/35">
                    Lower numbers appear first.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-white/80">
                    Status
                  </p>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_active:
                            event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#c9a45c]"
                    />

                    <span>
                      <span className="block text-sm font-medium text-white/80">
                        Active
                      </span>

                      <span className="block text-xs text-white/35">
                        Show this category on the menu.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b875] disabled:cursor-not-allowed disabled:opacity-50"
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
      {deleteCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-xl text-red-300">
              !
            </div>

            <h2
              id="delete-category-title"
              className="text-xl font-semibold"
            >
              Delete Category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Are you sure you want to delete{" "}
              <span className="font-medium text-white">
                {deleteCategory.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteCategory(null)}
                disabled={deleting}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
    </main>
  );
}