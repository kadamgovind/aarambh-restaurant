"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OfferType = "Percentage" | "Flat" | "Free Delivery";
type OfferStatus = "Active" | "Scheduled" | "Expired" | "Disabled";

type Offer = {
  id: string;
  restaurant_id: string;
  code: string;
  title: string;
  description: string;
  type: OfferType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usage: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  status: OfferStatus;
};

type OfferRow = {
  id: string;
  restaurant_id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  value: number | string | null;
  min_order: number | string | null;
  max_discount: number | string | null;
  usage_count: number | string | null;
  usage_limit: number | string | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
};

const emptyForm = {
  code: "",
  title: "",
  description: "",
  type: "Percentage" as OfferType,
  value: "",
  minOrder: "",
  maxDiscount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function calculateStatus(
  startDate: string,
  endDate: string,
  isActive: boolean
): OfferStatus {
  if (!isActive) return "Disabled";

  const today = getToday();

  if (endDate < today) return "Expired";
  if (startDate > today) return "Scheduled";

  return "Active";
}

function mapOffer(row: OfferRow): Offer {
  const isActive = row.is_active !== false;

  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    code: row.code,
    title: row.title,
    description: row.description ?? "",
    type: row.type as OfferType,
    value: Number(row.value ?? 0),
    minOrder: Number(row.min_order ?? 0),
    maxDiscount:
      row.max_discount === null || row.max_discount === undefined
        ? null
        : Number(row.max_discount),
    usage: Number(row.usage_count ?? 0),
    usageLimit: Number(row.usage_limit ?? 0),
    startDate: row.start_date,
    endDate: row.end_date,
    status: calculateStatus(row.start_date, row.end_date, isActive),
  };
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: OfferStatus }) {
  const styles: Record<OfferStatus, string> = {
    Active:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    Scheduled:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    Expired:
      "bg-red-500/10 text-red-400 border border-red-500/20",
    Disabled:
      "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function getBenefit(offer: Offer) {
  if (offer.type === "Percentage") {
    return `${offer.value}% OFF`;
  }

  if (offer.type === "Flat") {
    return `₹${offer.value} OFF`;
  }

  return "FREE DELIVERY";
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [deleteOffer, setDeleteOffer] = useState<Offer | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function loadOffers() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Please login first.");
      }

      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) throw restaurantError;

      if (!restaurant) {
        throw new Error(
          "No restaurant is connected to this owner account."
        );
      }

      setRestaurantId(restaurant.id);

      const { data, error: offersError } = await supabase
        .from("offers")
        .select(
          `
            id,
            restaurant_id,
            code,
            title,
            description,
            type,
            value,
            min_order,
            max_discount,
            usage_count,
            usage_limit,
            start_date,
            end_date,
            is_active
          `
        )
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (offersError) throw offersError;

      setOffers((data ?? []).map((row) => mapOffer(row as OfferRow)));
    } catch (err) {
      console.error("Offers loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load offers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  const activeOffers = useMemo(
    () => offers.filter((offer) => offer.status === "Active").length,
    [offers]
  );

  const scheduledOffers = useMemo(
    () =>
      offers.filter((offer) => offer.status === "Scheduled").length,
    [offers]
  );

  const expiredOffers = useMemo(
    () => offers.filter((offer) => offer.status === "Expired").length,
    [offers]
  );

  const totalUsage = useMemo(
    () => offers.reduce((sum, offer) => sum + offer.usage, 0),
    [offers]
  );

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesSearch =
        !query ||
        offer.code.toLowerCase().includes(query) ||
        offer.title.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        offer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [offers, search, statusFilter]);

  function openCreateModal() {
    setEditingOffer(null);
    setForm({
      ...emptyForm,
      startDate: getToday(),
    });
    setShowModal(true);
  }

  function openEditModal(offer: Offer) {
    setEditingOffer(offer);

    setForm({
      code: offer.code,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      value: String(offer.value),
      minOrder: String(offer.minOrder),
      maxDiscount:
        offer.maxDiscount === null
          ? ""
          : String(offer.maxDiscount),
      usageLimit: String(offer.usageLimit),
      startDate: offer.startDate,
      endDate: offer.endDate,
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingOffer(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!restaurantId) {
      setError("Restaurant not found.");
      return;
    }

    if (!form.code.trim()) {
      setError("Offer code is required.");
      return;
    }

    if (!form.title.trim()) {
      setError("Offer title is required.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (
      form.type !== "Free Delivery" &&
      Number(form.value) <= 0
    ) {
      setError("Offer value must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        restaurant_id: restaurantId,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        value:
          form.type === "Free Delivery"
            ? 0
            : Number(form.value),
        min_order: Number(form.minOrder || 0),
        max_discount:
          form.maxDiscount.trim() === ""
            ? null
            : Number(form.maxDiscount),
        usage_limit: Number(form.usageLimit || 0),
        start_date: form.startDate,
        end_date: form.endDate,
        is_active: editingOffer
          ? editingOffer.status !== "Disabled"
          : true,
      };

      if (editingOffer) {
        const { error: updateError } = await supabase
          .from("offers")
          .update(payload)
          .eq("id", editingOffer.id)
          .eq("restaurant_id", restaurantId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("offers")
          .insert({
            ...payload,
            usage_count: 0,
          });

        if (insertError) throw insertError;
      }

      closeModal();
      await loadOffers();
    } catch (err) {
      console.error("Offer save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save offer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    try {
      setError("");

      const newActiveState = offer.status === "Disabled";

      const { error: updateError } = await supabase
        .from("offers")
        .update({
          is_active: newActiveState,
        })
        .eq("id", offer.id)
        .eq("restaurant_id", restaurantId);

      if (updateError) throw updateError;

      await loadOffers();
    } catch (err) {
      console.error("Offer toggle error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update offer."
      );
    }
  }

  async function confirmDelete() {
    if (!deleteOffer || !restaurantId) return;

    try {
      setDeleting(true);
      setError("");

      const { error: deleteError } = await supabase
        .from("offers")
        .delete()
        .eq("id", deleteOffer.id)
        .eq("restaurant_id", restaurantId);

      if (deleteError) throw deleteError;

      setDeleteOffer(null);
      await loadOffers();
    } catch (err) {
      console.error("Offer delete error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete offer."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">
              Marketing & Promotions
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Offers
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Create and manage promotional offers for your restaurant.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            + Create Offer
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-400">{error}</p>

            <button
              onClick={loadOffers}
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-zinc-500">Active Offers</p>
            <p className="mt-2 text-3xl font-semibold">
              {activeOffers}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-zinc-500">Scheduled</p>
            <p className="mt-2 text-3xl font-semibold">
              {scheduledOffers}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-zinc-500">Expired</p>
            <p className="mt-2 text-3xl font-semibold">
              {expiredOffers}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-zinc-500">Total Usage</p>
            <p className="mt-2 text-3xl font-semibold">
              {totalUsage}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offers..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Expired">Expired</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-2xl">
              %
            </div>

            <h2 className="text-lg font-semibold">
              No offers found
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              {search || statusFilter !== "All"
                ? "Try changing your search or filters."
                : "Create your first promotional offer."}
            </p>

            {!search && statusFilter === "All" && (
              <button
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                Create Offer
              </button>
            )}
          </div>
        ) : (
          /* OFFERS */
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredOffers.map((offer) => {
              const progress =
                offer.usageLimit > 0
                  ? Math.min(
                      100,
                      (offer.usage / offer.usageLimit) * 100
                    )
                  : 0;

              return (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/15"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-dashed border-white/20 bg-black px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-white">
                          {offer.code}
                        </span>

                        <StatusBadge status={offer.status} />
                      </div>

                      <h2 className="truncate text-xl font-semibold">
                        {offer.title}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {offer.description || "No description provided."}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-bold">
                        {getBenefit(offer)}
                      </p>

                      {offer.type !== "Free Delivery" && (
                        <p className="mt-1 text-xs text-zinc-600">
                          {offer.type}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                      <p className="text-xs text-zinc-600">
                        Minimum Order
                      </p>

                      <p className="mt-1 font-medium">
                        ₹{offer.minOrder}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                      <p className="text-xs text-zinc-600">
                        Max Discount
                      </p>

                      <p className="mt-1 font-medium">
                        {offer.maxDiscount === null
                          ? "No limit"
                          : `₹${offer.maxDiscount}`}
                      </p>
                    </div>
                  </div>

                  {/* USAGE */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        Usage
                      </span>

                      <span className="text-zinc-300">
                        {offer.usage} /{" "}
                        {offer.usageLimit > 0
                          ? offer.usageLimit
                          : "∞"}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* DATES */}
                  <div className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-zinc-500">
                      {formatDate(offer.startDate)}
                      <span className="mx-2 text-zinc-700">
                        →
                      </span>
                      {formatDate(offer.endDate)}
                    </p>

                    <p className="text-xs text-zinc-600">
                      {offer.status === "Active"
                        ? "Currently running"
                        : offer.status}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-5">
                    <button
                      onClick={() => openEditModal(offer)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleOffer(offer)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                    >
                      {offer.status === "Disabled"
                        ? "Enable"
                        : "Disable"}
                    </button>

                    <button
                      onClick={() => setDeleteOffer(offer)}
                      className="rounded-lg border border-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">
                  Marketing
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {editingOffer
                    ? "Edit Offer"
                    : "Create Offer"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* CODE */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Offer Code
                </label>

                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="WELCOME20"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
                  required
                />
              </div>

              {/* TITLE */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Offer Title
                </label>

                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="Welcome Offer"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="20% off on your first order"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-700 focus:border-white/20"
                />
              </div>

              {/* TYPE + VALUE */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Offer Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as OfferType,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none"
                  >
                    <option value="Percentage">
                      Percentage
                    </option>
                    <option value="Flat">
                      Flat
                    </option>
                    <option value="Free Delivery">
                      Free Delivery
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Value
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    disabled={form.type === "Free Delivery"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        value: e.target.value,
                      })
                    }
                    placeholder={
                      form.type === "Percentage"
                        ? "20"
                        : "100"
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-700 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* MIN + MAX */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Minimum Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.minOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minOrder: e.target.value,
                      })
                    }
                    placeholder="499"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Maximum Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxDiscount: e.target.value,
                      })
                    }
                    placeholder="150"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-700"
                  />
                </div>
              </div>

              {/* LIMIT */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Usage Limit
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usageLimit: e.target.value,
                    })
                  }
                  placeholder="200"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-zinc-700"
                />

                <p className="mt-2 text-xs text-zinc-600">
                  Enter 0 for unlimited usage.
                </p>
              </div>

              {/* DATES */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingOffer
                    ? "Save Changes"
                    : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                !
              </div>

              <h2 className="text-xl font-semibold">
                Delete Offer?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Are you sure you want to delete{" "}
                <span className="font-medium text-zinc-300">
                  {deleteOffer.code}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeleteOffer(null)}
                disabled={deleting}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}