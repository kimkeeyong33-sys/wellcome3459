import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mockGroupBuys } from "@/lib/mockData";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let title = "공동구매 상세";
  let description = "참여 수량이 늘어날수록 단가가 내려가는 공동구매입니다.";

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("group_buys").select("title, description").eq("id", id).single();
    if (data) {
      title = data.title;
      description = data.description || "지금 참여하면 더 싸요 · 점핑비드 공동구매";
    }
  } else {
    const groupBuy = mockGroupBuys.find((g) => g.id === id);
    if (groupBuy) {
      title = groupBuy.title;
      description = "지금 참여하면 더 싸요 · 점핑비드 공동구매";
    }
  }

  return { title: `${title} | 점핑비드`, description };
}

export default function GroupBuyDetailLayout({ children }: Props) {
  return children;
}
