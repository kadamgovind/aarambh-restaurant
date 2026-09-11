"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RestaurantStatus =
  | "open"
  | "closed"
  | "temporarily_closed";

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
  Monday: {
    open: "11:00",
    close: "23:00",
    closed: false,
  },
  Tuesday: {
    open: "11:00",
    close: "23:00",
    closed: false,
  },
  Wednesday: {
    open: "11:00",
    close: "23:00",
    closed: false,
  },
  Thursday: {
    open: "11:00",
    close: "23:00",
    closed: false,
  },
  Friday: {
    open: "11:00",
    close: "23:30",
    closed: false,
  },
  Saturday: {
    open: "11:00",
    close: "23:30",
    closed: false,
  },
  Sunday: {
    open: "11:00",
    close: "23:00",
    closed: false,
  },
};

const statusOptions: {
  value: RestaurantStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "open",
    label: "Open",
    description:
      "Restaurant is accepting orders and bookings.",
  },
  {
    value: "closed",
    label: "Closed",
    description:
      "Restaurant is currently not operating.",
  },
  {
    value: "temporarily_closed",
    label: "Temporarily Closed",
    description:
      "Restaurant is temporarily unavailable.",
  },
];

function normalizeHours(
  value: Hours | null | undefined
): Hours {
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
  if (!email.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

function isValidTimeRange(
  open: string,
  close: string
) {
  return open < close;
}

/* -------------------------------------------------------------------------- */
/* Reusable form components                                                   */
/* -------------------------------------------------------------------------- */

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
};

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/60 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

type TextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: TextareaProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/60 focus:bg-white/[0.06]"
      />
    </label>
  );
}

type ToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: ToggleProps) {
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
          checked
            ? "bg-[#c9a45c]"
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

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function OwnerSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [restaurantId, setRestaurantId] =
    useState("");

  const [ownerLoginEmail, setOwnerLoginEmail] =
    useState("");

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

  const [hours, setHours] =
    useState<Hours>(defaultHours);

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

  const [notifications, setNotifications] =
    useState({
      newOrders: true,
      reservations: true,
      messages: true,
      email: true,
      whatsapp: false,
    });

  const [restaurantStatus, setRestaurantStatus] =
    useState<RestaurantStatus>("open");

  const days = useMemo(
    () => Object.keys(defaultHours),
    []
  );

  /* ---------------------------------------------------------------------- */
  /* Load settings                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function initializeSettings() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            router.replace("/owner/login");
          }

          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, role, full_name, phone"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile
        ) {
          await supabase.auth.signOut();

          if (!cancelled) {
            router.replace("/owner/login");
          }

          return;
        }

        if (
          profile.role?.toLowerCase() !==
          "owner"
        ) {
          await supabase.auth.signOut();

          if (!cancelled) {
            router.replace("/login");
          }

          return;
        }

        const {
          data: restaurantData,
          error: restaurantError,
        } = await supabase
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
            restaurant_status,
            opening_hours,
            ordering_settings,
            payment_settings,
            notification_settings
          `)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (restaurantError) {
          console.error(
            restaurantError
          );

          if (!cancelled) {
            setError(
              "Unable to load restaurant settings."
            );
          }

          return;
        }

        if (!restaurantData) {
          if (!cancelled) {
            router.replace(
              "/owner/restaurant/new"
            );
          }

          return;
        }

        if (cancelled) {
          return;
        }

        const data =
          restaurantData as Restaurant;

        setOwnerLoginEmail(
          user.email ?? ""
        );

        setRestaurantId(data.id);

        setRestaurant({
          name: data.name ?? "",
          phone:
            data.phone ??
            profile.phone ??
            "",
          email: data.email ?? "",
          description:
            data.description ?? "",
          logo:
            data.logo_url ?? "",
          cover:
            data.cover_image_url ?? "",
        });

        setLocation({
          address:
            data.address ?? "",
          city:
            data.city ?? "",
          state:
            data.state ?? "",
          pincode:
            data.pincode ?? "",
          maps:
            data.maps_url ?? "",
        });

        setHours(
          normalizeHours(
            data.opening_hours
          )
        );

        /* -------------------------------------------------------------- */
        /* Ordering settings                                               */
        /* -------------------------------------------------------------- */

        const savedOrdering =
          data.ordering_settings ?? {};

        setOrdering({
          onlineOrdering:
            typeof savedOrdering.onlineOrdering ===
            "boolean"
              ? savedOrdering.onlineOrdering
              : true,

          tableBooking:
            typeof savedOrdering.tableBooking ===
            "boolean"
              ? savedOrdering.tableBooking
              : true,

          delivery:
            typeof savedOrdering.delivery ===
            "boolean"
              ? savedOrdering.delivery
              : true,

          pickup:
            typeof savedOrdering.pickup ===
            "boolean"
              ? savedOrdering.pickup
              : true,

          minimumOrder:
            typeof savedOrdering.minimumOrder ===
            "string"
              ? savedOrdering.minimumOrder
              : typeof savedOrdering.minimumOrder ===
                  "number"
                ? String(
                    savedOrdering.minimumOrder
                  )
                : "199",

          deliveryFee:
            typeof savedOrdering.deliveryFee ===
            "string"
              ? savedOrdering.deliveryFee
              : typeof savedOrdering.deliveryFee ===
                  "number"
                ? String(
                    savedOrdering.deliveryFee
                  )
                : "40",

          deliveryTime:
            typeof savedOrdering.deliveryTime ===
            "string"
              ? savedOrdering.deliveryTime
              : "35–45 min",
        });

        /* -------------------------------------------------------------- */
        /* Payment settings                                                */
        /* -------------------------------------------------------------- */

        const savedPayments =
          data.payment_settings ?? {};

        setPayments({
          upi:
            typeof savedPayments.upi ===
            "boolean"
              ? savedPayments.upi
              : true,

          cash:
            typeof savedPayments.cash ===
            "boolean"
              ? savedPayments.cash
              : true,

          online:
            typeof savedPayments.online ===
            "boolean"
              ? savedPayments.online
              : true,

          upiId:
            typeof savedPayments.upiId ===
            "string"
              ? savedPayments.upiId
              : "",
        });

        /* -------------------------------------------------------------- */
        /* Notification settings                                           */
        /* -------------------------------------------------------------- */

        const savedNotifications =
          data.notification_settings ?? {};

        setNotifications({
          newOrders:
            typeof savedNotifications.newOrders ===
            "boolean"
              ? savedNotifications.newOrders
              : true,

          reservations:
            typeof savedNotifications.reservations ===
            "boolean"
              ? savedNotifications.reservations
              : true,

          messages:
            typeof savedNotifications.messages ===
            "boolean"
              ? savedNotifications.messages
              : true,

          email:
            typeof savedNotifications.email ===
            "boolean"
              ? savedNotifications.email
              : true,

          whatsapp:
            typeof savedNotifications.whatsapp ===
            "boolean"
              ? savedNotifications.whatsapp
              : false,
        });

        /* -------------------------------------------------------------- */
        /* Restaurant status                                               */
        /* -------------------------------------------------------------- */

        const validStatuses: RestaurantStatus[] =
          [
            "open",
            "closed",
            "temporarily_closed",
          ];

        setRestaurantStatus(
          validStatuses.includes(
            data.restaurant_status
          )
            ? data.restaurant_status
            : data.is_active
              ? "open"
              : "closed"
        );
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "Something went wrong while loading settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeSettings();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ---------------------------------------------------------------------- */
  /* Validation                                                             */
  /* ---------------------------------------------------------------------- */

  function validateSettings() {
    setError("");

    if (!restaurant.name.trim()) {
      setError(
        "Restaurant name is required."
      );

      return false;
    }

    const cleanPhone =
      restaurant.phone.replace(
        /\D/g,
        ""
      );

    if (
      cleanPhone &&
      cleanPhone.length !== 10
    ) {
      setError(
        "Restaurant phone number must contain 10 digits."
      );

      return false;
    }

    if (
      !isValidEmail(
        restaurant.email
      )
    ) {
      setError(
        "Please enter a valid business email."
      );

      return false;
    }

    const cleanPincode =
      location.pincode.replace(
        /\D/g,
        ""
      );

    if (
      cleanPincode &&
      cleanPincode.length !== 6
    ) {
      setError(
        "Pincode must contain 6 digits."
      );

      return false;
    }

    if (
      !isValidUrl(
        location.maps
      )
    ) {
      setError(
        "Please enter a valid Google Maps URL."
      );

      return false;
    }

    const minimumOrder =
      Number(
        ordering.minimumOrder
      );

    const deliveryFee =
      Number(
        ordering.deliveryFee
      );

    if (
      !Number.isFinite(
        minimumOrder
      ) ||
      minimumOrder < 0
    ) {
      setError(
        "Minimum order amount must be a valid positive number."
      );

      return false;
    }

    if (
      !Number.isFinite(
        deliveryFee
      ) ||
      deliveryFee < 0
    ) {
      setError(
        "Delivery fee must be a valid positive number."
      );

      return false;
    }

    for (const day of days) {
      const dayData =
        hours[day];

      if (
        !dayData.closed &&
        !isValidTimeRange(
          dayData.open,
          dayData.close
        )
      ) {
        setError(
          `${day}: closing time must be later than opening time.`
        );

        return false;
      }
    }

    return true;
  }

  /* ---------------------------------------------------------------------- */
  /* Save settings                                                          */
  /* ---------------------------------------------------------------------- */

  async function handleSave() {
    if (!validateSettings()) {
      return;
    }

    if (!restaurantId) {
      setError(
        "Restaurant information is missing."
      );

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

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profileError ||
        !profile
      ) {
        await supabase.auth.signOut();

        router.replace(
          "/owner/login"
        );

        return;
      }

      if (
        profile.role?.toLowerCase() !==
        "owner"
      ) {
        await supabase.auth.signOut();

        router.replace(
          "/login"
        );

        return;
      }

      const cleanPhone =
        restaurant.phone.replace(
          /\D/g,
          ""
        );

      const cleanPincode =
        location.pincode.replace(
          /\D/g,
          ""
        );

      const minimumOrder =
        Number(
          ordering.minimumOrder
        );

      const deliveryFee =
        Number(
          ordering.deliveryFee
        );

      /* -------------------------------------------------------------- */
      /* Opening hours                                                   */
      /* -------------------------------------------------------------- */

      const openingHours =
        days.reduce<
          Record<string, DayHours>
        >(
          (result, day) => {
            result[day] = {
              open:
                hours[day].open,
              close:
                hours[day].close,
              closed:
                hours[day].closed,
            };

            return result;
          },
          {}
        );

      /* -------------------------------------------------------------- */
      /* Ordering settings                                               */
      /* -------------------------------------------------------------- */

      const orderingSettings = {
        pickup:
          ordering.pickup,

        delivery:
          ordering.delivery,

        onlineOrdering:
          ordering.onlineOrdering,

        tableBooking:
          ordering.tableBooking,

        minimumOrder,

        deliveryFee,

        deliveryTime:
          ordering.deliveryTime.trim(),
      };

      /* -------------------------------------------------------------- */
      /* Payment settings                                                */
      /* -------------------------------------------------------------- */

      const paymentSettings = {
        cash:
          payments.cash,

        upi:
          payments.upi,

        online:
          payments.online,

        upiId:
          payments.upiId.trim(),
      };

      /* -------------------------------------------------------------- */
      /* Notification settings                                           */
      /* -------------------------------------------------------------- */

      const notificationSettings = {
        email:
          notifications.email,

        whatsapp:
          notifications.whatsapp,

        newOrders:
          notifications.newOrders,

        reservations:
          notifications.reservations,

        messages:
          notifications.messages,
      };

      /* -------------------------------------------------------------- */
      /* Database update                                                  */
      /* -------------------------------------------------------------- */

      const {
        error: updateError,
      } = await supabase
        .from("restaurants")
        .update({
          name:
            restaurant.name.trim(),

          description:
            restaurant.description.trim() ||
            null,

          phone:
            cleanPhone || null,

          email:
            restaurant.email.trim() ||
            null,

          address:
            location.address.trim() ||
            null,

          city:
            location.city.trim() ||
            null,

          state:
            location.state.trim() ||
            null,

          pincode:
            cleanPincode || null,

          logo_url:
            restaurant.logo.trim() ||
            null,

          cover_image_url:
            restaurant.cover.trim() ||
            null,

          maps_url:
            location.maps.trim() ||
            null,

          is_active:
            restaurantStatus ===
            "open",

          restaurant_status:
            restaurantStatus,

          opening_hours:
            openingHours,

          ordering_settings:
            orderingSettings,

          payment_settings:
            paymentSettings,

          notification_settings:
            notificationSettings,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          restaurantId
        )
        .eq(
          "owner_id",
          user.id
        );

      if (updateError) {
        console.error(
          updateError
        );

        setError(
          updateError.message ||
            "Unable to save restaurant settings."
        );

        return;
      }

      setSuccess(
        "Restaurant settings saved successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        "Something went wrong while saving settings."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Hours                                                                  */
  /* ---------------------------------------------------------------------- */

  function updateHour(
    day: string,
    field: keyof DayHours,
    value: string | boolean
  ) {
    setHours(
      (current) => ({
        ...current,

        [day]: {
          ...current[day],
          [field]: value,
        },
      })
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Sign out                                                               */
  /* ---------------------------------------------------------------------- */

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.replace(
      "/owner/login"
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Loading state                                                           */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070707] text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

            <p className="text-sm text-white/50">
              Loading restaurant settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Page UI                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
                Owner Dashboard
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Restaurant Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Manage your restaurant profile,
                location, opening hours, ordering,
                payments and notifications.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-4 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="space-y-6">

          {/* Restaurant Status */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Availability
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Restaurant Status
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Control whether your restaurant is
                currently accepting customers.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {statusOptions.map(
                (option) => {
                  const selected =
                    restaurantStatus ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        setRestaurantStatus(
                          option.value
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#c9a45c]/60 bg-[#c9a45c]/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-sm font-semibold ${
                            selected
                              ? "text-[#c9a45c]"
                              : "text-white"
                          }`}
                        >
                          {option.label}
                        </span>

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            selected
                              ? "bg-[#c9a45c]"
                              : "bg-white/20"
                          }`}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-5 text-white/40">
                        {
                          option.description
                        }
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* Restaurant Profile */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Identity
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Restaurant Profile
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Basic information displayed across
                the customer-facing website.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Restaurant Name"
                value={
                  restaurant.name
                }
                onChange={(value) =>
                  setRestaurant(
                    (current) => ({
                      ...current,
                      name: value,
                    })
                  )
                }
                placeholder="Restaurant name"
              />

              <Input
                label="Phone"
                value={
                  restaurant.phone
                }
                onChange={(value) =>
                  setRestaurant(
                    (current) => ({
                      ...current,
                      phone: value,
                    })
                  )
                }
                placeholder="10 digit phone number"
                type="tel"
              />

              <Input
                label="Business Email"
                value={
                  restaurant.email
                }
                onChange={(value) =>
                  setRestaurant(
                    (current) => ({
                      ...current,
                      email: value,
                    })
                  )
                }
                placeholder="restaurant@example.com"
                type="email"
              />

              <Input
                label="Logo URL"
                value={
                  restaurant.logo
                }
                onChange={(value) =>
                  setRestaurant(
                    (current) => ({
                      ...current,
                      logo: value,
                    })
                  )
                }
                placeholder="https://..."
              />

              <div className="md:col-span-2">
                <Input
                  label="Cover Image URL"
                  value={
                    restaurant.cover
                  }
                  onChange={(value) =>
                    setRestaurant(
                      (current) => ({
                        ...current,
                        cover: value,
                      })
                    )
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Restaurant Description"
                  value={
                    restaurant.description
                  }
                  onChange={(value) =>
                    setRestaurant(
                      (current) => ({
                        ...current,
                        description:
                          value,
                      })
                    )
                  }
                  placeholder="Tell customers about your restaurant..."
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Location
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Restaurant Location
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Keep your address and map information
                up to date for customers.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={
                    location.address
                  }
                  onChange={(value) =>
                    setLocation(
                      (current) => ({
                        ...current,
                        address:
                          value,
                      })
                    )
                  }
                  placeholder="Full restaurant address"
                />
              </div>

              <Input
                label="City"
                value={
                  location.city
                }
                onChange={(value) =>
                  setLocation(
                    (current) => ({
                      ...current,
                      city: value,
                    })
                  )
                }
                placeholder="City"
              />

              <Input
                label="State"
                value={
                  location.state
                }
                onChange={(value) =>
                  setLocation(
                    (current) => ({
                      ...current,
                      state: value,
                    })
                  )
                }
                placeholder="State"
              />

              <Input
                label="Pincode"
                value={
                  location.pincode
                }
                onChange={(value) =>
                  setLocation(
                    (current) => ({
                      ...current,
                      pincode:
                        value,
                    })
                  )
                }
                placeholder="6 digit pincode"
                type="text"
              />

              <Input
                label="Google Maps URL"
                value={
                  location.maps
                }
                onChange={(value) =>
                  setLocation(
                    (current) => ({
                      ...current,
                      maps: value,
                    })
                  )
                }
                placeholder="https://maps.google.com/..."
              />
            </div>
          </section>

          {/* Opening Hours */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Schedule
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Opening Hours
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Set the hours during which customers
                can visit or place orders.
              </p>
            </div>

            <div className="space-y-3">
              {days.map(
                (day) => {
                  const dayData =
                    hours[day];

                  return (
                    <div
                      key={day}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-[130px]">
                          <p className="text-sm font-medium text-white">
                            {day}
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            {dayData.closed
                              ? "Closed"
                              : `${dayData.open} – ${dayData.close}`}
                          </p>
                        </div>

                        <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <label className="block">
                            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
                              Opening
                            </span>

                            <input
                              type="time"
                              value={
                                dayData.open
                              }
                              disabled={
                                dayData.closed
                              }
                              onChange={(
                                event
                              ) =>
                                updateHour(
                                  day,
                                  "open",
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9a45c]/60 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
                              Closing
                            </span>

                            <input
                              type="time"
                              value={
                                dayData.close
                              }
                              disabled={
                                dayData.closed
                              }
                              onChange={(
                                event
                              ) =>
                                updateHour(
                                  day,
                                  "close",
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9a45c]/60 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </label>

                          <label className="flex items-end">
                            <span className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={
                                  dayData.closed
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateHour(
                                    day,
                                    "closed",
                                    event
                                      .target
                                      .checked
                                  )
                                }
                                className="h-4 w-4 accent-[#c9a45c]"
                              />

                              <span className="text-xs text-white/60">
                                Closed
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {/* Ordering & Delivery */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Commerce
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Ordering & Delivery
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Configure how customers can order from
                your restaurant.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                label="Online Ordering"
                description="Allow customers to place online orders."
                checked={
                  ordering.onlineOrdering
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      onlineOrdering:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Table Booking"
                description="Allow customers to reserve tables."
                checked={
                  ordering.tableBooking
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      tableBooking:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Delivery"
                description="Allow customers to request delivery."
                checked={
                  ordering.delivery
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      delivery:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Pickup"
                description="Allow customers to collect orders."
                checked={
                  ordering.pickup
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      pickup:
                        value,
                    })
                  )
                }
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <Input
                label="Minimum Order"
                value={
                  ordering.minimumOrder
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      minimumOrder:
                        value,
                    })
                  )
                }
                type="number"
                placeholder="199"
              />

              <Input
                label="Delivery Fee"
                value={
                  ordering.deliveryFee
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      deliveryFee:
                        value,
                    })
                  )
                }
                type="number"
                placeholder="40"
              />

              <Input
                label="Delivery Time"
                value={
                  ordering.deliveryTime
                }
                onChange={(value) =>
                  setOrdering(
                    (current) => ({
                      ...current,
                      deliveryTime:
                        value,
                    })
                  )
                }
                placeholder="35–45 min"
              />
            </div>
          </section>

          {/* Payments */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Checkout
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Payments
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Choose the payment methods available to
                customers.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Toggle
                label="UPI"
                description="Accept UPI payments."
                checked={
                  payments.upi
                }
                onChange={(value) =>
                  setPayments(
                    (current) => ({
                      ...current,
                      upi: value,
                    })
                  )
                }
              />

              <Toggle
                label="Cash"
                description="Accept cash payments."
                checked={
                  payments.cash
                }
                onChange={(value) =>
                  setPayments(
                    (current) => ({
                      ...current,
                      cash: value,
                    })
                  )
                }
              />

              <Toggle
                label="Online Payment"
                description="Accept online payments."
                checked={
                  payments.online
                }
                onChange={(value) =>
                  setPayments(
                    (current) => ({
                      ...current,
                      online:
                        value,
                    })
                  )
                }
              />
            </div>

            <div className="mt-5">
              <Input
                label="UPI ID"
                value={
                  payments.upiId
                }
                onChange={(value) =>
                  setPayments(
                    (current) => ({
                      ...current,
                      upiId: value,
                    })
                  )
                }
                placeholder="restaurant@upi"
              />
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Alerts
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Notifications
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Configure which restaurant events should
                generate notifications.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                label="New Orders"
                description="Receive alerts for new customer orders."
                checked={
                  notifications.newOrders
                }
                onChange={(value) =>
                  setNotifications(
                    (current) => ({
                      ...current,
                      newOrders:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Reservations"
                description="Receive alerts for table reservations."
                checked={
                  notifications.reservations
                }
                onChange={(value) =>
                  setNotifications(
                    (current) => ({
                      ...current,
                      reservations:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Messages"
                description="Receive alerts for customer messages."
                checked={
                  notifications.messages
                }
                onChange={(value) =>
                  setNotifications(
                    (current) => ({
                      ...current,
                      messages:
                        value,
                    })
                  )
                }
              />

              <Toggle
                label="Email Notifications"
                description="Enable email notifications."
                checked={
                  notifications.email
                }
                onChange={(value) =>
                  setNotifications(
                    (current) => ({
                      ...current,
                      email: value,
                    })
                  )
                }
              />

              <Toggle
                label="WhatsApp Notifications"
                description="Enable WhatsApp notifications when configured."
                checked={
                  notifications.whatsapp
                }
                onChange={(value) =>
                  setNotifications(
                    (current) => ({
                      ...current,
                      whatsapp:
                        value,
                    })
                  )
                }
              />
            </div>
          </section>

          {/* Owner Account */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9a45c]">
                Account
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Owner Account
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Your owner login information.
              </p>
            </div>

            <Input
              label="Owner Login Email"
              value={
                ownerLoginEmail
              }
              onChange={() => {}}
              type="email"
              disabled
            />
          </section>

          {/* Save */}
          <section className="sticky bottom-4 z-20">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#c9a45c]/20 bg-[#0b0b0b]/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium text-white">
                  Save your changes
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Your restaurant settings will be
                  updated immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
                className="inline-flex min-w-[180px] items-center justify-center rounded-xl bg-[#c9a45c] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d7b46f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save All Changes"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}