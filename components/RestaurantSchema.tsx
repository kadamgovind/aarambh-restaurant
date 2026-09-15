export default function RestaurantSchema() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurant`,
    name: "Aarambh Restaurant",
    url: siteUrl,
    description:
      "Aarambh Restaurant offers delicious food, memorable dining, table reservations, and convenient online ordering.",
    servesCuisine: [
      "Indian",
      "Maharashtrian",
      "Chinese",
      "Tandoor",
    ],
    priceRange: "$$",
    menu: `${siteUrl}/menu`,
    acceptsReservations: `${siteUrl}/booking`,
    hasMenu: `${siteUrl}/menu`,
    potentialAction: [
      {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/booking`,
          actionPlatform: [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform",
          ],
        },
        result: {
          "@type": "Reservation",
          name: "Table Reservation",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(restaurantSchema),
      }}
    />
  );
}