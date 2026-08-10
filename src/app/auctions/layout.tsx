import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "하향경매 · 지금 이 가격, 살까요?",
  description: "시간이 지날수록 가격이 자동으로 내려가는 하향경매 매물을 실시간으로 확인하세요.",
};

export default function AuctionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
