import { getSiteData, getProjectsFull, getSkillCategories, getTestimonialsData } from "@/lib/resources";
import { getSiteSettings } from "@/lib/site-config";
import { getDictionary } from "@/lib/i18n";
import Image from "next/image";
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

export const revalidate = 60;

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = getDictionary(locale);

  const [site, featuredProjects, skills, testimonials] = await Promise.all([
    getSiteData(locale),
    getProjectsFull({ featured: true, perPage: 3 }, locale),
    getSkillCategories(locale),
    getTestimonialsData(locale),
  ]);

  const galleryImages = [
    ...new Map(
      featuredProjects
        .flatMap((p) => [p.cover, ...p.gallery])
        .filter((m): m is NonNullable<typeof m> => Boolean(m?.url))
        .map((m) => [m.url, m] as const)
    ).values(),
  ].slice(0, 4);

  const skillCategories = skills;
  const techNames = skillCategories.flatMap((c) => c.skills.map((s) => s.name)).slice(0, 12);
  const totalSkills = skillCategories.reduce((n, c) => n + c.skills.length, 0);
  const settings = getSiteSettings(site, locale);
  const available = settings.announcement_enabled;

  return (
    <>
      <Nav
        siteTitle={settings.site_title}
        authorName={settings.author_name}
        menu={site.menu}
        resumeUrl={site.resume?.url}
        resumeFilename={site.resume?.filename}
        t={t}
        locale={locale}
      />

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
                  {settings.author_role?.toUpperCase() ?? t.hero.roleFallback.toUpperCase()}
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-tight mb-8">
                  {settings.site_tagline}
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-lg md:text-xl text-secondary max-w-2xl mb-12 leading-relaxed">
                  {settings.site_description}
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap items-center gap-6">
                  <a
                    href="#projects"
                    className="group inline-flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-accent-hover hover:-translate-y-0.5 transition-all shadow-lg shadow-accent/20"
                  >
                    {t.hero.viewMyWork}
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  {available && (
                    <div className="flex items-center gap-2 font-mono text-xs text-secondary uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {t.hero.openToWork}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-5 flex justify-center">
              {settings.hero_image && (
                <Reveal delay={200} className="w-full max-w-md">
                  <div className="relative aspect-video rounded-jumbo overflow-hidden shadow-2xl ring-1 ring-line group">
                    <Image
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={settings.hero_image}
                      alt={`${settings.site_title} ${t.hero.heroImageAltSuffix}`}
                      width={960}
                      height={540}
                      sizes="(max-width: 1024px) 100vw, 42vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-surface/80 backdrop-blur-md px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest text-secondary">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      {t.hero.environment}: {process.env.VERCEL_ENV ?? process.env.NODE_ENV}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-14 text-secondary">
            <a href="#projects" aria-label={t.hero.scrollToProjects} className="animate-bounce">
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
              eyebrow={t.hero.featured.eyebrow}
              title={t.hero.featured.title}
              subtitle={t.hero.featured.subtitle}
              viewAllHref={`/${locale}/projects`}
              viewAllLabel={t.sectionHeader.viewAll}
            />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project, i) => (
              <Reveal key={project.id} delay={i * 100}>
                <ProjectCard project={project} index={i} t={t} locale={locale} />
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
                {t.hero.gallery.eyebrow}
              </p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
                {t.hero.gallery.title}
              </h2>
              <p className="mt-5 text-secondary text-lg max-w-xl leading-relaxed">
                {t.hero.gallery.subtitle}
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Gallery images={galleryImages} siteTitle={settings.site_title} t={t} />
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
                {t.hero.skills.eyebrow}
              </p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-8">
                {t.hero.skills.title}
              </h2>
              <p className="text-secondary text-lg leading-relaxed">
                {t.hero.skills.body}
              </p>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-6 flex items-center">
              <div className="relative overflow-hidden bg-white p-10 rounded-jumbo shadow-sm ring-1 ring-line w-full">
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4 mb-10">
                    <span className="font-mono text-xs text-secondary uppercase tracking-[0.2em]">
                      {t.hero.terminal.title}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase ${
                        available
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                            available ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${
                            available ? "bg-emerald-600" : "bg-amber-600"
                          }`}
                        />
                      </span>
                      {available ? t.hero.terminal.openToWork : t.hero.terminal.notAvailable}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                        {String(skillCategories.length).padStart(2, "0")}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                        {t.hero.terminal.categories}
                      </p>
                    </div>
                    <div>
                      <p className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
                        {totalSkills}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                        {t.hero.terminal.skills}
                      </p>
                    </div>
                    <div>
                      <p className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-green-600">
                        {t.hero.terminal.online}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                        {t.hero.terminal.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {skillCategories.map((category, i) => (
              <Reveal key={category.id} delay={i * 100}>
                <SkillCard category={category} t={t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 px-6">
          <div className="container mx-auto">
            <Reveal>
              <SectionHeader
                eyebrow={t.hero.testimonials.eyebrow}
                title={t.hero.testimonials.title}
                subtitle={t.hero.testimonials.subtitle}
              />
            </Reveal>
            <Reveal delay={100}>
              <div className="flex gap-8 overflow-x-auto pb-6 snap-x scrollbar-thin">
                {testimonials.map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <Reveal>
        <Cta email={settings.contact_email} techNames={techNames} available={available} t={t} />
      </Reveal>

      <Footer
        socialLinks={site.social_links}
        siteTitle={settings.site_title}
        authorName={settings.author_name}
        tagline={settings.site_description}
        t={t}
      />
    </>
  );
}
