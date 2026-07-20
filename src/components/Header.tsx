"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          B2B<span className="text-blue-600">Auction</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            경매 목록
          </Link>
          {!loading && user?.role === "SELLER" && (
            <Link href="/auctions/new" className="hover:underline">
              경매 등록
            </Link>
          )}
          {!loading && user && (
            <Link href="/mypage" className="hover:underline">
              마이페이지
            </Link>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="hover:underline">
                로그인
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                회원가입
              </Link>
            </>
          )}
          {!loading && user && (
            <button
              onClick={() => logout()}
              className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              {user.name}님 로그아웃
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
