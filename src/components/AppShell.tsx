"use client";

import { usePathname } from "next/navigation";
import BottomNav, { NAV_HEIGHT } from "./BottomNav";

// 관리자 화면은 운영자 전용 도구라 회원용 하단 탭바를 보여주지 않습니다.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = (pathname ?? "").startsWith("/admin");

  return (
    <>
      <div style={{ paddingBottom: isAdmin ? 0 : `${NAV_HEIGHT}px` }}>{children}</div>
      {!isAdmin && <BottomNav />}
    </>
  );
}
