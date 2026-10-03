import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShowcaseDetail from "@/components/showcase-detail";
import { absoluteStudioUrl, fetchStudioPublicState, STUDIO_PUBLIC_URL } from "@/lib/public-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const state = await fetchStudioPublicState();
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return { title: "Projeto não encontrado · Studio K" };
  const image = absoluteStudioUrl(item.coverUrl || item.gifUrl || state.site.logoUrl);
  const url = `${STUDIO_PUBLIC_URL}/portfolio/${encodeURIComponent(item.id)}`;
  return {
    title: `${item.name} · Portfólio Studio K`,
    description: item.description || "Projeto do portfólio Studio K.",
    alternates: { canonical: url },
    openGraph: {
      title: item.name,
      description: item.description || "Projeto do portfólio Studio K.",
      url,
      siteName: "Studio K",
      type: "website",
      images: image ? [{ url: image }] : undefined
    }
  };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { id } = await params;
  const state = await fetchStudioPublicState();
  const item = state.items.find((entry) => entry.id === id);
  if (!item) notFound();
  return <ShowcaseDetail kind="portfolio" item={item} />;
}
