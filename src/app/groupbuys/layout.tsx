import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공동구매 · 지금 참여하면 더 싸요",
  description: "참여 수량이 늘어날수록 단가가 내려가는 공동구매 매물을 실시간으로 확인하세요.",
};

export default function GroupBuysLayout({ children }: { children: React.ReactNode }) {
  return children;
}
