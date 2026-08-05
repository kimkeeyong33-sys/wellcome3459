"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TicketQR from "@/components/cashticket/TicketQR";
import { ticketUrl } from "@/lib/cashticket/code";
import { formatPrice } from "@/lib/format";

type Ticket = {
  code: string;
  storeName: string;
  issuedAmount: number;
  balance: number;
  status: string;
  expiresAt: string;
};

export default function TicketDeliveryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tickets/${code}`);
      const data = await res.json();
      if (res.ok) setTicket(data.ticket);
    })();
  }, [code]);

  const url = ticketUrl(code);

  const share = async () => {
    const text = `[${ticket?.storeName ?? "우리 매장"}] ${formatPrice(
      ticket?.issuedAmount ?? 0
    )} 금액권을 보내드려요!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "캐시티켓", text, url });
        setShared(true);
        return;
      } catch {
        // 공유 취소 — 아래 복사로 이어짐
      }
    }
    await copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한이 없는 드문 환경 — 화면에 보이는 링크를 직접 복사하면 돼요.
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white text-center"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="text-lg">✅ 티켓이 발행됐어요</div>
        <h1 className="font-display text-3xl mt-2">
          {ticket ? formatPrice(ticket.issuedAmount) : "..."}
        </h1>
      </div>

      <div className="flex-1 px-5 py-7 flex flex-col items-center gap-5">
        <TicketQR url={url} />

        <div className="text-center">
          <div className="text-xs text-gray500">티켓 코드</div>
          <div className="font-display text-2xl tracking-[0.3em] text-navy mt-1">{code}</div>
        </div>

        {ticket && (
          <div className="text-xs text-gray500 text-center leading-relaxed">
            유효기간 {new Date(ticket.expiresAt).toLocaleDateString("ko-KR")}까지
          </div>
        )}

        <div className="w-full flex flex-col gap-2.5 mt-3">
          <button
            onClick={share}
            className="w-full text-white text-center font-bold rounded-2xl text-lg"
            style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "16px 0" }}
          >
            💬 카카오톡 등으로 전달하기
          </button>
          <button
            onClick={copyLink}
            className="w-full text-navy text-center font-bold rounded-2xl text-base border-2 border-gray200"
            style={{ padding: "14px 0" }}
          >
            {copied ? "링크가 복사됐어요 ✓" : "🔗 링크 복사하기"}
          </button>
        </div>
        {shared && (
          <div className="text-sm text-gray500 text-center">전달 화면을 여셨어요. 잘 보내셨나요?</div>
        )}

        <div className="text-xs text-gray500 text-center leading-relaxed bg-gray100 rounded-xl px-4 py-3 mt-2">
          링크를 받은 고객이 직접 접속하면 티켓을 확인하고 저장할 수 있어요.
          <br />
          매장에서 QR을 보여주면 사장님이 스캔해서 바로 결제할 수도 있어요.
        </div>
      </div>

      <div className="px-5 pb-10 flex flex-col gap-2.5">
        <Link
          href="/owner/tickets/new"
          className="w-full text-navy text-center font-bold rounded-2xl text-base border-2 border-gray200"
          style={{ padding: "14px 0" }}
        >
          🎫 티켓 하나 더 발행하기
        </Link>
        <Link href="/owner/dashboard" className="w-full text-center text-sm text-gray500 py-2">
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  );
}
