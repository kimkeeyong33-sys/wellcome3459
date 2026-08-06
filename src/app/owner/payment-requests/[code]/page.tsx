"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TicketQR from "@/components/cashticket/TicketQR";
import { formatPrice } from "@/lib/format";

type PayRequest = {
  code: string;
  storeName: string;
  amount: number;
  status: "pending" | "paid" | "canceled";
  ticketCode: string | null;
};

function payUrl(code: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/pay/${code}`;
}

export default function PaymentRequestDeliveryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [req, setReq] = useState<PayRequest | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/payment-requests/${code}`);
    const data = await res.json();
    if (res.ok) setReq(data.request);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000); // 결제 완료를 자동으로 감지
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const url = payUrl(code);

  const share = async () => {
    const text = `[${req?.storeName ?? "우리 매장"}] ${formatPrice(
      req?.amount ?? 0
    )} 금액권 결제 링크예요.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "캐시티켓 결제 요청", text, url });
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

  if (req?.status === "paid") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
        <div className="text-5xl">✅</div>
        <div className="text-xl font-bold text-navy">결제가 완료됐어요</div>
        <div className="text-3xl font-black" style={{ color: "#D9531E" }}>
          {formatPrice(req.amount)}
        </div>
        <div className="text-sm text-gray500">고객에게 티켓이 자동으로 발급됐어요.</div>
        <Link
          href="/owner/dashboard"
          className="w-full text-white text-center font-bold rounded-2xl text-lg mt-4"
          style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "16px 0" }}
        >
          대시보드로 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div
        className="px-5 pt-7 pb-6 text-white text-center"
        style={{ background: "linear-gradient(135deg, #0B2540, #1B3A5C)" }}
      >
        <div className="text-lg">💳 결제 링크가 만들어졌어요</div>
        <h1 className="font-display text-3xl mt-2">{req ? formatPrice(req.amount) : "..."}</h1>
        <div className="text-white/70 text-sm mt-2">고객 결제 대기중...</div>
      </div>

      <div className="flex-1 px-5 py-7 flex flex-col items-center gap-5">
        <TicketQR url={url} />
        <div className="text-center">
          <div className="text-xs text-gray500">결제 코드</div>
          <div className="font-display text-2xl tracking-[0.3em] text-navy mt-1">{code}</div>
        </div>

        <div className="w-full flex flex-col gap-2.5 mt-3">
          <button
            onClick={share}
            className="w-full text-white text-center font-bold rounded-2xl text-lg"
            style={{ background: "linear-gradient(135deg, #D9531E, #F2891F)", padding: "16px 0" }}
          >
            💬 카카오톡 등으로 결제 링크 보내기
          </button>
          <button
            onClick={share}
            className="w-full text-navy text-center font-bold rounded-2xl text-base border-2 border-gray200"
            style={{ padding: "14px 0" }}
          >
            {copied ? "링크가 복사됐어요 ✓" : "🔗 링크 복사하기"}
          </button>
        </div>

        <div className="text-xs text-gray500 text-center leading-relaxed bg-gray100 rounded-xl px-4 py-3 mt-2">
          고객이 결제를 완료하면 이 화면이 자동으로 바뀌어요. 창을 닫아도 괜찮아요 —
          대시보드 내역에서 언제든 확인할 수 있어요.
        </div>
      </div>

      <div className="px-5 pb-10">
        <Link href="/owner/dashboard" className="w-full text-center text-sm text-gray500 py-2 block">
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  );
}
