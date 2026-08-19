import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlugTyped } from "@/lib/resources";
import { loadSiteSettings } from "@/lib/site-config";
import { getDictionary } from "@/lib/i18n";
import SubNav from "@/components/public/SubNav";
import Markdown from "@/components/public/Markdown";
import Link from "next/link";
import { FaExternalLinkAlt, FaGithub, FaChevronRight } from "react-icons/fa";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  try {
    const project = await getProjectBySlugTyped(slug, locale);
    return { title: project?.title ?? t.projects.breadcrumb, description: project?.summary ?? undefined };
  } catch {
    return { title: t.projects.breadcrumb };
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  const [project, settings] = await Promise.all([
    getProjectBySlugTyped(slug, locale),
    loadSiteSettings(locale),
  ]);
  if (!project) notFound();

  const demoLink = project.links.find((l) => l.type === "demo");
  const githubLink = project.links.find((l) => l.type === "github");
  const otherLinks = project.links.filter((l) => l.type !== "demo" && l.type !== "github");

  return (
    <>
      <SubNav authorName={settings.author_name} locale={locale} t={t} />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 text-xs font-mono text-secondary mb-10 uppercase tracking-widest">
            <Link href={`/${locale}#projects`} className="hover:text-primary transition-colors">
              {t.projects.breadcrumb}
            </Link>
            <FaChevronRight className="text-[10px]" />
            <span className="text-primary font-bold">{project.title}</span>
          </div>

          <header className="max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">{project.title}</h1>
            <p className="text-lg md:text-xl text-secondary leading-relaxed mb-10">
              {project.summary ?? project.description?.split("\n")[0]}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {project.role_on_project && (
                <span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary mr-2">
                    {t.projects.role}
                  </span>
                  <span className="font-bold">{project.role_on_project}</span>
                </span>
              )}
              {(project.started_on || project.completed_on) && (
                <span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary mr-2">
                    {t.projects.timeline}
                  </span>
                  <span className="font-bold">
                    {project.started_on?.slice(0, 7) ?? t.certifications.dash} — {project.completed_on?.slice(0, 7) ?? t.projects.present}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${project.status === "published" ? "bg-green-500" : "bg-amber-400"}`}
                />
                <span className="font-bold capitalize">{t.status[project.status] ?? project.status}</span>
              </span>
            </div>

            {project.skills.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                {project.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-4 py-1.5 bg-card rounded-full text-xs font-mono font-bold text-secondary border border-line"
                  >
                    {skill.name.toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            {(demoLink || githubLink) && (
              <div className="flex flex-wrap gap-4 mt-10">
                {demoLink && (
                  <a
                    href={demoLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    <FaExternalLinkAlt /> {demoLink.label}
                  </a>
                )}
                {githubLink && (
                  <a
                    href={githubLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-line px-8 py-4 rounded-xl font-bold hover:bg-elevated transition-colors"
                  >
                    <FaGithub /> {githubLink.label}
                  </a>
                )}
              </div>
            )}
          </header>

          <article className="max-w-4xl mx-auto">
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
          </article>
        </div>
      </main>
    </>
  );
}