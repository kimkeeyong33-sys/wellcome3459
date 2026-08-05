"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/cashticket/QRScanner";
import { getOwnerSession, OwnerSession } from "@/lib/cashticket/wallet";
import { formatPrice, formatPriceInput, parsePriceInput } from "@/lib/format";

type Ticket = {
  code: string;
  storeName: string;
  balance: number;
  status: string;
  expiresAt: string;
};

export default function OwnerScanPage() {
  const router = useRouter();
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ balance: number } | null>(null);
  const [useCamera, setUseCamera] = useState(true);

  useEffect(() => {
    const s = getOwnerSession();
    if (!s) {
      router.replace("/owner/login");
      return;
    }
    setSession(s);
  }, [router]);

  const lookup = async (code: string) => {
    setLookupError(null);
    setTicket(null);
    setResult(null);
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) return;
    const res = await fetch(`/api/tickets/${clean}`);
    const data = await res.json();
    if (!res.ok) {
      setLookupError(data.error || "티켓을 찾을 수 없어요.");
      return;
    }
    setTicket(data.ticket);
    setUseCamera(false);
  };

  const confirmCharge = async () => {
    if (!session || !ticket) return;
    setError(null);
    const amount = parsePriceInput(amountInput) ?? 0;
    if (!amount || amount <= 0) {
      setError("결제할 금액을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/tickets/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-store-id": session.storeId },
        body: JSON.stringify({ code: ticket.code, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "결제 처리 중 오류가 발생했어요.");
        return;
      }
      setResult({ balance: data.balance });
    } catch {
      setError("결제 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTicket(null);
    setManualCode("");
    setAmountInput("");
    setResult(null);
    setLookupError(null);
    setUseCamera(true);
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
        <h1 className="font-display text-2xl mt-3">QR 스캔·결제 확인</h1>
      </div>

      {result ? (
        <div className="flex-1 px-5 py-10 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">✅</div>
          <div className="text-xl font-bold text-navy">결제가 확인됐어요</div>
          <div className="text-sm text-gray500">남은 잔액</div>
          <div className="text-3xl font-black" style={{ color: "#D9531E" }}>
            {formatPrice(result.balance)}
          </div>
          <button
            onClick={reset}
            className="w-full text-white text-center font-bold rounded-2xl text-lg mt-4"
            style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "16px 0" }}
          >
            다음 손님 스캔하기
          </button>
        </div>
      ) : (
        <div className="flex-1 px-5 py-6 flex flex-col gap-5" style={{ paddingBottom: "40px" }}>
          {!ticket && (
            <>
              {useCamera && <QRScanner onScan={(code) => lookup(code)} />}
              <div className="text-center text-sm text-gray500">또는 코드를 직접 입력하세요</div>
              <div className="flex gap-2">
                <input
                  className="flex-1 min-w-0 border-2 border-gray200 rounded-xl px-4 text-xl font-bold text-center tracking-[0.2em] outline-none focus:border-orange uppercase"
                  style={{ height: "56px" }}
                  placeholder="티켓 코드"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && lookup(manualCode)}
                  maxLength={6}
                />
                <button
                  onClick={() => lookup(manualCode)}
                  className="text-white font-bold rounded-xl text-base px-5 whitespace-nowrap flex-shrink-0"
                  style={{ background: "#0B2540" }}
                >
                  조회
                </button>
              </div>
              {lookupError && (
                <div className="text-sm text-orange font-medium text-center">{lookupError}</div>
              )}
            </>
          )}

          {ticket && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border-2 border-gray200 px-5 py-4 text-center">
                <div className="text-xs text-gray500">티켓 코드 {ticket.code}</div>
                <div className="text-sm text-gray500 mt-2">사용 가능 잔액</div>
                <div className="text-3xl font-black text-navy mt-1">
                  {formatPrice(ticket.balance)}
                </div>
              </div>

              <div>
                <label className="text-base font-bold text-navy mb-2 block">결제 금액</label>
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
                <button
                  onClick={() => setAmountInput(formatPriceInput(String(ticket.balance)))}
                  className="text-sm font-bold text-orange mt-2"
                >
                  전액 사용 ({formatPrice(ticket.balance)})
                </button>
              </div>

              {error && <div className="text-sm text-orange font-medium">{error}</div>}

              <button
                onClick={confirmCharge}
                disabled={submitting}
                className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
              >
                {submitting ? "처리 중..." : "결제 확정"}
              </button>
              <button onClick={reset} className="text-sm text-gray500 py-1">
                다른 티켓 조회하기
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
