import { Project } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const images = [project.cover, ...project.gallery]
    .filter(Boolean)
    .slice(0, 3) as NonNullable<Project["cover"]>[];

  return (
    <Link href={`/projects/${project.slug}`} className="group block cursor-pointer">
      <div className="bg-white p-8 rounded-jumbo shadow-sm ring-1 ring-line transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:ring-accent/30 h-full flex flex-col">
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-accent font-bold tracking-widest px-2 py-0.5 bg-accent/5 rounded-full border border-accent/20">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-secondary font-mono">
                /projects
              </span>
            </div>
            <h3 className="text-2xl font-bold font-heading tracking-tight pt-3 group-hover:text-accent transition-colors">
              {project.title}
            </h3>
            <p className="text-secondary text-sm">{project.client ?? "Personal project"}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) =>
            images[i] ? (
              <Image
                key={i}
                className="w-full aspect-[4/5] object-cover rounded-xl grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-500"
                src={images[i].url ?? ""}
                alt={images[i].alt_text ?? project.title}
                width={320}
                height={400}
                sizes="(max-width: 768px) 33vw, 320px"
              />
            ) : (
              <div key={i} className="w-full aspect-[4/5] rounded-xl bg-card" />
            )
          )}
        </div>
        <div className="mt-auto pt-8 flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest uppercase text-secondary">
            {project.status === "published" ? "Live" : project.status}
          </span>
          <span className="flex items-center gap-2 text-sm font-bold text-accent opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            View case study <FaArrowRight className="text-xs" />
          </span>
        </div>
      </div>
    </Link>
  );
}