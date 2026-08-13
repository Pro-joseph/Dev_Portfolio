import type { Metadata } from "next";
import { serverFetch } from "@/lib/api";
import { Paginated, ProjectListItem } from "@/lib/types";
import SubNav from "@/components/public/SubNav";
import Link from "next/link";
import { FaLongArrowAltRight } from "react-icons/fa";

export const metadata: Metadata = {
  title: "All Projects",
  description: "A selection of systems, platforms, and tools engineered from the database up.",
};

export default async function ProjectsPage() {
  const { data } = await serverFetch<Paginated<ProjectListItem>>("/projects?per_page=50");

  return (
    <>
      <SubNav label="Back to Portfolio" />
      <main className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-16">
            <p className="text-secondary text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
              SELECT * FROM projects
            </p>
            <h1 className="font-heading text-5xl font-bold">All Projects</h1>
          </header>

          <div className="border-t border-line">
            {data.map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group py-12 border-b border-line grid grid-cols-1 md:grid-cols-12 gap-8 items-center hover:bg-elevated transition-colors px-4"
              >
                <div className="md:col-span-1 font-mono text-secondary text-sm">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="md:col-span-7">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-secondary">{project.summary ?? project.client ?? ""}</p>
                </div>
                <div className="md:col-span-2 font-mono text-xs text-secondary space-y-1">
                  <p>VIEWS: {project.views_count >= 1000 ? `${(project.views_count / 1000).toFixed(1)}K` : project.views_count}</p>
                  <p className="capitalize">STATUS: {project.status}</p>
                </div>
                <div className="md:col-span-2 text-right">
                  <span className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                    View <FaLongArrowAltRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
