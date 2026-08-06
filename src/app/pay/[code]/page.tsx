"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

type PayRequest = {
  code: string;
  storeName: string;
  amount: number;
  memo: string | null;
  status: "pending" | "paid" | "canceled";
  ticketCode: string | null;
};

export default function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [req, setReq] = useState<PayRequest | null>(null);
  const [tossConfigured, setTossConfigured] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/payment-requests/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "결제 요청을 찾을 수 없어요.");
        setLoading(false);
        return;
      }
      setReq(data.request);
      setTossConfigured(data.tossConfigured);
      setLoading(false);
    })();
  }, [code]);

  const payWithToss = async () => {
    if (!req) return;
    setError(null);
    setPaying(true);
    try {
      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY as string;
      const tossPayments = await loadTossPayments(clientKey);
      const origin = window.location.origin;
      await tossPayments.requestPayment("카드", {
        amount: req.amount,
        orderId: `${req.code}-${Date.now()}`,
        orderName: `${req.storeName} 금액권`,
        successUrl: `${origin}/pay/${req.code}/success`,
        failUrl: `${origin}/pay/${req.code}/fail`,
      });
    } catch (e) {
      setError((e as Error).message || "결제창을 여는 중 오류가 발생했어요.");
      setPaying(false);
    }
  };

  const payDemo = async () => {
    if (!req) return;
    setError(null);
    setPaying(true);
    try {
      const res = await fetch(`/api/payment-requests/${req.code}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "결제 처리 중 오류가 발생했어요.");
        setPaying(false);
        return;
      }
      window.location.href = `/t/${data.ticketCode}`;
    } catch {
      setError("결제 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray500">
        불러오는 중...
      </main>
    );
  }

  if (error && !req) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-3">
        <div className="text-4xl">😢</div>
        <div className="text-lg font-bold text-navy">{error}</div>
      </main>
    );
  }

  if (!req) return null;

  if (req.status === "paid") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-3">
        <div className="text-4xl">✅</div>
        <div className="text-lg font-bold text-navy">이미 결제가 완료됐어요</div>
        {req.ticketCode && (
          <Link href={`/t/${req.ticketCode}`} className="text-orange font-bold underline mt-2">
            내 티켓 보기
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-8 pb-7 text-white text-center"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="text-white/80 text-sm">{req.storeName}</div>
        <h1 className="font-display text-4xl mt-2">{formatPrice(req.amount)}</h1>
        {req.memo && <div className="text-white/80 text-sm mt-3">&ldquo;{req.memo}&rdquo;</div>}
      </div>

      <div className="flex-1 px-5 py-7 flex flex-col gap-5">
        <div className="rounded-2xl bg-gray100 px-4 py-4 text-xs text-gray500 leading-relaxed">
          결제하신 금액은 <b className="text-gray900">{req.storeName}</b>에서만 사용할 수 있는 선불
          금액권으로 즉시 발급돼요. 매장 사정으로 이용이 어려워질 경우 환불 규정에 따라 처리돼요.
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-orange w-5 h-5 flex-shrink-0"
          />
          <span className="text-sm text-gray500 leading-relaxed">
            <b className="text-gray900">[필수]</b>{" "}
            <Link href="/terms" target="_blank" className="text-orange font-bold underline">
              이용약관
            </Link>{" "}
            및{" "}
            <Link href="/privacy" target="_blank" className="text-orange font-bold underline">
              개인정보처리방침
            </Link>
            , 선불금 환불 규정에 동의합니다.
          </span>
        </label>

        {!tossConfigured && (
          <div className="text-xs text-gray500 bg-dangerBg rounded-xl px-4 py-3 leading-relaxed">
            ⚠️ 지금은 결제 연동이 준비 중이라 실제 결제 없이{" "}
            <b className="text-gray900">데모로 결제 완료 처리</b>돼요.
          </div>
        )}

        {error && <div className="text-sm text-orange font-medium">{error}</div>}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-white"
        style={{ boxShadow: "0 -8px 20px rgba(11,37,64,0.08)" }}
      >
        <button
          onClick={tossConfigured ? payWithToss : payDemo}
          disabled={!agreed || paying}
          className="w-full text-white text-center font-bold rounded-2xl text-lg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "18px 0" }}
        >
          {paying ? "처리 중..." : tossConfigured ? `${formatPrice(req.amount)} 결제하기` : "데모로 결제 완료 처리하기"}
        </button>
      </div>
    </main>
  );
}
