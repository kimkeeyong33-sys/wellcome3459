import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "재고 매물 무료 등록",
  description:
    "남는 재고, 반품·이월 상품을 무료로 등록하면 점핑매니저가 검토 후 구매처를 직접 연결해드립니다.",
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
