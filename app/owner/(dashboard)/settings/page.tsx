"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type RestaurantStatus = "open" | "closed" | "temporarily_closed";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type Hours = Record<string, DayHours>;

type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  maps_url: string | null;
  is_active: boolean;
  restaurant_status: RestaurantStatus;
  opening_hours: Hours | null;
  ordering_settings: Record<string, unknown> | null;
  payment_settings: Record<string, unknown> | null;
  notification_settings: Record<string, unknown> | null;
};

const defaultHours: Hours = {
  Monday: { open: "11:00", close: "23:00", closed: false },
  Tuesday: { open: "11:00", close: "23:00", closed: false },
  Wednesday: { open: "11:00", close: "23:00", closed: false },
  Thursday: { open: "11:00", close: "23:00", closed: false },
  Friday: { open: "11:00", close: "23:30", closed: false },
  Saturday: { open: "11:00", close: "23:30", closed: false },
  Sunday: { open: "11:00", close: "23:00", closed: false },
};

const statusOptions: {
  value: RestaurantStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "open",
    label: "Open",
    description: "Restaurant is accepting orders and bookings.",
  },
  {
    value: "closed",
    label: "Closed",
    description: "Restaurant is currently not operating.",
  },
  {
    value: "temporarily_closed",
    label: "Temporarily Closed",
    description: "Restaurant is temporarily unavailable.",
  },
];

function normalizeHours(value: Hours | null | undefined): Hours {
  if (!value || typeof value !== "object") {
    return { ...defaultHours };
  }

  const normalized: Hours = {};

  for (const day of Object.keys(defaultHours)) {
    const saved = value[day];

    normalized[day] = {
      open:
        typeof saved?.open === "string"
          ? saved.open
          : defaultHours[day].open,
      close:
        typeof saved?.close === "string"
          ? saved.close
          : defaultHours[day].close,
      closed:
        typeof saved?.closed === "boolean"
          ? saved.closed
          : defaultHours[day].closed,
    };
  }

  return normalized;
}

function isValidEmail(email: string) {
  if (!email.trim()) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;

  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

function isValidTimeRange(open: string, close: string) {
  return open < close;
}

export default function OwnerSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [restaurantId, setRestaurantId] = useState("");

  const [ownerLoginEmail, setOwnerLoginEmail] = useState("");

  const [restaurant, setRestaurant] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    logo: "",
    cover: "",
  });

  const [location, setLocation] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    maps: "",
  });

  const [hours, setHours] = useState<Hours>(defaultHours);

  const [ordering, setOrdering] = useState({
    onlineOrdering: true,
    tableBooking: true,
    delivery: true,
    pickup: true,
    minimumOrder: "199",
    deliveryFee: "40",
    deliveryTime: "35–45 min",
  });

  const [payments, setPayments] = useState({
    upi: true,
    cash: true,
    online: true,
    upiId: "",
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    reservations: true,
    messages: true,
    email: true,
    whatsapp: false,
  });

  const [restaurantStatus, setRestaurantStatus] =
    useState<RestaurantStatus>("open");

  const days = useMemo(() => Object.keys(defaultHours), []);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/owner/login");
        return;
      }

      setOwnerLoginEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        router.replace("/owner/login");
        return;
      }

      if (profile.role?.toLowerCase() !== "owner") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const { data: restaurantData, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select(
            `
              id,
              owner_id,
              name,
              slug,
              description,
              phone,
              email,
              address,
              city,
              state,
              pincode,
              logo_url,
              cover_image_url,
              maps_url,
              is_active,
              restaurant_status,
              opening_hours,
              ordering_settings,
              payment_settings,
              notification_settings
            `
          )
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        console.error(restaurantError);
        setError("Unable to load restaurant settings.");
        return;
      }

      if (!restaurantData) {
        router.replace("/owner/restaurant/new");
        return;
      }

      const data = restaurantData as Restaurant;

      setRestaurantId(data.id);

      setRestaurant({
        name: data.name ?? "",
        phone: data.phone ?? profile.phone ?? "",
        email: data.email ?? "",
        description: data.description ?? "",
        logo: data.logo_url ?? "",
        cover: data.cover_image_url ?? "",
      });

      setLocation({
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        pincode: data.pincode ?? "",
        maps: data.maps_url ?? "",
      });

      setHours(normalizeHours(data.opening_hours));

      const savedOrdering = data.ordering_settings ?? {};

      setOrdering({
        onlineOrdering:
          typeof savedOrdering.onlineOrdering === "boolean"
            ? savedOrdering.onlineOrdering
            : true,

        tableBooking:
          typeof savedOrdering.tableBooking === "boolean"
            ? savedOrdering.tableBooking
            : true,

        delivery:
          typeof savedOrdering.delivery === "boolean"
            ? savedOrdering.delivery
            : true,

        pickup:
          typeof savedOrdering.pickup === "boolean"
            ? savedOrdering.pickup
            : true,

        minimumOrder:
          typeof savedOrdering.minimumOrder === "string"
            ? savedOrdering.minimumOrder
            : typeof savedOrdering.minimumOrder === "number"
              ? String(savedOrdering.minimumOrder)
              : "199",

        deliveryFee:
          typeof savedOrdering.deliveryFee === "string"
            ? savedOrdering.deliveryFee
            : typeof savedOrdering.deliveryFee === "number"
              ? String(savedOrdering.deliveryFee)
              : "40",

        deliveryTime:
          typeof savedOrdering.deliveryTime === "string"
            ? savedOrdering.deliveryTime
            : "35–45 min",
      });

      const savedPayments = data.payment_settings ?? {};

      setPayments({
        upi:
          typeof savedPayments.upi === "boolean"
            ? savedPayments.upi
            : true,

        cash:
          typeof savedPayments.cash === "boolean"
            ? savedPayments.cash
            : true,

        online:
          typeof savedPayments.online === "boolean"
            ? savedPayments.online
            : true,

        upiId:
          typeof savedPayments.upiId === "string"
            ? savedPayments.upiId
            : "",
      });

      const savedNotifications = data.notification_settings ?? {};

      setNotifications({
        newOrders:
          typeof savedNotifications.newOrders === "boolean"
            ? savedNotifications.newOrders
            : true,

        reservations:
          typeof savedNotifications.reservations === "boolean"
            ? savedNotifications.reservations
            : true,

        messages:
          typeof savedNotifications.messages === "boolean"
            ? savedNotifications.messages
            : true,

        email:
          typeof savedNotifications.email === "boolean"
            ? savedNotifications.email
            : true,

        whatsapp:
          typeof savedNotifications.whatsapp === "boolean"
            ? savedNotifications.whatsapp
            : false,
      });

      const validStatuses: RestaurantStatus[] = [
        "open",
        "closed",
        "temporarily_closed",
      ];

      setRestaurantStatus(
        validStatuses.includes(data.restaurant_status)
          ? data.restaurant_status
          : data.is_active
            ? "open"
            : "closed"
      );
    } catch (loadError) {
      console.error(loadError);
      setError("Something went wrong while loading settings.");
    } finally {
      setLoading(false);
    }
  }

  function validateSettings() {
    setError("");

    if (!restaurant.name.trim()) {
      setError("Restaurant name is required.");
      return false;
    }

    const cleanPhone = restaurant.phone.replace(/\D/g, "");

    if (cleanPhone && cleanPhone.length !== 10) {
      setError("Restaurant phone number must contain 10 digits.");
      return false;
    }

    if (!isValidEmail(restaurant.email)) {
      setError("Please enter a valid business email.");
      return false;
    }

    const cleanPincode = location.pincode.replace(/\D/g, "");

    if (cleanPincode && cleanPincode.length !== 6) {
      setError("Pincode must contain 6 digits.");
      return false;
    }

    if (!isValidUrl(location.maps)) {
      setError("Please enter a valid Google Maps URL.");
      return false;
    }

    const minimumOrder = Number(ordering.minimumOrder);
    const deliveryFee = Number(ordering.deliveryFee);

    if (
      !Number.isFinite(minimumOrder) ||
      minimumOrder < 0
    ) {
      setError("Minimum order amount must be a valid positive number.");
      return false;
    }

    if (
      !Number.isFinite(deliveryFee) ||
      deliveryFee < 0
    ) {
      setError("Delivery fee must be a valid positive number.");
      return false;
    }

    for (const day of days) {
      const dayData = hours[day];

      if (!dayData.closed && !isValidTimeRange(dayData.open, dayData.close)) {
        setError(
          `${day}: closing time must be later than opening time.`
        );
        return false;
      }
    }

    return true;
  }

  async function handleSave() {
    if (!validateSettings()) {
      return;
    }

    if (!restaurantId) {
      setError("Restaurant information is missing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/owner/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        router.replace("/owner/login");
        return;
      }

      if (profile.role?.toLowerCase() !== "owner") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      const cleanPhone = restaurant.phone.replace(/\D/g, "");
      const cleanPincode = location.pincode.replace(/\D/g, "");

      const minimumOrder = Number(ordering.minimumOrder);
      const deliveryFee = Number(ordering.deliveryFee);

      const openingHours = days.reduce<Record<string, DayHours>>(
        (result, day) => {
          result[day] = {
            open: hours[day].open,
            close: hours[day].close,
            closed: hours[day].closed,
          };

          return result;
        },
        {}
      );

      const orderingSettings = {
        pickup: ordering.pickup,
        delivery: ordering.delivery,
        onlineOrdering: ordering.onlineOrdering,
        tableBooking: ordering.tableBooking,
        minimumOrder,
        deliveryFee,
        deliveryTime: ordering.deliveryTime.trim(),
      };

      const paymentSettings = {
        cash: payments.cash,
        upi: payments.upi,
        online: payments.online,
        upiId: payments.upiId.trim(),
      };

      const notificationSettings = {
        email: notifications.email,
        whatsapp: notifications.whatsapp,
        newOrders: notifications.newOrders,
        reservations: notifications.reservations,
        messages: notifications.messages,
      };

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({
          name: restaurant.name.trim(),
          description: restaurant.description.trim() || null,
          phone: cleanPhone || null,
          email: restaurant.email.trim() || null,
          address: location.address.trim() || null,
          city: location.city.trim() || null,
          state: location.state.trim() || null,
          pincode: cleanPincode || null,
          logo_url: restaurant.logo.trim() || null,
          cover_image_url: restaurant.cover.trim() || null,
          maps_url: location.maps.trim() || null,

          is_active: restaurantStatus === "open",
          restaurant_status: restaurantStatus,

          opening_hours: openingHours,
          ordering_settings: orderingSettings,
          payment_settings: paymentSettings,
          notification_settings: notificationSettings,

          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId)
        .eq("owner_id", user.id);

      if (updateError) {
        console.error(updateError);
        setError(
          updateError.message ||
            "Unable to save restaurant settings."
        );
        return;
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          full_name: restaurant.name.trim(),
          phone: cleanPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error(profileUpdateError);
      }

      setSuccess("Restaurant settings saved successfully.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (saveError) {
      console.error(saveError);
      setError("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  function updateHour(
    day: string,
    field: keyof DayHours,
    value: string | boolean
  ) {
    setHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/owner/login");
  }

  function Input({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    disabled = false,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
  }) {
    return (
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/45">
          {label}
        </span>

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/60 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>
    );
  }

  function Textarea({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) {
    return (
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/45">
          {label}
        </span>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/60 focus:bg-white/[0.06]"
        />
      </label>
    );
  }

  function Toggle({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex w-full items-center justify-between gap-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
      >
        <span>
          <span className="block text-sm font-medium text-white">
            {label}
          </span>

          {description && (
            <span className="mt-1 block text-xs leading-5 text-white/35">
              {description}
            </span>
          )}
        </span>

        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            checked ? "bg-[#c9a45c]" : "bg-white/10"
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

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
              Loading restaurant settings
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-[#c9a45c]">
              AARAMBH
            </p>

            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Restaurant Settings
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/owner")}
              className="hidden rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/20 hover:text-white sm:block"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/60 transition hover:border-red-400/30 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c9a45c]">
            Management
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Control your restaurant
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Manage your restaurant profile, operating hours,
            ordering, payments and notifications from one place.
          </p>
        </div>

        <div className="space-y-8">
          {/* Restaurant Status */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Restaurant Status
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Control whether customers can currently interact
                with your restaurant.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {statusOptions.map((option) => {
                const active =
                  restaurantStatus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setRestaurantStatus(option.value)
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-[#c9a45c]/60 bg-[#c9a45c]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          active
                            ? "text-[#c9a45c]"
                            : "text-white"
                        }`}
                      >
                        {option.label}
                      </span>

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          active
                            ? "bg-[#c9a45c]"
                            : "bg-white/20"
                        }`}
                      />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-white/35">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Restaurant Profile */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Restaurant Profile
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Basic information displayed to your customers.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Restaurant Name"
                value={restaurant.name}
                onChange={(value) =>
                  setRestaurant((current) => ({
                    ...current,
                    name: value,
                  }))
                }
                placeholder="Aarambh Restaurant"
              />

              <Input
                label="Business Phone"
                value={restaurant.phone}
                onChange={(value) =>
                  setRestaurant((current) => ({
                    ...current,
                    phone: value,
                  }))
                }
                placeholder="10 digit phone number"
              />

              <Input
                label="Business Email"
                value={restaurant.email}
                onChange={(value) =>
                  setRestaurant((current) => ({
                    ...current,
                    email: value,
                  }))
                }
                type="email"
                placeholder="restaurant@example.com"
              />

              <Input
                label="Restaurant Logo URL"
                value={restaurant.logo}
                onChange={(value) =>
                  setRestaurant((current) => ({
                    ...current,
                    logo: value,
                  }))
                }
                placeholder="https://..."
              />

              <div className="md:col-span-2">
                <Input
                  label="Cover Image URL"
                  value={restaurant.cover}
                  onChange={(value) =>
                    setRestaurant((current) => ({
                      ...current,
                      cover: value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={restaurant.description}
                  onChange={(value) =>
                    setRestaurant((current) => ({
                      ...current,
                      description: value,
                    }))
                  }
                  placeholder="Tell customers about your restaurant..."
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Location
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Restaurant address and location information.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={location.address}
                  onChange={(value) =>
                    setLocation((current) => ({
                      ...current,
                      address: value,
                    }))
                  }
                  placeholder="Restaurant street address"
                />
              </div>

              <Input
                label="City"
                value={location.city}
                onChange={(value) =>
                  setLocation((current) => ({
                    ...current,
                    city: value,
                  }))
                }
                placeholder="Pune"
              />

              <Input
                label="State"
                value={location.state}
                onChange={(value) =>
                  setLocation((current) => ({
                    ...current,
                    state: value,
                  }))
                }
                placeholder="Maharashtra"
              />

              <Input
                label="Pincode"
                value={location.pincode}
                onChange={(value) =>
                  setLocation((current) => ({
                    ...current,
                    pincode: value,
                  }))
                }
                placeholder="411041"
              />

              <Input
                label="Google Maps URL"
                value={location.maps}
                onChange={(value) =>
                  setLocation((current) => ({
                    ...current,
                    maps: value,
                  }))
                }
                placeholder="https://maps.google.com/..."
              />
            </div>
          </section>

          {/* Opening Hours */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Opening Hours
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Set the operating hours customers will see.
              </p>
            </div>

            <div className="space-y-3">
              {days.map((day) => (
                <div
                  key={day}
                  className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {day}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      {hours[day].closed
                        ? "Closed"
                        : `${hours[day].open} – ${hours[day].close}`}
                    </p>
                  </div>

                  <input
                    type="time"
                    value={hours[day].open}
                    disabled={hours[day].closed}
                    onChange={(event) =>
                      updateHour(
                        day,
                        "open",
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none disabled:opacity-30"
                  />

                  <input
                    type="time"
                    value={hours[day].close}
                    disabled={hours[day].closed}
                    onChange={(event) =>
                      updateHour(
                        day,
                        "close",
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none disabled:opacity-30"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      updateHour(
                        day,
                        "closed",
                        !hours[day].closed
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      hours[day].closed
                        ? "bg-white/10 text-white/60"
                        : "bg-[#c9a45c]/10 text-[#c9a45c]"
                    }`}
                  >
                    {hours[day].closed
                      ? "Closed"
                      : "Open"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Ordering */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Ordering & Delivery
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Configure how customers can order from your
                restaurant.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                label="Online Ordering"
                description="Allow customers to place online orders."
                checked={ordering.onlineOrdering}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    onlineOrdering: value,
                  }))
                }
              />

              <Toggle
                label="Table Booking"
                description="Allow customers to reserve tables."
                checked={ordering.tableBooking}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    tableBooking: value,
                  }))
                }
              />

              <Toggle
                label="Delivery"
                description="Enable home delivery orders."
                checked={ordering.delivery}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    delivery: value,
                  }))
                }
              />

              <Toggle
                label="Pickup"
                description="Allow customers to collect orders."
                checked={ordering.pickup}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    pickup: value,
                  }))
                }
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <Input
                label="Minimum Order"
                value={ordering.minimumOrder}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    minimumOrder: value,
                  }))
                }
                type="number"
                placeholder="199"
              />

              <Input
                label="Delivery Fee"
                value={ordering.deliveryFee}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    deliveryFee: value,
                  }))
                }
                type="number"
                placeholder="40"
              />

              <Input
                label="Delivery Time"
                value={ordering.deliveryTime}
                onChange={(value) =>
                  setOrdering((current) => ({
                    ...current,
                    deliveryTime: value,
                  }))
                }
                placeholder="35–45 min"
              />
            </div>
          </section>

          {/* Payments */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Payments
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Configure payment methods available to customers.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Toggle
                label="UPI"
                description="Accept UPI payments."
                checked={payments.upi}
                onChange={(value) =>
                  setPayments((current) => ({
                    ...current,
                    upi: value,
                  }))
                }
              />

              <Toggle
                label="Cash"
                description="Accept cash payments."
                checked={payments.cash}
                onChange={(value) =>
                  setPayments((current) => ({
                    ...current,
                    cash: value,
                  }))
                }
              />

              <Toggle
                label="Online Payment"
                description="Accept online payments."
                checked={payments.online}
                onChange={(value) =>
                  setPayments((current) => ({
                    ...current,
                    online: value,
                  }))
                }
              />
            </div>

            <div className="mt-5 max-w-xl">
              <Input
                label="UPI ID"
                value={payments.upiId}
                onChange={(value) =>
                  setPayments((current) => ({
                    ...current,
                    upiId: value,
                  }))
                }
                placeholder="restaurant@upi"
              />
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Notifications
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Choose which business notifications you want to
                receive.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                label="New Orders"
                description="Get notified when a new order arrives."
                checked={notifications.newOrders}
                onChange={(value) =>
                  setNotifications((current) => ({
                    ...current,
                    newOrders: value,
                  }))
                }
              />

              <Toggle
                label="Reservations"
                description="Get notified about table bookings."
                checked={notifications.reservations}
                onChange={(value) =>
                  setNotifications((current) => ({
                    ...current,
                    reservations: value,
                  }))
                }
              />

              <Toggle
                label="Messages"
                description="Receive customer message notifications."
                checked={notifications.messages}
                onChange={(value) =>
                  setNotifications((current) => ({
                    ...current,
                    messages: value,
                  }))
                }
              />

              <Toggle
                label="Email Notifications"
                description="Receive supported notifications by email."
                checked={notifications.email}
                onChange={(value) =>
                  setNotifications((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />

              <Toggle
                label="WhatsApp Notifications"
                description="WhatsApp integration can be enabled later."
                checked={notifications.whatsapp}
                onChange={(value) =>
                  setNotifications((current) => ({
                    ...current,
                    whatsapp: value,
                  }))
                }
              />
            </div>
          </section>

          {/* Owner Account */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">
                Owner Account
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Your restaurant account and login information.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Owner Login Email"
                value={ownerLoginEmail}
                onChange={() => {}}
                type="email"
                disabled
              />

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/forgot-password")
                  }
                  className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-[#c9a45c]/40 hover:text-[#c9a45c]"
                >
                  Change Password
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/30">
              Owner Login Email is your authentication email and
              cannot be changed from restaurant settings. Business
              Email above is the public restaurant contact email.
            </p>
          </section>

          {/* Save */}
          <div className="sticky bottom-4 z-30 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#c9a45c] px-6 py-3 text-sm font-semibold text-black shadow-2xl shadow-black/40 transition hover:bg-[#d8b875] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}