"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TicketQR from "@/components/cashticket/TicketQR";
import { ticketUrl } from "@/lib/cashticket/code";
import { formatPrice, formatPriceInput, parsePriceInput } from "@/lib/format";

type Ticket = {
  code: string;
  storeName: string;
  balance: number;
  status: string;
};

export default function GiftPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [giftCode, setGiftCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tickets/${code}`);
      const data = await res.json();
      if (res.ok) setTicket(data.ticket);
    })();
  }, [code]);

  const amount = parsePriceInput(amountInput) ?? 0;

  const submit = async () => {
    setError(null);
    if (!amount || amount <= 0) {
      setError("선물할 금액을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${code}/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "선물하기 중 오류가 발생했어요.");
        return;
      }
      setGiftCode(data.code);
    } catch {
      setError("선물하기 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (giftCode) {
    const url = ticketUrl(giftCode);
    const share = async () => {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title: "캐시티켓 선물", text: "선물이 도착했어요!", url });
          return;
        } catch {
          // 취소 — 아래 복사로 이어짐
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 무시
      }
    };

    return (
      <main className="flex flex-col min-h-screen">
        <div
          className="px-5 pt-7 pb-6 text-white text-center"
          style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
        >
          <div className="text-lg">🎁 선물이 준비됐어요</div>
          <h1 className="font-display text-3xl mt-2">{formatPrice(amount)}</h1>
        </div>
        <div className="flex-1 px-5 py-7 flex flex-col items-center gap-5">
          <TicketQR url={url} />
          <div className="text-center">
            <div className="text-xs text-gray500">티켓 코드</div>
            <div className="font-display text-2xl tracking-[0.3em] text-navy mt-1">{giftCode}</div>
          </div>
          <button
            onClick={share}
            className="w-full text-white text-center font-bold rounded-2xl text-lg"
            style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "16px 0" }}
          >
            💬 카카오톡 등으로 전달하기
          </button>
          <button
            onClick={share}
            className="w-full text-navy text-center font-bold rounded-2xl text-base border-2 border-gray200"
            style={{ padding: "14px 0" }}
          >
            {copied ? "링크가 복사됐어요 ✓" : "🔗 링크 복사하기"}
          </button>
          <Link href={`/t/${code}`} className="text-sm text-gray500 underline mt-2">
            내 티켓으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href={`/t/${code}`} className="text-white/70 text-sm">
          ‹ 뒤로
        </Link>
        <h1 className="font-display text-2xl mt-3">잔액 나눠서 선물하기</h1>
        {ticket && (
          <p className="text-white/80 text-sm mt-2">
            {ticket.storeName} · 남은 잔액 {formatPrice(ticket.balance)}
          </p>
        )}
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6" style={{ paddingBottom: "40px" }}>
        <div>
          <label className="text-base font-bold text-navy mb-2 block">선물할 금액</label>
          <div className="relative">
            <input
              className="w-full border-2 border-gray200 rounded-xl px-4 pr-12 text-2xl font-black text-right outline-none focus:border-orange"
              style={{ height: "64px" }}
              placeholder="0"
              value={amountInput}
              onChange={(e) => setAmountInput(formatPriceInput(e.target.value))}
              inputMode="numeric"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray500">
              원
            </span>
          </div>
          {ticket && (
            <button
              onClick={() => setAmountInput(formatPriceInput(String(ticket.balance)))}
              className="text-sm font-bold text-orange mt-2"
            >
              전액 선물하기 ({formatPrice(ticket.balance)})
            </button>
          )}
        </div>

        {error && <div className="text-sm text-orange font-medium">{error}</div>}

        <button
          onClick={submit}
          disabled={submitting || !amount}
          className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {submitting ? "처리 중..." : "선물 만들기"}
        </button>
      </div>
    </main>
  );
}
