import LogoSlider from "./LogoSlider";
import type { Dictionary } from "@/lib/i18n";

export default function Cta({
  email,
  techNames,
  available = true,
  t,
}: {
  email?: string | null;
  techNames: string[];
  available?: boolean;
  t: Dictionary;
}) {
  return (
    <section id="contact" className="py-32 px-6 bg-primary text-white overflow-hidden relative">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="container mx-auto text-center mb-20 relative">
        {available && (
          <p className="inline-flex items-center gap-2 mb-6 text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/50">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {t.hero.openToWork}
          </p>
        )}
        <h2 className="font-heading text-4xl md:text-6xl lg:text-8xl font-bold mb-10 leading-[0.95] tracking-tight max-w-5xl mx-auto">
          {t.cta.heading}
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          {t.cta.body}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <a
            href={email ? `mailto:${email}` : "#contact"}
            className="inline-block bg-white text-primary px-12 py-5 rounded-xl font-bold tracking-[0.15em] uppercase hover:bg-accent hover:text-white transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/20"
          >
            {t.nav.getInTouch}
          </a>
          {email && (
            <span className="font-mono text-sm text-gray-400">{email}</span>
          )}
        </div>
      </div>
      <div className="relative">
        <LogoSlider names={techNames} />
      </div>
    </section>
  );
}
