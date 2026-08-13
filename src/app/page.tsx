import { serverFetch } from "@/lib/server-api";
import {
  Paginated,
  Project,
  ProjectListItem,
  SiteData,
  SkillCategory,
  Testimonial,
} from "@/lib/types";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import SectionHeader from "@/components/public/SectionHeader";
import ProjectCard from "@/components/public/ProjectCard";
import SkillCard from "@/components/public/SkillCard";
import TestimonialCard from "@/components/public/TestimonialCard";
import Gallery from "@/components/public/Gallery";
import Cta from "@/components/public/Cta";
import Reveal from "@/components/public/Reveal";
import { FaArrowRight, FaChevronDown } from "react-icons/fa";

export default async function HomePage() {
  const [site, featuredList, skills, testimonials] = await Promise.all([
    serverFetch<SiteData>("/site"),
    serverFetch<Paginated<ProjectListItem>>("/projects?featured=true&per_page=3"),
    serverFetch<{ data: SkillCategory[] }>("/skills"),
    serverFetch<{ data: Testimonial[] }>("/testimonials"),
  ]);

  const featuredDetails = await Promise.all(
    featuredList.data.map((p) =>
      serverFetch<{ data: Project }>(`/projects/${p.slug}`)
    )
  );
  const featuredProjects = featuredDetails.map((d) => d.data);

  const galleryImages = [
    ...new Map(
      featuredProjects
        .flatMap((p) => [p.cover, ...p.gallery])
        .filter((m): m is NonNullable<typeof m> => Boolean(m?.url))
        .map((m) => [m.url, m] as const)
    ).values(),
  ].slice(0, 4);

  const skillCategories = skills.data;
  const techNames = skillCategories.flatMap((c) => c.skills.map((s) => s.name)).slice(0, 12);
  const totalSkills = skillCategories.reduce((n, c) => n + c.skills.length, 0);
  const settings = site.settings as {
    site_tagline?: string;
    site_description?: string;
    author_role?: string;
    hero_image?: string;
    contact_email?: string;
  };

  return (
    <>
      <Nav resumeUrl={site.resume?.url} />

      {/* Hero */}
      <header className="relative min-h-screen pt-32 pb-16 px-6 flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 dot-grid pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="flex items-center gap-3 text-secondary text-xs tracking-[0.2em] uppercase mb-6 font-semibold">
                  <span className="inline-block w-8 h-px bg-accent" />
                  {settings.author_role?.toUpperCase() ?? "SYSTEMS ARCHITECT"}
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-tight mb-8">
                  {settings.site_tagline ??
                    "Engineering robust digital systems from the database up"}
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-lg md:text-xl text-secondary max-w-2xl mb-12 leading-relaxed">
                  {settings.site_description ??
                    "Full-stack developer with extensive experience in backend systems, databases, and software architecture."}
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap items-center gap-6">
                  <a
                    href="#projects"
                    className="group inline-flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-accent/20"
                  >
                    View My Work
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <div className="flex items-center gap-2 font-mono text-xs text-secondary uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Open to work
                  </div>
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-5 flex justify-center">
              {settings.hero_image && (
                <Reveal delay={200} className="w-full max-w-md">
                  <div className="relative aspect-video rounded-jumbo overflow-hidden shadow-2xl ring-1 ring-line group">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={settings.hero_image}
                      alt="JosephLab abstract software dashboard"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-surface/80 backdrop-blur-md px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest text-secondary">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      environment: production
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>

          {/* Quick stats strip */}
          <Reveal delay={320}>
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-jumbo overflow-hidden border border-line">
              {[
                { label: "Featured Projects", value: String(featuredProjects.length).padStart(2, "0") },
                { label: "Skill Categories", value: String(skillCategories.length).padStart(2, "0") },
                { label: "Technologies", value: String(totalSkills).padStart(2, "0") },
                { label: "Status", value: "OPEN" },
              ].map((stat) => (
                <div key={stat.label} className="bg-elevated py-6 px-6 flex flex-col gap-1">
                  <span className="font-mono text-2xl font-bold text-primary">{stat.value}</span>
                  <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="flex justify-center mt-14 text-secondary">
            <a href="#projects" aria-label="Scroll to projects" className="animate-bounce">
              <FaChevronDown className="text-2xl" />
            </a>
          </div>
        </div>
      </header>

      {/* Featured Projects */}
      <section id="projects" className="py-24 px-6 bg-elevated">
        <div className="container mx-auto">
          <Reveal>
            <SectionHeader
              eyebrow="SELECT * FROM featured_projects"
              title="Featured Projects"
              subtitle="A selection of systems I've architected and shipped — from distributed backends to full application stacks."
              viewAllHref="/projects"
            />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project, i) => (
              <Reveal key={project.id} delay={i * 100}>
                <ProjectCard project={project} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <Reveal>
            <div className="mb-12">
              <p className="flex items-center gap-3 text-secondary text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
                <span className="inline-block w-8 h-px bg-accent" />
                GALLERY
              </p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
                Systems &amp; Infrastructure
              </h2>
              <p className="mt-5 text-secondary text-lg max-w-xl leading-relaxed">
                Click any image to explore it up close.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Gallery images={galleryImages} />
          </Reveal>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="py-24 px-6 bg-elevated">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
            <Reveal className="lg:col-span-6">
              <p className="flex items-center gap-3 text-secondary text-xs tracking-[0.2em] uppercase mb-4 font-semibold">
                <span className="inline-block w-8 h-px bg-accent" />
                TECHNICAL PROFICIENCY
              </p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-8">
                A comprehensive toolkit for building robust systems.
              </h2>
              <p className="text-secondary text-lg leading-relaxed">
                From low-level systems programming to high-level application architecture, I
                bring deep expertise across the entire stack to every engagement.
              </p>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-6 flex items-center">
              <div className="bg-white p-10 rounded-jumbo shadow-sm ring-1 ring-line w-full">
                <div className="font-mono text-sm space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b border-line">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-secondary">system_monitor.sh</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-2">
                    <span className="text-secondary">SYSTEM_STATUS</span>
                    <span className="text-green-600">ONLINE</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-2">
                    <span className="text-secondary">CATEGORIES</span>
                    <span>{String(skillCategories.length).padStart(2, "0")}</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-2">
                    <span className="text-secondary">SKILLS</span>
                    <span>{totalSkills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">STATUS</span>
                    <span className="text-green-600">OPEN TO WORK</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {skillCategories.map((category, i) => (
              <Reveal key={category.id} delay={i * 100}>
                <SkillCard category={category} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.data.length > 0 && (
        <section className="py-24 px-6">
          <div className="container mx-auto">
            <Reveal>
              <SectionHeader
                eyebrow="CLIENT FEEDBACK"
                title="What People Say"
                subtitle="Collaborators and clients on what it's like to build with me."
              />
            </Reveal>
            <Reveal delay={100}>
              <div className="flex gap-8 overflow-x-auto pb-6 snap-x scrollbar-thin">
                {testimonials.data.map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <Reveal>
        <Cta email={settings.contact_email} techNames={techNames} />
      </Reveal>

      <Footer socialLinks={site.social_links} />
    </>
  );
}