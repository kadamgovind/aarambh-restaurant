const highlights = [
  {
    value: "Fresh",
    label: "Prepared with Care",
  },
  {
    value: "Veg +",
    label: "Non-Veg Options",
  },
  {
    value: "Varied",
    label: "Dining Choices",
  },
  {
    value: "Every Day",
    label: "Welcoming Hospitality",
  },
];

export default function TrustStats() {
  return (
    <section
      className="border-y border-white/10 bg-[#0a0a0a]"
      aria-label="Restaurant highlights"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
        {highlights.map((item, index) => (
          <div
            key={item.label}
            className={`
              relative px-5 py-10 text-center sm:py-12
              ${
                index % 2 !== 0
                  ? "border-l border-white/10"
                  : ""
              }
              ${
                index >= 2
                  ? "border-t border-white/10 sm:border-t-0"
                  : ""
              }
              ${
                index >= 1
                  ? "sm:border-l sm:border-white/10"
                  : ""
              }
            `}
          >
            <p className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              {item.value}
            </p>

            <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.18em] text-white/40 sm:text-xs">
              {item.label}
            </p>

            <div
              className="mx-auto mt-5 h-px w-6 bg-[#c9a45c]/60"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </section>
  );
}