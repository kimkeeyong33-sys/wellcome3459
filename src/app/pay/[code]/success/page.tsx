"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaySuccessPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={null}>
      <PaySuccessInner params={params} />
    </Suspense>
  );
}

function PaySuccessInner({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setError("결제 정보가 올바르지 않아요.");
      return;
    }

    (async () => {
      const res = await fetch(`/api/payment-requests/${code}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "결제 승인 중 오류가 발생했어요.");
        return;
      }
      window.location.href = `/t/${data.ticketCode}`;
    })();
  }, [code, searchParams]);

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-3">
        <div className="text-4xl">😢</div>
        <div className="text-lg font-bold text-navy">{error}</div>
        <Link href={`/pay/${code}`} className="text-orange font-bold underline mt-2">
          다시 시도하기
        </Link>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen text-gray500">
      결제를 확인하는 중...
    </main>
  );
}
