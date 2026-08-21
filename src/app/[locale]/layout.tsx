import PageTracker from "@/components/public/PageTracker";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <>
      <PageTracker locale={locale} />
      {children}
    </>
  );
}