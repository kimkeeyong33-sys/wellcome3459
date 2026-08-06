"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearOwnerSession, getOwnerSession, OwnerSession } from "@/lib/cashticket/wallet";
import { formatPrice } from "@/lib/format";

type DashboardData = {
  issuedTotal: number;
  usedTotal: number;
  unusedBalance: number;
  ticketCount: number;
  recent: {
    id: string;
    type: string;
    amount: number;
    createdAt: string;
    ticketCode: string;
  }[];
};

const TX_LABEL: Record<string, string> = {
  issue: "🎫 발행",
  use: "💳 사용",
  gift_out: "🎁 선물 보냄",
  gift_in: "🎁 선물 받음",
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getOwnerSession();
    if (!s) {
      router.replace("/owner/login");
      return;
    }
    setSession(s);
    (async () => {
      const res = await fetch("/api/owner/dashboard", {
        headers: { "x-store-id": s.storeId },
      });
      const json = await res.json();
      if (res.ok) setData(json);
      setLoading(false);
    })();
  }, [router]);

  const logout = () => {
    clearOwnerSession();
    router.push("/");
  };

  if (!session || loading) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray500">
        불러오는 중...
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/70 text-sm">{session.ownerName} 사장님</div>
            <h1 className="font-display text-2xl mt-1">{session.storeName}</h1>
            {session.businessVerified ? (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-white/90 bg-white/10 rounded-full px-2.5 py-1 mt-2">
                🏅 인증 매장
              </div>
            ) : (
              <Link
                href="/owner/settings"
                className="inline-flex items-center gap-1 text-xs font-bold text-white/70 underline mt-2"
              >
                사업자등록 인증하고 신뢰도 높이기 ›
              </Link>
            )}
          </div>
          <button onClick={logout} className="text-white/60 text-sm underline">
            로그아웃
          </button>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-5 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray500 font-bold">발행액</div>
            <div className="text-sm font-black text-navy mt-1">
              {formatPrice(data?.issuedTotal ?? 0)}
            </div>
          </div>
          <div className="border-x border-gray200">
            <div className="text-xs text-gray500 font-bold">사용액</div>
            <div className="text-sm font-black text-navy mt-1">
              {formatPrice(data?.usedTotal ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray500 font-bold">미사용잔액</div>
            <div className="text-sm font-black" style={{ color: "#D9531E" }}>
              {formatPrice(data?.unusedBalance ?? 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 grid grid-cols-2 gap-3">
        <Link
          href="/owner/tickets/new"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl text-white text-center py-6"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)" }}
        >
          <span className="text-3xl">🎫</span>
          <span className="font-bold text-base">티켓 발행</span>
        </Link>
        <Link
          href="/owner/scan"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl text-white text-center py-6"
          style={{ background: "#0B2540" }}
        >
          <span className="text-3xl">📷</span>
          <span className="font-bold text-base">QR 스캔·결제확인</span>
        </Link>
      </div>

      <div className="px-5 pt-8 pb-10 flex-1">
        <div className="text-base font-bold text-navy mb-3.5">최근 내역</div>
        {(!data || data.recent.length === 0) && (
          <div className="text-center text-gray500 text-sm py-10 bg-gray100 rounded-2xl">
            아직 내역이 없어요. 첫 티켓을 발행해보세요!
          </div>
        )}
        <div className="flex flex-col gap-2">
          {data?.recent.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-gray200 px-4 py-3"
            >
              <div>
                <div className="text-sm font-bold text-navy">{TX_LABEL[t.type] ?? t.type}</div>
                <div className="text-xs text-gray500 mt-0.5">
                  코드 {t.ticketCode} · {new Date(t.createdAt).toLocaleString("ko-KR")}
                </div>
              </div>
              <div className="text-sm font-black text-navy">{formatPrice(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
