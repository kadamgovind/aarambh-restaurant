const principles = [
  {
    number: "01",
    title: "Fresh Ingredients",
    description:
      "We believe great food starts with good ingredients. Every dish is prepared with carefully selected ingredients for a fresh and satisfying experience.",
  },
  {
    number: "02",
    title: "Authentic Flavours",
    description:
      "From Maharashtrian favourites to Indian classics, our kitchen respects traditional flavours while keeping every dish enjoyable for today's guests.",
  },
  {
    number: "03",
    title: "Made With Care",
    description:
      "Every order is prepared with attention to taste, presentation and consistency so that every visit feels as good as the last.",
  },
  {
    number: "04",
    title: "Made For Families",
    description:
      "Aarambh is designed as a welcoming place for families, couples and friends to share good food and create memorable moments together.",
  },
];

export default function Philosophy() {
  return (
    <section className="border-b border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-3 lg:gap-20">
          {/* Section Introduction */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Our Philosophy
            </p>

            <h2 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-5xl">
              Crafted With
              <br />
              <span className="text-white/80">Heart.</span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/40">
              At Aarambh, our philosophy is simple — serve delicious food,
              create a welcoming atmosphere and make every guest feel at home.
            </p>
          </div>

          {/* Principles */}
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-2">
            {principles.map((principle) => (
              <div
                key={principle.number}
                className="group border-t border-white/10 pt-6 transition-colors duration-300 hover:border-[#c9a45c]/50"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/35 transition-colors duration-300 group-hover:text-[#c9a45c]">
                  {principle.number}
                </p>

                <h3 className="mt-4 text-xl font-medium tracking-tight text-white">
                  {principle.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/50">
                  {principle.description}
                </p>

                <div className="mt-6 h-px w-5 bg-[#c9a45c]/50 transition-all duration-300 group-hover:w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}