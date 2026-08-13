import { FaLongArrowAltRight } from "react-icons/fa";
import Link from "next/link";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
}

export default function SectionHeader({ eyebrow, title, subtitle, viewAllHref }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-14">
      <div>
        <p className="flex items-center gap-3 text-secondary text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
          <span className="inline-block w-8 h-px bg-accent" />
          {eyebrow}
        </p>
        <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-5 text-secondary text-lg max-w-xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-2 text-sm font-bold tracking-widest uppercase hover:text-accent transition-colors whitespace-nowrap"
        >
          View All
          <FaLongArrowAltRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}