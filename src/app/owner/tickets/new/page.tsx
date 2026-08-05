"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwnerSession, OwnerSession } from "@/lib/cashticket/wallet";
import { formatPriceInput, parsePriceInput } from "@/lib/format";

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000];
const VALID_OPTIONS = [
  { label: "1개월", days: 30 },
  { label: "3개월", days: 90 },
  { label: "6개월", days: 180 },
  { label: "1년", days: 365 },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [validDays, setValidDays] = useState(90);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = getOwnerSession();
    if (!s) {
      router.replace("/owner/login");
      return;
    }
    setSession(s);
  }, [router]);

  const amount = parsePriceInput(amountInput) ?? 0;

  const submit = async () => {
    setError(null);
    if (!session) return;
    if (!amount || amount <= 0) {
      setError("발행할 금액을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-store-id": session.storeId },
        body: JSON.stringify({ amount, validDays, memo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "발행 중 오류가 발생했어요.");
        return;
      }
      router.push(`/owner/tickets/${data.code}`);
    } catch {
      setError("발행 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <Link href="/owner/dashboard" className="text-white/70 text-sm">
          ‹ 뒤로
        </Link>
        <h1 className="font-display text-2xl mt-3">티켓 발행하기</h1>
        <p className="text-white/80 text-sm mt-2">금액과 유효기간만 정하면 3분이면 끝나요.</p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-6" style={{ paddingBottom: "108px" }}>
        <div>
          <label className="text-base font-bold text-navy mb-2 block">발행 금액</label>
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
          <div className="grid grid-cols-4 gap-2 mt-2.5">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmountInput(formatPriceInput(String(a)))}
                className="text-sm font-bold py-2.5 rounded-xl border-2 border-gray200 text-gray500"
              >
                {(a / 10000).toLocaleString()}만원
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-base font-bold text-navy mb-2 block">유효기간</label>
          <div className="grid grid-cols-4 gap-2">
            {VALID_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => setValidDays(o.days)}
                className={`text-sm py-3 rounded-xl border-2 font-bold text-center ${
                  validDays === o.days
                    ? "bg-navy text-white border-navy"
                    : "border-gray200 text-gray500"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-base font-bold text-navy mb-2 flex items-center gap-1.5">
            메모
            <span className="text-xs font-medium text-gray500">선택</span>
          </label>
          <input
            className="w-full border-2 border-gray200 rounded-xl px-4 text-base outline-none focus:border-orange"
            style={{ height: "52px" }}
            placeholder="예: 생일 축하 선물, 단골 감사 티켓"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-orange font-medium">{error}</div>}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
        style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)" }}
      >
        <button
          onClick={submit}
          disabled={submitting || !amount}
          className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {submitting ? "발행 중..." : amount ? `${amount.toLocaleString()}원 발행하기` : "금액을 입력해주세요"}
        </button>
      </div>
    </main>
  );
}
