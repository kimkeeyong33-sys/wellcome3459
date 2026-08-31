"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_HEIGHT = 64;

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/deals", label: "매물", icon: "🔥" },
  { href: "/buy", label: "찾습니다", icon: "🔎" },
  { href: "/signup", label: "알림", icon: "🔔" },
  { href: "/mypage", label: "MY", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray200 flex z-40"
      style={{ height: `${NAV_HEIGHT}px` }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : (pathname ?? "").startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <span className="text-xl leading-none" style={{ opacity: active ? 1 : 0.45 }}>
              {tab.icon}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: active ? "#0B2540" : "#6B7480" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
