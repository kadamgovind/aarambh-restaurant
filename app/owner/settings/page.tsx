"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RestaurantStatus = "Open" | "Closed" | "Paused";

type DayHours = {
  day: string;
  key: string;
  enabled: boolean;
  open: string;
  close: string;
};

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
  opening_hours: Record<
    string,
    {
      enabled: boolean;
      open: string;
      close: string;
    }
  > | null;
  ordering_settings: {
    onlineOrdering?: boolean;
    tableBooking?: boolean;
    delivery?: boolean;
    pickup?: boolean;
    minimumOrder?: string;
    deliveryFee?: string;
    deliveryTime?: string;
  } | null;
  payment_settings: {
    upi?: boolean;
    cash?: boolean;
    online?: boolean;
    upiId?: string;
  } | null;
  notification_settings: {
    newOrders?: boolean;
    reservations?: boolean;
    messages?: boolean;
    email?: boolean;
    whatsapp?: boolean;
  } | null;
  restaurant_status: RestaurantStatus;
};

const defaultHours: DayHours[] = [
  {
    day: "Monday",
    key: "monday",
    enabled: true,
    open: "11:00",
    close: "23:00",
  },
  {
    day: "Tuesday",
    key: "tuesday",
    enabled: true,
    open: "11:00",
    close: "23:00",
  },
  {
    day: "Wednesday",
    key: "wednesday",
    enabled: true,
    open: "11:00",
    close: "23:00",
  },
  {
    day: "Thursday",
    key: "thursday",
    enabled: true,
    open: "11:00",
    close: "23:00",
  },
  {
    day: "Friday",
    key: "friday",
    enabled: true,
    open: "11:00",
    close: "23:30",
  },
  {
    day: "Saturday",
    key: "saturday",
    enabled: true,
    open: "11:00",
    close: "23:30",
  },
  {
    day: "Sunday",
    key: "sunday",
    enabled: true,
    open: "11:00",
    close: "23:00",
  },
];

export default function OwnerSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [restaurantId, setRestaurantId] = useState("");

  const [restaurant, setRestaurant] = useState({
    name: "",
    owner: "",
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

  const [hours, setHours] = useState<DayHours[]>(defaultHours);

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
    useState<RestaurantStatus>("Open");

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      /* -------------------------------------------------------
         RESTAURANT
      ------------------------------------------------------- */

      const { data: restaurantData, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select(`
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
            opening_hours,
            ordering_settings,
            payment_settings,
            notification_settings,
            restaurant_status
          `)
          .eq("owner_id", user.id)
          .maybeSingle();

      if (restaurantError) {
        throw new Error(restaurantError.message);
      }

      if (!restaurantData) {
        throw new Error(
          "No restaurant is connected to this owner account."
        );
      }

      const data = restaurantData as Restaurant;

      setRestaurantId(data.id);

      /* -------------------------------------------------------
         RESTAURANT PROFILE
      ------------------------------------------------------- */

      setRestaurant({
        name: data.name ?? "",
        owner: "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        description: data.description ?? "",
        logo: data.logo_url ?? "",
        cover: data.cover_image_url ?? "",
      });

      /* -------------------------------------------------------
         LOCATION
      ------------------------------------------------------- */

      setLocation({
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        pincode: data.pincode ?? "",
        maps: data.maps_url ?? "",
      });

      /* -------------------------------------------------------
         OPENING HOURS
      ------------------------------------------------------- */

      if (data.opening_hours) {
        setHours(
          defaultHours.map((item) => {
            const savedHour = data.opening_hours?.[item.key];

            return {
              ...item,
              enabled:
                savedHour?.enabled !== undefined
                  ? savedHour.enabled
                  : item.enabled,
              open: savedHour?.open ?? item.open,
              close: savedHour?.close ?? item.close,
            };
          })
        );
      }

      /* -------------------------------------------------------
         ORDERING
      ------------------------------------------------------- */

      if (data.ordering_settings) {
        setOrdering({
          onlineOrdering:
            data.ordering_settings.onlineOrdering ?? true,
          tableBooking:
            data.ordering_settings.tableBooking ?? true,
          delivery: data.ordering_settings.delivery ?? true,
          pickup: data.ordering_settings.pickup ?? true,
          minimumOrder:
            data.ordering_settings.minimumOrder ?? "199",
          deliveryFee:
            data.ordering_settings.deliveryFee ?? "40",
          deliveryTime:
            data.ordering_settings.deliveryTime ?? "35–45 min",
        });
      }

      /* -------------------------------------------------------
         PAYMENTS
      ------------------------------------------------------- */

      if (data.payment_settings) {
        setPayments({
          upi: data.payment_settings.upi ?? true,
          cash: data.payment_settings.cash ?? true,
          online: data.payment_settings.online ?? true,
          upiId: data.payment_settings.upiId ?? "",
        });
      }

      /* -------------------------------------------------------
         NOTIFICATIONS
      ------------------------------------------------------- */

      if (data.notification_settings) {
        setNotifications({
          newOrders:
            data.notification_settings.newOrders ?? true,
          reservations:
            data.notification_settings.reservations ?? true,
          messages:
            data.notification_settings.messages ?? true,
          email:
            data.notification_settings.email ?? true,
          whatsapp:
            data.notification_settings.whatsapp ?? false,
        });
      }

      /* -------------------------------------------------------
         STATUS
      ------------------------------------------------------- */

      setRestaurantStatus(
        data.restaurant_status ??
          (data.is_active ? "Open" : "Closed")
      );

      /* -------------------------------------------------------
         OWNER PROFILE
      ------------------------------------------------------- */

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.warn(
          "Profile loading warning:",
          profileError.message
        );
      }

      setRestaurant((current) => ({
        ...current,
        owner: profileData?.full_name ?? "",
        phone: data.phone ?? profileData?.phone ?? "",
      }));
    } catch (err) {
      console.error("Settings loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load restaurant settings."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  async function handleSave() {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      if (!restaurantId) {
        throw new Error("Restaurant ID is missing.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      /* -------------------------------------------------------
         OPENING HOURS JSON
      ------------------------------------------------------- */

      const openingHours = hours.reduce(
        (result, item) => {
          result[item.key] = {
            enabled: item.enabled,
            open: item.open,
            close: item.close,
          };

          return result;
        },
        {} as Record<
          string,
          {
            enabled: boolean;
            open: string;
            close: string;
          }
        >
      );

      /* -------------------------------------------------------
         UPDATE RESTAURANT
      ------------------------------------------------------- */

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({
          name: restaurant.name.trim(),
          description: restaurant.description.trim() || null,
          phone: restaurant.phone.trim() || null,
          email: restaurant.email.trim() || null,

          address: location.address.trim() || null,
          city: location.city.trim() || null,
          state: location.state.trim() || null,
          pincode: location.pincode.trim() || null,

          logo_url: restaurant.logo.trim() || null,
          cover_image_url: restaurant.cover.trim() || null,

          maps_url: location.maps.trim() || null,

          is_active: restaurantStatus === "Open",

          restaurant_status: restaurantStatus,

          opening_hours: openingHours,

          ordering_settings: ordering,

          payment_settings: payments,

          notification_settings: notifications,

          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId)
        .eq("owner_id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      /* -------------------------------------------------------
         UPDATE OWNER PROFILE
      ------------------------------------------------------- */

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          full_name: restaurant.owner.trim() || null,
          phone: restaurant.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.warn(
          "Owner profile update warning:",
          profileUpdateError.message
        );
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error("Settings save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     UPDATE HOURS
  ========================================================= */

  function updateHour(
    index: number,
    field: keyof DayHours,
    value: string | boolean
  ) {
    setHours((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  /* =========================================================
     SIGN OUT
  ========================================================= */

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign out."
      );
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

            <p className="mt-4 text-sm text-white/40">
              Loading restaurant settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error && !restaurantId) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 text-center">
            <div className="text-sm font-semibold text-red-300">
              Unable to load settings
            </div>

            <p className="mt-2 text-sm leading-6 text-white/45">
              {error}
            </p>

            <button
              onClick={loadSettings}
              className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-white/40">
                AURA OWNER
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Restaurant Settings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                Manage your restaurant profile, operations, ordering,
                payments, opening hours and notifications.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : saved
                ? "✓ Changes Saved"
                : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* =====================================================
              ERROR MESSAGE
          ===================================================== */}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* =====================================================
              RESTAURANT STATUS
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      restaurantStatus === "Open"
                        ? "bg-emerald-400"
                        : restaurantStatus === "Paused"
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                  />

                  <h2 className="text-lg font-semibold">
                    Restaurant Status
                  </h2>
                </div>

                <p className="mt-2 text-sm text-white/40">
                  Control whether customers can currently place
                  orders.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["Open", "Closed", "Paused"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() =>
                        setRestaurantStatus(status)
                      }
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        restaurantStatus === status
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          {/* =====================================================
              RESTAURANT PROFILE
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                General
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Restaurant Profile
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Basic information displayed across your customer
                website.
              </p>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Input
                  label="Restaurant Name"
                  value={restaurant.name}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      name: value,
                    })
                  }
                />

                <Input
                  label="Owner Name"
                  value={restaurant.owner}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      owner: value,
                    })
                  }
                />

                <Input
                  label="Phone Number"
                  value={restaurant.phone}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      phone: value,
                    })
                  }
                />

                <Input
                  label="Business Email"
                  value={restaurant.email}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      email: value,
                    })
                  }
                />
              </div>

              <Textarea
                label="Restaurant Description"
                value={restaurant.description}
                onChange={(value) =>
                  setRestaurant({
                    ...restaurant,
                    description: value,
                  })
                }
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <ImageInput
                  label="Restaurant Logo URL"
                  value={restaurant.logo}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      logo: value,
                    })
                  }
                />

                <ImageInput
                  label="Cover Image URL"
                  value={restaurant.cover}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      cover: value,
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* =====================================================
              LOCATION
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Location
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Restaurant Location
              </h2>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <Textarea
                label="Full Address"
                value={location.address}
                onChange={(value) =>
                  setLocation({
                    ...location,
                    address: value,
                  })
                }
              />

              <div className="grid gap-6 md:grid-cols-3">
                <Input
                  label="City"
                  value={location.city}
                  onChange={(value) =>
                    setLocation({
                      ...location,
                      city: value,
                    })
                  }
                />

                <Input
                  label="State"
                  value={location.state}
                  onChange={(value) =>
                    setLocation({
                      ...location,
                      state: value,
                    })
                  }
                />

                <Input
                  label="Pincode"
                  value={location.pincode}
                  onChange={(value) =>
                    setLocation({
                      ...location,
                      pincode: value,
                    })
                  }
                />
              </div>

              <Input
                label="Google Maps URL"
                value={location.maps}
                onChange={(value) =>
                  setLocation({
                    ...location,
                    maps: value,
                  })
                }
              />
            </div>
          </section>

          {/* =====================================================
              OPENING HOURS
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Operations
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Opening Hours
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Set the hours customers can visit or place orders.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {hours.map((item, index) => (
                <div
                  key={item.day}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        updateHour(
                          index,
                          "enabled",
                          !item.enabled
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition ${
                        item.enabled
                          ? "bg-white"
                          : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full transition ${
                          item.enabled
                            ? "left-6 bg-black"
                            : "left-1 bg-white/40"
                        }`}
                      />
                    </button>

                    <span className="w-24 text-sm font-medium">
                      {item.day}
                    </span>
                  </div>

                  {item.enabled ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={item.open}
                        onChange={(e) =>
                          updateHour(
                            index,
                            "open",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
                      />

                      <span className="text-white/30">
                        to
                      </span>

                      <input
                        type="time"
                        value={item.close}
                        onChange={(e) =>
                          updateHour(
                            index,
                            "close",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-white/30">
                      Closed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* =====================================================
              ORDERING & DELIVERY
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Commerce
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Ordering & Delivery
              </h2>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  title="Online Ordering"
                  description="Allow customers to place food orders."
                  enabled={ordering.onlineOrdering}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      onlineOrdering: value,
                    })
                  }
                />

                <Toggle
                  title="Table Booking"
                  description="Allow customers to reserve tables."
                  enabled={ordering.tableBooking}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      tableBooking: value,
                    })
                  }
                />

                <Toggle
                  title="Delivery"
                  description="Accept delivery orders."
                  enabled={ordering.delivery}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      delivery: value,
                    })
                  }
                />

                <Toggle
                  title="Pickup"
                  description="Allow customers to collect orders."
                  enabled={ordering.pickup}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      pickup: value,
                    })
                  }
                />
              </div>

              <div className="grid gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
                <Input
                  label="Minimum Order ₹"
                  value={ordering.minimumOrder}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      minimumOrder: value,
                    })
                  }
                />

                <Input
                  label="Delivery Fee ₹"
                  value={ordering.deliveryFee}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      deliveryFee: value,
                    })
                  }
                />

                <Input
                  label="Estimated Delivery Time"
                  value={ordering.deliveryTime}
                  onChange={(value) =>
                    setOrdering({
                      ...ordering,
                      deliveryTime: value,
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* =====================================================
              PAYMENTS
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Payments
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Payment Settings
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Choose which payment methods your restaurant
                accepts.
              </p>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <Toggle
                title="UPI Payments"
                description="Accept payments through UPI."
                enabled={payments.upi}
                onChange={(value) =>
                  setPayments({
                    ...payments,
                    upi: value,
                  })
                }
              />

              <Toggle
                title="Cash on Delivery"
                description="Allow customers to pay at delivery."
                enabled={payments.cash}
                onChange={(value) =>
                  setPayments({
                    ...payments,
                    cash: value,
                  })
                }
              />

              <Toggle
                title="Online Card / Net Banking"
                description="Enable online payment gateway."
                enabled={payments.online}
                onChange={(value) =>
                  setPayments({
                    ...payments,
                    online: value,
                  })
                }
              />

              <div className="pt-4">
                <Input
                  label="UPI ID"
                  value={payments.upiId}
                  onChange={(value) =>
                    setPayments({
                      ...payments,
                      upiId: value,
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* =====================================================
              NOTIFICATIONS
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Communication
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Notifications
              </h2>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <Toggle
                title="New Order Alerts"
                description="Get notified whenever a new order arrives."
                enabled={notifications.newOrders}
                onChange={(value) =>
                  setNotifications({
                    ...notifications,
                    newOrders: value,
                  })
                }
              />

              <Toggle
                title="Reservation Alerts"
                description="Get notified about new table reservations."
                enabled={notifications.reservations}
                onChange={(value) =>
                  setNotifications({
                    ...notifications,
                    reservations: value,
                  })
                }
              />

              <Toggle
                title="Customer Messages"
                description="Receive customer communication alerts."
                enabled={notifications.messages}
                onChange={(value) =>
                  setNotifications({
                    ...notifications,
                    messages: value,
                  })
                }
              />

              <Toggle
                title="Email Notifications"
                description="Receive important restaurant updates by email."
                enabled={notifications.email}
                onChange={(value) =>
                  setNotifications({
                    ...notifications,
                    email: value,
                  })
                }
              />

              <Toggle
                title="WhatsApp Notifications"
                description="Send order and booking alerts on WhatsApp."
                enabled={notifications.whatsapp}
                onChange={(value) =>
                  setNotifications({
                    ...notifications,
                    whatsapp: value,
                  })
                }
              />
            </div>
          </section>

          {/* =====================================================
              OWNER ACCOUNT
          ===================================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Security
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Owner Account
              </h2>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Owner Name"
                  value={restaurant.owner}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      owner: value,
                    })
                  }
                />

                <Input
                  label="Account Email"
                  value={restaurant.email}
                  onChange={(value) =>
                    setRestaurant({
                      ...restaurant,
                      email: value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium">
                    Account Password
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Change your owner dashboard password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/forgot-password")
                  }
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.06]"
                >
                  Change Password
                </button>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl border border-red-500/10 bg-red-500/[0.025] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-red-300">
                    Sign out from this account
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    You will need to login again to access the
                    owner dashboard.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </section>

          {/* =====================================================
              SAVE
          ===================================================== */}

          <div className="flex flex-col items-stretch justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">
                Restaurant configuration
              </p>

              <p className="mt-1 text-xs text-white/35">
                Changes are saved securely to your restaurant
                database.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : saved
                ? "✓ Saved Successfully"
                : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   INPUT
============================================================= */

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-white/35">
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
      />
    </label>
  );
}

/* =============================================================
   TEXTAREA
============================================================= */

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-white/35">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/25"
      />
    </label>
  );
}

/* =============================================================
   IMAGE INPUT
============================================================= */

function ImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-white/35">
          {label}
        </span>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
        />
      </label>

      {value && (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
          <img
            src={value}
            alt={label}
            className="h-32 w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}

/* =============================================================
   TOGGLE
============================================================= */

function Toggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-white/10 bg-black/20 p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>

        <p className="mt-1 text-xs leading-5 text-white/35">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-white" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition ${
            enabled
              ? "left-6 bg-black"
              : "left-1 bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}