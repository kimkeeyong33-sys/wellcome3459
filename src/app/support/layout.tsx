import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "정부지원금 정보",
  description: "중소기업·소상공인을 위한 정부지원사업 공고를 지역별로 확인하세요. (기업마당 연동)",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
