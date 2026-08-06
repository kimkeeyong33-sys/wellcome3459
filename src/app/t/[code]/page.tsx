"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TicketQR from "@/components/cashticket/TicketQR";
import { ticketUrl } from "@/lib/cashticket/code";
import { addToWallet, isInWallet } from "@/lib/cashticket/wallet";
import { formatPrice } from "@/lib/format";

type Ticket = {
  code: string;
  storeName: string;
  storeVerified: boolean;
  issuedAmount: number;
  balance: number;
  status: string;
  expiresAt: string;
  memo: string | null;
};

type Tx = { type: string; amount: number; createdAt: string };

const TX_LABEL: Record<string, string> = {
  issue: "🎫 발행",
  use: "💳 매장에서 사용",
  gift_out: "🎁 선물 보냄",
  gift_in: "🎁 선물 받음",
};

export default function TicketReceivePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [tx, setTx] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    setSaved(isInWallet(code));
    (async () => {
      const res = await fetch(`/api/tickets/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "티켓을 찾을 수 없어요.");
        setLoading(false);
        return;
      }
      setTicket(data.ticket);
      setTx(data.transactions ?? []);
      setLoading(false);
      // 링크로 들어오면 자동으로 내 모아보기에 저장돼요 (별도 로그인 없이 이 기기에 보관).
      addToWallet(code);
      setSaved(true);
    })();
  }, [code]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray500">
        불러오는 중...
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-3">
        <div className="text-4xl">😢</div>
        <div className="text-lg font-bold text-navy">{error}</div>
        <Link href="/my" className="text-orange font-bold underline mt-2">
          내 모아보기로 가기
        </Link>
      </main>
    );
  }

  const isExpired = new Date(ticket.expiresAt).getTime() < now;
  const isUsedUp = ticket.status === "used" || ticket.balance === 0;
  const isAvailable = !isExpired && !isUsedUp;
  const daysLeft = Math.ceil(
    (new Date(ticket.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)
  );

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white text-center"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="flex items-center justify-center gap-1.5 text-white/80 text-sm">
          {ticket.storeName}
          {ticket.storeVerified && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold bg-white/15 rounded-full px-2 py-0.5">
              🏅 인증 매장
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl mt-2">{formatPrice(ticket.balance)}</h1>
        <div className="text-white/60 text-xs mt-1">
          {ticket.issuedAmount !== ticket.balance && `발행 금액 ${formatPrice(ticket.issuedAmount)} 중 `}
          남은 잔액
        </div>
        {ticket.memo && <div className="text-white/80 text-sm mt-3">&ldquo;{ticket.memo}&rdquo;</div>}
      </div>

      <div className="flex-1 px-5 py-7 flex flex-col items-center gap-5">
        {!isAvailable ? (
          <div className="rounded-2xl bg-gray100 px-5 py-8 text-center w-full">
            <div className="text-3xl mb-2">{isExpired ? "⏰" : "✅"}</div>
            <div className="text-base font-bold text-gray500">
              {isExpired ? "유효기간이 지난 티켓이에요" : "이미 다 사용한 티켓이에요"}
            </div>
          </div>
        ) : (
          <>
            <TicketQR url={ticketUrl(code)} />
            <div className="text-center">
              <div className="text-xs text-gray500">매장에서 이 화면을 보여주세요</div>
              <div className="font-display text-2xl tracking-[0.3em] text-navy mt-1">{code}</div>
            </div>
            {daysLeft <= 14 && (
              <div className="text-sm font-bold text-orange bg-dangerBg rounded-xl px-4 py-2.5 w-full text-center">
                ⏰ {daysLeft > 0 ? `${daysLeft}일 후 소멸 예정이에요` : "오늘 소멸돼요"}
              </div>
            )}
          </>
        )}

        {saved && (
          <div className="text-sm text-gray500 flex items-center gap-1.5">
            ✓ 내 모아보기에 저장됐어요
          </div>
        )}

        {isAvailable && (
          <Link
            href={`/t/${code}/gift`}
            className="w-full text-navy text-center font-bold rounded-2xl text-base border-2 border-gray200"
            style={{ padding: "14px 0" }}
          >
            🎁 잔액 나눠서 선물하기
          </Link>
        )}

        {tx.length > 0 && (
          <div className="w-full mt-4">
            <div className="text-sm font-bold text-navy mb-2.5">사용 내역</div>
            <div className="flex flex-col gap-2">
              {tx.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-gray100 px-4 py-3"
                >
                  <div className="text-sm text-gray900">{TX_LABEL[t.type] ?? t.type}</div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-navy">{formatPrice(t.amount)}</div>
                    <div className="text-[11px] text-gray500">
                      {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/my" className="text-sm text-gray500 underline mt-2">
          내 모아보기 전체 보기
        </Link>
      </div>
    </main>
  );
}
