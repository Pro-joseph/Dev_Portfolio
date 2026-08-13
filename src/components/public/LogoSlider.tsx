export default function LogoSlider({ names }: { names: string[] }) {
  const loop = names.length > 0 ? [...names, ...names] : [];

  return (
    <div className="relative py-12 border-t border-white/10 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap gap-20 items-center w-max">
        {loop.map((name, i) => (
          <span
            key={i}
            className="text-2xl font-bold tracking-[0.2em] uppercase text-white/20"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
