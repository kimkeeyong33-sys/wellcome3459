import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockDeals } from "@/lib/mockData";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let name = "덤핑매물 상세";
  let description = "B2B 덤핑 재고 특가 정보를 지금 확인하세요.";
  let dealPrice: number | null = null;
  let originalPrice: number | null = null;
  let image: string | null = null;

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("deals")
      .select("title, description, deal_price, original_price, images")
      .eq("id", id)
      .single();
    if (data) {
      name = data.title;
      description = data.description || `${Number(data.deal_price).toLocaleString()}원 특가 · 덤핑점핑`;
      dealPrice = data.deal_price;
      originalPrice = data.original_price;
      image = data.images?.[0] ?? null;
    }
  } else {
    const deal = mockDeals.find((d) => d.id === id);
    if (deal) {
      name = deal.title;
      description = `${deal.deal_price.toLocaleString()}원 특가 · 덤핑점핑`;
      dealPrice = deal.deal_price;
      originalPrice = deal.original_price ?? null;
      image = deal.images?.[0] ?? null;
    }
  }

  const discountPct =
    originalPrice && dealPrice ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : 0;
  const priceLabel = dealPrice
    ? `${Number(dealPrice).toLocaleString()}원${discountPct > 0 ? ` (${discountPct}% ↓)` : ""}`
    : "";
  const ogTitle = priceLabel ? `${name} · ${priceLabel}` : name;
  const title = `${ogTitle} | 덤핑점핑`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function DealDetailLayout({ children }: Props) {
  return children;
}
