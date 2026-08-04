import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockDeals } from "@/lib/mockData";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let title = "덤핑매물 상세";
  let description = "B2B 덤핑 재고 특가 정보를 지금 확인하세요.";

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("deals")
      .select("title, description, deal_price")
      .eq("id", id)
      .single();
    if (data) {
      title = data.title;
      description = data.description || `${Number(data.deal_price).toLocaleString()}원 특가 · 덤핑점핑`;
    }
  } else {
    const deal = mockDeals.find((d) => d.id === id);
    if (deal) {
      title = deal.title;
      description = `${deal.deal_price.toLocaleString()}원 특가 · 덤핑점핑`;
    }
  }

  return { title: `${title} | 덤핑점핑`, description };
}

export default function DealDetailLayout({ children }: Props) {
  return children;
}
