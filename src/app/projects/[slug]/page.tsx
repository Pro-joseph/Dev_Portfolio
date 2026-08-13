import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api";
import { Project } from "@/lib/types";
import SubNav from "@/components/public/SubNav";
import Markdown from "@/components/public/Markdown";
import ProjectLightbox from "@/components/public/ProjectLightbox";
import Link from "next/link";
import { FaExternalLinkAlt, FaGithub, FaCheck, FaChevronRight } from "react-icons/fa";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await serverFetch<{ data: Project }>(`/projects/${slug}`);
    return { title: data.title, description: data.summary ?? undefined };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  let project: Project;
  try {
    const { data } = await serverFetch<{ data: Project }>(`/projects/${slug}`);
    project = data;
  } catch {
    notFound();
  }

  const demoLink = project.links.find((l) => l.type === "demo");
  const githubLink = project.links.find((l) => l.type === "github");
  const otherLinks = project.links.filter((l) => l.type !== "demo" && l.type !== "github");
  const images = [project.cover, ...project.gallery].filter(
    (m): m is NonNullable<typeof m> => Boolean(m?.url)
  );

  return (
    <>
      <SubNav />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 text-xs font-mono text-secondary mb-8 uppercase tracking-widest">
            <Link href="/#projects" className="hover:text-primary transition-colors">
              Projects
            </Link>
            <FaChevronRight className="text-[10px]" />
            <span className="text-primary font-bold">{project.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-8">
              <h1 className="text-4xl md:text-7xl font-bold mb-6">{project.title}</h1>
              <p className="text-lg md:text-xl text-secondary leading-relaxed mb-8">
                {project.summary ?? project.description?.split("\n")[0]}
              </p>
              <div className="flex flex-wrap gap-3">
                {project.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-4 py-1.5 bg-card rounded-full text-xs font-mono font-bold text-secondary border border-line"
                  >
                    {skill.name.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-end gap-4">
              {demoLink && (
                <a
                  href={demoLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-primary text-white py-4 rounded-lg font-bold text-center hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <FaExternalLinkAlt /> {demoLink.label}
                </a>
              )}
              {githubLink && (
                <a
                  href={githubLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full border border-line py-4 rounded-lg font-bold text-center hover:bg-elevated transition-colors flex items-center justify-center gap-2"
                >
                  <FaGithub /> {githubLink.label}
                </a>
              )}
            </div>
          </div>

          {images.length > 0 && (
            <div className="mb-24">
              <ProjectLightbox images={images} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-8">
              {project.description && <Markdown content={project.description} />}

              {otherLinks.length > 0 && (
                <div className="mt-16 flex flex-wrap gap-4">
                  {otherLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary hover:border-accent hover:text-accent transition-all pb-1"
                    >
                      <FaExternalLinkAlt className="text-[10px]" /> {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-12">
                {project.role_on_project && (
                  <div>
                    <h4 className="text-xs font-mono font-bold text-secondary uppercase tracking-[0.2em] mb-4">Role</h4>
                    <p className="font-bold text-lg">{project.role_on_project}</p>
                  </div>
                )}
                {(project.started_on || project.completed_on) && (
                  <div>
                    <h4 className="text-xs font-mono font-bold text-secondary uppercase tracking-[0.2em] mb-4">Timeline</h4>
                    <p className="font-bold text-lg">
                      {project.started_on?.slice(0, 7) ?? "—"} — {project.completed_on?.slice(0, 7) ?? "Present"}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-mono font-bold text-secondary uppercase tracking-[0.2em] mb-4">Tech Stack</h4>
                  <ul className="space-y-2 font-medium">
                    {project.skills.map((skill) => (
                      <li key={skill.id} className="flex items-center gap-3">
                        <FaCheck className="text-green-500 text-xs" /> {skill.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-card rounded-xl border border-line">
                  <h4 className="text-sm font-bold mb-3">Project Status</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${project.status === "published" ? "bg-green-500" : "bg-amber-400"}`} />
                    <span className="text-sm font-medium capitalize">
                      {project.status === "published" ? "In Production" : project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
