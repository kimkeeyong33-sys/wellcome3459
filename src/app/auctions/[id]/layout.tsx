import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockAuctions } from "@/lib/mockData";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let title = "하향경매 상세";
  let description = "시간이 지날수록 가격이 내려가는 하향경매 매물입니다.";

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("auctions").select("title, description").eq("id", id).single();
    if (data) {
      title = data.title;
      description = data.description || "지금 이 가격, 살까요? · 점핑비드 하향경매";
    }
  } else {
    const auction = mockAuctions.find((a) => a.id === id);
    if (auction) {
      title = auction.title;
      description = "지금 이 가격, 살까요? · 점핑비드 하향경매";
    }
  }

  return { title: `${title} | 점핑비드`, description };
}

export default function AuctionDetailLayout({ children }: Props) {
  return children;
}
