import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import type { PageRow } from "@/lib/resources";
import { loadSiteSettings } from "@/lib/site-config";
import { getDictionary } from "@/lib/i18n";
import SubNav from "@/components/public/SubNav";
import Markdown from "@/components/public/Markdown";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 60;

async function loadPage(slug: string, locale: string): Promise<PageRow | null> {
  return queryOne<PageRow>(
    `SELECT * FROM pages WHERE slug = $1 AND is_published = true
     AND (locale = $2 OR locale = 'en')
     ORDER BY (locale = $2) DESC
     LIMIT 1`,
    [slug, locale]
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  try {
    const page = await loadPage(slug, locale);
    if (!page) return { title: t.projects.breadcrumb };
    return {
      title: page.meta_title ?? page.title,
      description: page.meta_description ?? undefined,
    };
  } catch {
    return { title: t.projects.breadcrumb };
  }
}

export default async function PageDetailPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  const [page, settings] = await Promise.all([
    loadPage(slug, locale),
    loadSiteSettings(locale),
  ]);
  if (!page) notFound();

  return (
    <>
      <SubNav authorName={settings.author_name} locale={locale} t={t} />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-2 text-xs font-mono text-secondary mb-8 uppercase tracking-widest">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {settings.site_title}
            </Link>
            <FaChevronRight className="text-[10px]" />
            <span className="text-primary font-bold">{page.title}</span>
          </div>

          <article className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">{page.title}</h1>
            <Markdown content={String(page.content ?? "")} />
          </article>
        </div>
      </main>
    </>
  );
}