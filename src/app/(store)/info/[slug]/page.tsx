import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";
import InfoPageView from "../../../../components/info/InfoPageView";
import { getInfoNavigation, getInfoPage } from "../../../../lib/api/infoPages";

type InfoRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: InfoRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getInfoPage(slug);
  if (!page) return {};
  return { title: `${page.title} — TREBA`, description: page.description };
}

export default async function InfoRoute({ params }: InfoRouteProps) {
  const { slug } = await params;
  const [page, navigation] = await Promise.all([getInfoPage(slug), getInfoNavigation()]);

  // Неизвестный slug → страница 404
  if (!page) {
    notFound();
  }

  return (
    <>
      <Header />
      <main>
        <InfoPageView page={page} navigation={navigation} />
      </main>
      <Footer />
    </>
  );
}