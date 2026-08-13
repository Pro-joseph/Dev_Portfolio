import { SocialLink } from "@/lib/types";
import { socialIcon } from "@/lib/icons";

export default function Footer({ socialLinks }: { socialLinks: SocialLink[] }) {
  return (
    <footer className="pt-0 pb-12 px-6 bg-elevated border-t border-line">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start py-16 gap-12">
          <div className="w-full md:w-1/2">
            <p className="flex items-center gap-3 text-secondary text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
              <span className="inline-block w-8 h-px bg-accent" />
              JOSEPHLAB
            </p>
            <h2 className="font-heading text-6xl md:text-8xl font-bold tracking-tight leading-[0.9]">
              Youssef Jdira
            </h2>
            <p className="mt-6 text-secondary max-w-md leading-relaxed">
              Systems architect building resilient backends and databases that scale from
              prototype to production.
            </p>
          </div>
          <div className="w-full md:w-1/4 flex flex-col gap-3">
            {socialLinks.map((link) => {
              const Icon = socialIcon(link.platform);
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 text-xl capitalize hover:text-accent transition-colors"
                >
                  <Icon className="text-lg group-hover:scale-110 transition-transform" />
                  {link.platform}
                </a>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center pt-12 border-t border-line text-secondary text-sm">
          <p>© {new Date().getFullYear()} Youssef Jdira. All rights reserved.</p>
          <p className="mt-4 md:mt-0 font-mono text-xs uppercase tracking-widest">
            Engineered in Munich
          </p>
        </div>
      </div>
    </footer>
  );
}