import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "알림 해지 · 탈퇴",
  description: "가입하신 휴대폰 번호를 입력하시면 알림 수신을 중단하고 등록된 개인정보를 삭제해드려요.",
  robots: { index: false, follow: true },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
